import Notification from "../models/Notification.js";


// =====================================================
// CREATE NOTIFICATION
// =====================================================

export const createNotification = async ({
  title,
  message,
  type = "general",
  relatedId = null,
  userId = null,
}) => {

  try {

    const notification =
      await Notification.create({

        userId,

        title,

        message,

        type,

        relatedId,

        isRead: false,

      });

    console.log(
      "🔔 Notification Created:",
      notification.title
    );

    return notification;

  } catch (error) {

    console.error(
      "Notification Create Error:",
      error
    );

    return null;
  }
};