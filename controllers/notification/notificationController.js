import mongoose from "mongoose";
import Notification from "../../models/Notification.js";

const resolveUser = (req) => req.user || null;

const getUserFilter = (userId) => ({
  $or: [
    { userId, deletedBy: { $ne: userId } },
    { userId: null, deletedBy: { $ne: userId } },
  ],
});

const formatNotification = (item, userId = null) => {
  const { userId: owner, deletedBy, readBy, ...publicFields } = item;
  return {
    ...publicFields,
    isRead: owner
      ? Boolean(item.isRead)
      : Boolean(item.isRead || (userId && readBy?.some((id) => String(id) === String(userId)))),
  };
};

export const getNotifications = async (req, res) => {
  try {
    const user = await resolveUser(req);
    const userId = user?._id || null;

    const filter = userId
      ? getUserFilter(userId)
      : { userId: null };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const formattedNotifications = notifications.map((item) => formatNotification(item, userId));
    const unreadCount = formattedNotifications.filter((item) => !item.isRead).length;

    return res.status(200).json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const user = await resolveUser(req);
    const userId = user?._id || null;

    const filter = userId ? getUserFilter(userId) : { userId: null };
    const notifications = await Notification.find(filter).select("userId isRead readBy").lean();
    const unreadCount = notifications.filter((item) => !formatNotification(item, userId).isRead).length;

    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error("Unread Count Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await resolveUser(req);
    const userId = user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const ownership = {
      _id: id,
      deletedBy: { $ne: userId },
      $or: [{ userId }, { userId: null }],
    };

    const existingNotification = await Notification.findOne(ownership).select("userId");
    if (!existingNotification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    const notification = await Notification.findOneAndUpdate(
      ownership,
      existingNotification.userId
        ? { $set: { isRead: true } }
        : { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: formatNotification(notification.toObject(), userId),
    });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification",
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const user = await resolveUser(req);
    const userId = user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

    await Notification.updateMany(
      { isRead: false, userId },
      { $set: { isRead: true } }
    );
    await Notification.updateMany(
      { isRead: false, userId: null, deletedBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await resolveUser(req);
    const userId = user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [{ userId }, { userId: null }],
      },
      { $addToSet: { deletedBy: userId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};
