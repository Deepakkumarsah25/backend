import { messaging } from "../firebase/firebaseAdmin.js";
import DeviceToken from "../models/notification/DeviceToken.js";
import NotificationPreference from "../models/notification/NotificationPreference.js";
import UserNotification from "../models/notification/UserNotification.js";
import { createSystemNotificationCampaign } from "./notificationCampaignService.js";
import { repairLegacyNotificationText } from "./notificationText.js";

const stringifyData = (data = {}) => Object.fromEntries(
  Object.entries(data).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, repairLegacyNotificationText(String(value))]),
);

export const sendPushNotificationToUser = async ({ userId, title, body, data = {} }) => {
  try {
    const preferences = await NotificationPreference.findOne({ userId }).lean();
    const category = data.type === "route" || data.type === "tracking" ? "tracking" : data.type === "event" ? "events" : data.type === "membership" ? "membership" : data.type === "news" ? "announcements" : "general";
    if (preferences?.pushEnabled === false || preferences?.[category] === false) {
      if (data.notificationId) await UserNotification.updateOne({ _id: data.notificationId, userId }, { $set: { deliveryStatus: "skipped" } });
      return null;
    }
    const devices = await DeviceToken.find({ userId, isActive: true }).select("_id fcmToken").lean();
    if (!devices.length) {
      if (data.notificationId) await UserNotification.updateOne({ _id: data.notificationId, userId }, { $set: { deliveryStatus: "skipped" } });
      return null;
    }
    const responses = [];
    for (let offset = 0; offset < devices.length; offset += 500) {
      const batch = devices.slice(offset, offset + 500);
      const result = await messaging.sendEachForMulticast({
        tokens: batch.map((device) => device.fcmToken),
        notification: {
          title: repairLegacyNotificationText(title),
          body: repairLegacyNotificationText(body),
        },
        data: stringifyData(data),
        android: { priority: "high", notification: { channelId: "vip-party", sound: "default" } },
      });
      result.responses.forEach((item, index) => {
        if (!item.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(item.error?.code)) {
          responses.push(DeviceToken.updateOne({ _id: batch[index]._id }, { $set: { isActive: false } }));
        }
      });
    }
    await Promise.allSettled(responses);
    if (data.notificationId) {
      await UserNotification.updateOne(
        { _id: data.notificationId, userId },
        { $set: { deliveryStatus: "sent" } },
      );
    }
    return true;
  } catch (error) {
    if (data.notificationId) {
      await UserNotification.updateOne(
        { _id: data.notificationId, userId },
        { $set: { deliveryStatus: "failed" } },
      ).catch(() => {});
    }
    console.error("Targeted push failed.", error?.code || "unknown error");
    return null;
  }
};

// Legacy broadcast callers now enter campaign fanout, which applies audience
// eligibility and stored category preferences before creating inbox/push items.
export const sendPushNotification = async (title, body, data = {}) => {
  try {
    return await createSystemNotificationCampaign({
      title,
      message: body,
      type: data.type === "event" ? "events" : data.type === "route" ? "tracking" : "general",
      deepLink: data.deepLink || data.actionUrl || "",
      relatedId: data.routeId || null,
      actionType: data.actionType || "none",
      actionUrl: data.actionUrl || "",
      metadata: data,
      audience: { type: "all", userIds: [] },
    });
  } catch (error) {
    console.error("Notification campaign queue failed.", error?.message || "unknown error");
    return null;
  }
};
