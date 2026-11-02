import { messaging } from "../firebase/firebaseAdmin.js";
import DeviceToken from "../models/notification/DeviceToken.js";
import NotificationCampaign from "../models/notification/NotificationCampaign.js";
import NotificationPreference from "../models/notification/NotificationPreference.js";
import User from "../models/User.js";
import UserNotification from "../models/notification/UserNotification.js";
import { repairLegacyNotificationText } from "./notificationText.js";
import {
  decodeNotificationCursor,
  encodeNotificationCursor,
  notificationAudienceFilter,
  notificationPreferenceAllows,
} from "./notificationPolicy.js";

const BATCH_SIZE = 300;
const FCM_BATCH_SIZE = 500;
const RETRYABLE_FCM_CODES = new Set([
  "messaging/internal-error",
  "messaging/server-unavailable",
  "messaging/unknown-error",
  "messaging/quota-exceeded",
]);
const INVALID_FCM_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

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

const deliverCampaignBatch = async (campaign, notifications, deviceRows) => {
  const notificationByUser = new Map(notifications.map((item) => [String(item.userId), item]));
  const tokenEntries = deviceRows
    .filter((device) => notificationByUser.has(String(device.userId)))
    .map((device) => ({ token: device.fcmToken, userId: String(device.userId) }));
  const perUser = new Map();
  const tokenFailures = new Map();
  const invalidTokens = [];
  let successes = 0;
  let failures = 0;
  for (let offset = 0; offset < tokenEntries.length; offset += FCM_BATCH_SIZE) {
    let retryEntries = tokenEntries.slice(offset, offset + FCM_BATCH_SIZE);
    for (let attempt = 0; retryEntries.length && attempt < 3; attempt += 1) {
      const currentBatch = retryEntries;
      const nextRetryEntries = [];
      try {
        const response = await sendOneBatch(currentBatch.map((entry) => entry.token), campaign);
        response.responses.forEach((result, index) => {
          const entry = currentBatch[index];
          if (result.success) {
            successes += 1;
            perUser.set(entry.userId, (perUser.get(entry.userId) || 0) + 1);
          } else if (INVALID_FCM_CODES.has(result.error?.code)) invalidTokens.push(entry.token);
          else if (RETRYABLE_FCM_CODES.has(result.error?.code) && attempt < 2) nextRetryEntries.push(entry);
          else {
            failures += 1;
            tokenFailures.set(entry.userId, (tokenFailures.get(entry.userId) || 0) + 1);
          }
        });
      } catch (error) {
        if (attempt < 2 && RETRYABLE_FCM_CODES.has(error?.code)) nextRetryEntries.push(...currentBatch);
        else currentBatch.forEach((entry) => {
          failures += 1;
          tokenFailures.set(entry.userId, (tokenFailures.get(entry.userId) || 0) + 1);
        });
      }
      retryEntries = nextRetryEntries;
      if (retryEntries.length) await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
    }
  }
  if (invalidTokens.length) {
    await DeviceToken.updateMany({ fcmToken: { $in: invalidTokens } }, { $set: { isActive: false } });
  }
  const writes = notifications.map((notification) => {
    const userId = String(notification.userId);
    const sent = perUser.get(userId) || 0;
    const failed = tokenFailures.get(userId) || 0;
    const deliveryStatus = sent && failed ? "partial" : sent ? "sent" : failed ? "failed" : "skipped";
    return {
      updateOne: {
        filter: { _id: notification._id },
        update: { $set: { deliveryStatus, pushSuccessCount: sent, pushFailureCount: failed } },
      },
    };
  });
  if (writes.length) await UserNotification.bulkWrite(writes, { ordered: false });
  return { sent: successes, failed: failures, skipped: notifications.filter((item) => !perUser.has(String(item.userId)) && !tokenFailures.has(String(item.userId))).length };
};

export const fanoutCampaign = async (campaignId) => {
  const campaign = await NotificationCampaign.findById(campaignId);
  if (!campaign || !["scheduled", "publishing"].includes(campaign.status)) return null;

  const stats = { eligible: 0, inAppCreated: 0, pushSent: 0, pushFailed: 0, pushSkipped: 0 };
  const userCursor = User.find(notificationAudienceFilter(campaign.audience)).select("_id").lean().cursor({ batchSize: BATCH_SIZE });
  let batch = [];
  const processBatch = async (users) => {
    if (!users.length) return;
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
      return !existingNotification || ["pending", "failed"].includes(existingNotification.deliveryStatus);
    });
    const pendingUserIds = pendingUsers.map((user) => user._id);
    if (!pendingUserIds.length) return;
    const preferenceMap = preferencesByUser;
    const deviceRows = await DeviceToken.find({
      userId: { $in: pendingUserIds }, isActive: true,
    }).select("userId fcmToken").lean();
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
      deliveryStatus: { $in: ["pending", "failed"] },
    }).lean();
    const pendingDevices = deviceRows.filter((device) => tokenMap.has(String(device.userId)));
    const result = await deliverCampaignBatch(campaign, pendingNotifications, pendingDevices);
    stats.pushSent += result.sent;
    stats.pushFailed += result.failed;
    stats.pushSkipped += result.skipped;
    await NotificationCampaign.updateOne(
      { _id: campaign._id, status: "publishing" },
      { $set: { fanoutStartedAt: new Date() } },
    );
  };

  for await (const user of userCursor) {
    batch.push(user);
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }
  await processBatch(batch);
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
  stats.eligible = totals.assigned;
  stats.inAppCreated = totals.assigned;
  stats.pushSent = totals.pushSent;
  stats.pushFailed = totals.pushFailed;
  stats.pushSkipped = totals.pushSkipped;
  campaign.status = "published";
  campaign.publishedAt = new Date();
  campaign.fanoutStartedAt = null;
  campaign.lastError = "";
  campaign.deliveryStats = stats;
  await campaign.save();
  return stats;
};

export const publishCampaign = async (campaignId) => {
  const now = new Date();
  const claim = await NotificationCampaign.findOneAndUpdate(
    { _id: campaignId, status: { $in: ["draft", "scheduled", "failed"] } },
    { $set: { status: "publishing", fanoutStartedAt: now, lastError: "" } },
    { new: true },
  );
  if (!claim) return null;
  try {
    return await fanoutCampaign(claim._id);
  } catch (error) {
    await NotificationCampaign.updateOne(
      { _id: claim._id, status: "publishing" },
      { $set: { status: "failed", fanoutStartedAt: null, lastError: String(error?.message || error?.code || "Campaign processing failed.").slice(0, 500) } },
    );
    throw error;
  }
};

export const processScheduledCampaigns = async () => {
  const now = new Date();
  await NotificationCampaign.updateMany(
    { status: "publishing", fanoutStartedAt: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } },
    { $set: { status: "scheduled", fanoutStartedAt: null } },
  );
  const dueCampaigns = await NotificationCampaign.find({ status: "scheduled", scheduledAt: { $lte: now } })
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
