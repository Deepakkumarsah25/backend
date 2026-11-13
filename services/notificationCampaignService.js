import { randomUUID } from "node:crypto";
import { messaging } from "../firebase/firebaseAdmin.js";
import DeviceToken from "../models/notification/DeviceToken.js";
import NotificationCampaign from "../models/notification/NotificationCampaign.js";
import NotificationPreference from "../models/notification/NotificationPreference.js";
import User from "../models/User.js";
import UserNotification from "../models/notification/UserNotification.js";
import { repairLegacyNotificationText } from "./notificationText.js";
import { shouldAttemptDevicePush } from "./notificationReliabilityPolicy.js";
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
  notificationAudienceFilter,
  notificationPreferenceAllows,
} from "./notificationPolicy.js";

const BATCH_SIZE = 300;
const FCM_BATCH_SIZE = 500;
const CAMPAIGN_LEASE_MS = 5 * 60 * 1000;
const INVALID_FCM_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const renewCampaignLease = async (campaignId, lease) => {
  const result = await NotificationCampaign.updateOne(
    { _id: campaignId, status: "publishing", fanoutLeaseOwner: lease.owner, fanoutLeaseGeneration: lease.generation, fanoutLeaseExpiresAt: { $gt: new Date() } },
    { $set: { fanoutLeaseExpiresAt: new Date(Date.now() + CAMPAIGN_LEASE_MS), fanoutStartedAt: new Date() } },
  );
  if (!result.modifiedCount) throw new Error("Notification campaign lease was lost.");
};

const stringifyData = (data = {}) => Object.fromEntries(
  Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : String(value)]),
);

const toClientNotification = (item) => ({
  _id: String(item._id),
  campaignId: item.campaignId ? String(item.campaignId) : undefined,
  title: repairLegacyNotificationText(item.title),
  message: repairLegacyNotificationText(item.message),
  type: item.type,
  imageUrl: item.image || "",
  deepLink: item.deepLink || "",
  isRead: Boolean(item.isRead),
  createdAt: item.createdAt,
  readAt: item.readAt || null,
  relatedId: item.relatedId ? String(item.relatedId) : null,
  actionType: item.actionType || "none",
  actionUrl: item.actionUrl || "",
  metadata: item.metadata || {},
});

export const getUserNotificationPage = async (userId, { limit = 20, cursor } = {}) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const query = { userId };
  if (cursor) {
    const decoded = decodeNotificationCursor(cursor);
    if (!decoded) return { invalidCursor: true };
    query.$or = [
      { createdAt: { $lt: decoded.createdAt } },
      { createdAt: decoded.createdAt, _id: { $lt: decoded.id } },
    ];
  }
  const items = await UserNotification.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit + 1)
    .lean();
  const hasMore = items.length > safeLimit;
  const pageItems = hasMore ? items.slice(0, safeLimit) : items;
  return {
    notifications: pageItems.map(toClientNotification),
    pagination: {
      limit: safeLimit,
      hasMore,
      nextCursor: hasMore && pageItems.length ? encodeNotificationCursor(pageItems[pageItems.length - 1]) : null,
    },
  };
};

const sendOneBatch = async (tokens, campaign) => {
  const message = {
    tokens,
    notification: {
      title: repairLegacyNotificationText(campaign.title),
      body: repairLegacyNotificationText(campaign.message),
    },
    data: stringifyData({
      campaignId: String(campaign._id),
      type: campaign.type,
      title: repairLegacyNotificationText(campaign.title),
      message: repairLegacyNotificationText(campaign.message),
      relatedId: campaign.relatedId ? String(campaign.relatedId) : undefined,
      routeId: campaign.metadata?.routeId || undefined,
      actionType: campaign.actionType || (campaign.type === "tracking" ? "tracking" : undefined),
      actionUrl: campaign.actionUrl || undefined,
      ...(campaign.deepLink ? { deepLink: campaign.deepLink } : {}),
    }),
    android: { priority: "high", notification: { channelId: "vip-party", sound: "default" } },
  };
  return messaging.sendEachForMulticast(message);
};

const deliverCampaignBatch = async (campaign, notifications, deviceRows, lease) => {
  const notificationIds = notifications.map((item) => item._id);
  await UserNotification.updateMany(
    { _id: { $in: notificationIds }, $or: [{ pushDeliveryGeneration: { $lt: lease.generation } }, { pushDeliveryGeneration: { $exists: false } }] },
    { $set: { pushDeliveryGeneration: lease.generation } },
  );
  const leasedNotifications = await UserNotification.find({ _id: { $in: notificationIds }, pushDeliveryGeneration: lease.generation }).lean();
  const notificationByUser = new Map(leasedNotifications.map((item) => [String(item.userId), item]));
  const tokenEntries = deviceRows
    .filter((device) => notificationByUser.has(String(device.userId)))
    .map((device) => ({ token: device.fcmToken, deviceId: device.deviceId, userId: String(device.userId), notificationId: notificationByUser.get(String(device.userId))._id }));
  const perUser = new Map();
  const tokenFailures = new Map();
  const invalidTokens = [];
  let successes = 0;
  let failures = 0;
  const unsentEntries = [];
  for (const entry of tokenEntries) {
    const notification = notificationByUser.get(entry.userId);
    const prior = (notification.pushDeliveries || []).find((item) => item.deviceId === entry.deviceId);
    if (!shouldAttemptDevicePush(prior)) continue; // Sent, failed, or ambiguous processing attempts are never duplicated automatically.
    const claim = await UserNotification.updateOne(
      { _id: entry.notificationId, pushDeliveryGeneration: lease.generation, pushDeliveries: { $not: { $elemMatch: { deviceId: entry.deviceId } } } },
      { $push: { pushDeliveries: { deviceId: entry.deviceId, status: "processing", attempts: 1, leaseGeneration: lease.generation, lastAttemptAt: new Date() } } },
    );
    if (claim.modifiedCount) unsentEntries.push(entry);
  }
  for (let offset = 0; offset < unsentEntries.length; offset += FCM_BATCH_SIZE) {
    await renewCampaignLease(campaign._id, lease);
    const currentBatch = unsentEntries.slice(offset, offset + FCM_BATCH_SIZE);
    let response;
    const heartbeat = setInterval(() => { void renewCampaignLease(campaign._id, lease).catch(() => {}); }, 60_000);
    heartbeat.unref?.();
    try {
      response = await sendOneBatch(currentBatch.map((entry) => entry.token), campaign);
    } catch (error) {
      response = { responses: currentBatch.map(() => ({ success: false, error })) };
    } finally {
      clearInterval(heartbeat);
    }
    for (let index = 0; index < currentBatch.length; index += 1) {
      const entry = currentBatch[index];
      const result = response.responses[index] || { success: false, error: new Error("Missing FCM result") };
      const delivered = Boolean(result.success);
      const code = String(result.error?.code || "");
      if (delivered) {
        successes += 1;
        perUser.set(entry.userId, (perUser.get(entry.userId) || 0) + 1);
      } else {
        failures += 1;
        tokenFailures.set(entry.userId, (tokenFailures.get(entry.userId) || 0) + 1);
        if (INVALID_FCM_CODES.has(code)) invalidTokens.push(entry.token);
      }
      await UserNotification.updateOne(
        { _id: entry.notificationId, pushDeliveryGeneration: lease.generation, pushDeliveries: { $elemMatch: { deviceId: entry.deviceId, leaseGeneration: lease.generation, status: "processing" } } },
        { $set: {
          "pushDeliveries.$.status": delivered ? "sent" : "failed",
          "pushDeliveries.$.deliveredAt": delivered ? new Date() : null,
          "pushDeliveries.$.lastError": delivered ? "" : String(result.error?.message || code || "FCM delivery failed").slice(0, 300),
          "pushDeliveries.$.leaseGeneration": lease.generation,
        } },
      );
    }
  }
  if (invalidTokens.length) {
    await DeviceToken.updateMany({ fcmToken: { $in: invalidTokens } }, { $set: { isActive: false } });
  }
  await renewCampaignLease(campaign._id, lease);
  const currentNotifications = await UserNotification.find({ _id: { $in: notificationIds }, pushDeliveryGeneration: lease.generation })
    .select("userId pushDeliveries")
    .lean();
  const writes = currentNotifications.map((notification) => {
    const sent = (notification.pushDeliveries || []).filter((item) => item.status === "sent").length;
    const failed = (notification.pushDeliveries || []).filter((item) => item.status === "failed").length;
    const processing = (notification.pushDeliveries || []).some((item) => item.status === "processing");
    const deliveryStatus = processing ? "pending" : sent && failed ? "partial" : sent ? "sent" : failed ? "failed" : "skipped";
    return {
      updateOne: {
        filter: { _id: notification._id, pushDeliveryGeneration: lease.generation },
        update: { $set: { deliveryStatus, pushSuccessCount: sent, pushFailureCount: failed } },
      },
    };
  });
  if (writes.length) await UserNotification.bulkWrite(writes, { ordered: false });
  return { sent: successes, failed: failures, skipped: notifications.filter((item) => !perUser.has(String(item.userId)) && !tokenFailures.has(String(item.userId))).length };
};

export const fanoutCampaign = async (campaignId, lease) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  if (!campaign || campaign.status !== "publishing") return null;
  await renewCampaignLease(campaignId, lease);

  const stats = { eligible: 0, inAppCreated: 0, pushSent: 0, pushFailed: 0, pushSkipped: 0 };
  const userCursor = User.find(notificationAudienceFilter(campaign.audience)).select("_id").lean().cursor({ batchSize: BATCH_SIZE });
  let batch = [];
  const processBatch = async (users) => {
    if (!users.length) return;
    await renewCampaignLease(campaign._id, lease);
    const userIds = users.map((user) => user._id);
    const existing = await UserNotification.find({ campaignId: campaign._id, userId: { $in: userIds } })
      .select("userId deliveryStatus")
      .lean();
    const existingByUser = new Map(existing.map((item) => [String(item.userId), item]));
    const preferenceRows = await NotificationPreference.find({ userId: { $in: userIds } }).lean();
    const preferencesByUser = new Map(preferenceRows.map((item) => [String(item.userId), item]));
    const eligibleUsers = users.filter((user) => notificationPreferenceAllows(preferencesByUser.get(String(user._id)), campaign.type));
    stats.eligible += eligibleUsers.length;
    const operations = eligibleUsers.map((user) => ({
      updateOne: {
        filter: { campaignId: campaign._id, userId: user._id },
        update: {
          $setOnInsert: {
            campaignId: campaign._id,
            userId: user._id,
            title: repairLegacyNotificationText(campaign.title),
            message: repairLegacyNotificationText(campaign.message),
            type: campaign.type,
            image: campaign.image,
            deepLink: campaign.deepLink,
            relatedId: campaign.relatedId,
            actionType: campaign.actionType || (campaign.type === "tracking" ? "tracking" : "none"),
            actionUrl: campaign.actionUrl,
            metadata: campaign.metadata,
            isRead: false,
            deliveryStatus: "pending",
          },
        },
        upsert: true,
      },
    }));
    if (operations.length) await UserNotification.bulkWrite(operations, { ordered: false });
    stats.inAppCreated += eligibleUsers.filter((user) => !existingByUser.has(String(user._id))).length;
    const pendingUsers = eligibleUsers.filter((user) => {
      const existingNotification = existingByUser.get(String(user._id));
      return !existingNotification || ["pending", "failed", "partial", "sent", "skipped"].includes(existingNotification.deliveryStatus);
    });
    const pendingUserIds = pendingUsers.map((user) => user._id);
    if (!pendingUserIds.length) return;
    const preferenceMap = preferencesByUser;
    const deviceRows = await DeviceToken.find({
      userId: { $in: pendingUserIds }, isActive: true,
    }).select("userId deviceId fcmToken").lean();
    const tokenMap = new Map();
    for (const device of deviceRows) {
      if (preferenceMap.get(String(device.userId))?.pushEnabled === false) continue;
      const tokens = tokenMap.get(String(device.userId)) || [];
      tokens.push(device.fcmToken);
      tokenMap.set(String(device.userId), tokens);
    }
    const pendingNotifications = await UserNotification.find({
      campaignId: campaign._id,
      userId: { $in: pendingUserIds },
      deliveryStatus: { $in: ["pending", "failed", "partial", "sent", "skipped"] },
    }).lean();
    const pendingDevices = deviceRows.filter((device) => tokenMap.has(String(device.userId)));
    const result = await deliverCampaignBatch(campaign, pendingNotifications, pendingDevices, lease);
    stats.pushSent += result.sent;
    stats.pushFailed += result.failed;
    stats.pushSkipped += result.skipped;
    await renewCampaignLease(campaign._id, lease);
  };

  for await (const user of userCursor) {
    batch.push(user);
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }
  await processBatch(batch);

  // Broadcast to active guest devices (installed apps without user login)
  let guestPushSent = 0;
  let guestPushFailed = 0;
  let guestCount = 0;
  const isGuestAudience = ["all", "all_installed", "state_wise", "district_wise"].includes(campaign.audience?.type || "all_installed");
  if (isGuestAudience) {
    const guestFilter = { isGuest: true, isActive: true };
    if (campaign.audience?.type === "state_wise" && campaign.audience?.state) {
      guestFilter.state = new RegExp(`^${campaign.audience.state.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }
    if (campaign.audience?.type === "district_wise") {
      if (campaign.audience?.district) {
        guestFilter.district = new RegExp(`^${campaign.audience.district.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      }
      if (campaign.audience?.state) {
        guestFilter.state = new RegExp(`^${campaign.audience.state.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      }
    }
    const guestDevices = await DeviceToken.find(guestFilter).select("fcmToken").lean();
    guestCount = guestDevices.length;
    if (guestDevices.length) {
      for (let offset = 0; offset < guestDevices.length; offset += FCM_BATCH_SIZE) {
        await renewCampaignLease(campaign._id, lease);
        const currentBatch = guestDevices.slice(offset, offset + FCM_BATCH_SIZE);
        const tokens = currentBatch.map((d) => d.fcmToken).filter(Boolean);
        if (!tokens.length) continue;
        const invalidTokens = [];
        try {
          const response = await sendOneBatch(tokens, campaign);
          for (let index = 0; index < tokens.length; index += 1) {
            const resItem = response?.responses?.[index];
            if (resItem?.success) {
              guestPushSent += 1;
            } else {
              guestPushFailed += 1;
              const code = String(resItem?.error?.code || "");
              if (INVALID_FCM_CODES.has(code)) {
                invalidTokens.push(tokens[index]);
              }
            }
          }
        } catch {
          guestPushFailed += tokens.length;
        }
        if (invalidTokens.length) {
          await DeviceToken.updateMany({ fcmToken: { $in: invalidTokens } }, { $set: { isActive: false } });
        }
      }
    }
  }

  const aggregate = await UserNotification.aggregate([
    { $match: { campaignId: campaign._id } },
    {
      $group: {
        _id: null,
        assigned: { $sum: 1 },
        pushSent: { $sum: "$pushSuccessCount" },
        pushFailed: { $sum: "$pushFailureCount" },
        pushSkipped: { $sum: { $cond: [{ $eq: ["$deliveryStatus", "skipped"] }, 1, 0] } },
      },
    },
  ]);
  const totals = aggregate[0] || { assigned: 0, pushSent: 0, pushFailed: 0, pushSkipped: 0 };
  stats.eligible = totals.assigned + guestCount;
  stats.inAppCreated = totals.assigned;
  stats.pushSent = totals.pushSent + guestPushSent;
  stats.pushFailed = totals.pushFailed + guestPushFailed;
  stats.pushSkipped = totals.pushSkipped;
  const completed = await NotificationCampaign.updateOne(
    { _id: campaign._id, status: "publishing", fanoutLeaseOwner: lease.owner, fanoutLeaseGeneration: lease.generation },
    { $set: { status: "published", publishedAt: new Date(), fanoutStartedAt: null, fanoutLeaseExpiresAt: null, fanoutLeaseOwner: "", lastError: "", deliveryStats: stats } },
  );
  if (!completed.modifiedCount) throw new Error("Notification campaign lease was lost before completion.");
  return stats;
};

export const publishCampaign = async (campaignId) => {
  const now = new Date();
  const owner = randomUUID();
  const claim = await NotificationCampaign.findOneAndUpdate(
    { _id: campaignId, $or: [
      { status: { $in: ["draft", "scheduled", "failed"] } },
      { status: "publishing", fanoutLeaseExpiresAt: { $lte: now } },
    ] },
    { $set: { status: "publishing", fanoutStartedAt: now, fanoutLeaseOwner: owner, fanoutLeaseExpiresAt: new Date(now.getTime() + CAMPAIGN_LEASE_MS), lastError: "" }, $inc: { fanoutLeaseGeneration: 1 } },
    { new: true },
  );
  if (!claim) return null;
  const lease = { owner, generation: claim.fanoutLeaseGeneration };
  try {
    return await fanoutCampaign(claim._id, lease);
  } catch (error) {
    await NotificationCampaign.updateOne(
      { _id: claim._id, status: "publishing", fanoutLeaseOwner: owner, fanoutLeaseGeneration: lease.generation },
      { $set: { status: "failed", fanoutStartedAt: null, fanoutLeaseExpiresAt: null, fanoutLeaseOwner: "", lastError: String(error?.message || error?.code || "Campaign processing failed.").slice(0, 500) } },
    );
    throw error;
  }
};

export const processScheduledCampaigns = async () => {
  const now = new Date();
  const dueCampaigns = await NotificationCampaign.find({ $or: [
    { status: "scheduled", scheduledAt: { $lte: now } },
    { status: "publishing", fanoutLeaseExpiresAt: { $lte: now } },
  ] })
    .select("_id").limit(20).lean();
  for (const campaign of dueCampaigns) {
    try { await publishCampaign(campaign._id); }
    catch (error) { console.error("Scheduled notification campaign failed.", error?.message || "unknown error"); }
  }
};

export const startNotificationScheduler = () => {
  const timer = setInterval(() => { void processScheduledCampaigns(); }, 30_000);
  timer.unref?.();
  void processScheduledCampaigns();
};

export const createSystemNotificationCampaign = async (input) => {
  const campaign = await NotificationCampaign.create({
    ...input,
    createdBy: "system",
    status: "scheduled",
    scheduledAt: new Date(),
  });
  void publishCampaign(campaign._id).catch((error) => {
    console.error("System notification campaign failed.", error?.message || "unknown error");
  });
  return campaign;
};
