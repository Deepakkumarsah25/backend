import UserNotification from "../models/notification/UserNotification.js";
import NotificationPreference from "../models/notification/NotificationPreference.js";
import { repairLegacyNotificationText } from "./notificationText.js";

const normalizeCategory = (type) => {
  if (type === "route" || type === "tracking") return "tracking";
  if (type === "event") return "events";
  if (type === "membership") return "membership";
  if (type === "banner" || type === "news") return "announcements";
  return "general";
};

export const createNotification = async ({
  title,
  message,
  type = "general",
  relatedId = null,
  userId,
  actionType = "none",
  deepLink = "",
  actionUrl = "",
  imageUrl = "",
  metadata = {},
}) => {
  if (!userId) return null;
  const category = normalizeCategory(type);
  try {
    const preferences = await NotificationPreference.findOne({ userId }).select(category).lean();
    if (preferences?.[category] === false) return null;
    return await UserNotification.create({
      userId,
      title: repairLegacyNotificationText(title),
      message: repairLegacyNotificationText(message),
      type: category,
      relatedId,
      actionType,
      deepLink,
      actionUrl,
      image: imageUrl,
      metadata,
      isRead: false,
      deliveryStatus: "pending",
    });
  } catch (error) {
    console.error("User notification could not be created.", error?.message || "unknown error");
    return null;
  }
};

export const createMemberNotification = (input) => createNotification(input);
