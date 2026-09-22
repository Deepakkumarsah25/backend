import mongoose from "mongoose";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";

const resolveUser = async (req) => {
  if (req.user?._id) return req.user;

  const uid = req.headers["x-dev-uid"] || req.headers["x-user-uid"];
  if (!uid) return null;

  return User.findOne({ uid: String(uid) });
};

const getUserFilter = (userId) => ({
  $or: [
    { userId, deletedBy: { $ne: userId } },
    { userId: null, deletedBy: { $ne: userId } },
  ],
});

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

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    return res.status(200).json({
      success: true,
      notifications,
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

    const filter = userId
      ? { isRead: false, ...getUserFilter(userId) }
      : { isRead: false, userId: null };

    const unreadCount = await Notification.countDocuments(filter);

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
    const userId = user?._id || null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const ownership = userId
      ? {
          _id: id,
          $or: [{ userId }, { userId: null }],
        }
      : { _id: id, userId: null };

    const notification = await Notification.findOneAndUpdate(
      ownership,
      { $set: { isRead: true } },
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
      notification,
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
    const userId = user?._id || null;

    const filter = userId
      ? { isRead: false, ...getUserFilter(userId) }
      : { isRead: false, userId: null };

    await Notification.updateMany(filter, { $set: { isRead: true } });

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
