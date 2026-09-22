import Notification from "../models/Notification.js";

export const createNotification = async ({
  title,
  message,
  type = "general",
  relatedId = null,
  userId = null,
  targetType = userId ? "user" : "all",
  actionType = "none",
  deepLink = "",
  actionUrl = "",
  imageUrl = "",
  metadata = {},
}) => {
  try {
    const notification = await Notification.create({
      userId,
      targetType,
      title,
      message,
      type,
      relatedId,
      actionType,
      deepLink,
      actionUrl,
      imageUrl,
      metadata,
      isRead: false,
    });

    console.log("🔔 Notification Created:", notification.title);
    return notification;
  } catch (error) {
    console.error("Notification Create Error:", error);
    return null;
  }
};

export const createMemberNotification = async ({
  userId,
  title,
  message,
  type = "general",
  relatedId = null,
  actionType = "none",
  deepLink = "",
  actionUrl = "",
  imageUrl = "",
  metadata = {},
}) => {
  return createNotification({
    userId,
    targetType: "member",
    title,
    message,
    type,
    relatedId,
    actionType,
    deepLink,
    actionUrl,
    imageUrl,
    metadata,
  });
};
