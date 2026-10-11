import mongoose from "mongoose";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";
import { getAuth } from "firebase-admin/auth";
import app from "../../firebase/firebaseAdmin.js";

const resolveUser = async (req) => {
  if (req.user?._id) return req.user;

  let uid =
    req.headers["x-dev-uid"] ||
    req.headers["x-user-uid"] ||
    req.headers["uid"] ||
    null;

  const authHeader = req.headers.authorization;
  if (!uid && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const adminAuth = getAuth(app);
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded?.uid;
    } catch (e) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf8")
          );
          uid = payload.user_id || payload.sub || payload.uid;
        }
      } catch (_) {}
    }
  }

  if (uid) {
    let user = await User.findOne({ uid: String(uid) });
    if (!user) {
      const email = req.headers["x-dev-email"] || req.headers["x-user-email"];
      if (email) {
        user = await User.findOne({ email: String(email).trim().toLowerCase() });
      }
    }
    if (user) return user;
  }

  const email = req.headers["x-dev-email"] || req.headers["x-user-email"];
  if (email) {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (user) return user;
  }

  return null;
};

const getUserFilter = (userId) => {
  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  return {
    deletedBy: { $ne: userObjectId },
    $or: [
      { userId: userObjectId },
      { userId: String(userId) },
      { userId: null },
      { userId: { $exists: false } },
      { targetType: "all" },
      { targetType: "member" },
      { targetType: { $exists: false } },
    ],
  };
};

const formatNotification = (item, userId = null) => {
  const { userId: owner, deletedBy, readBy, ...publicFields } = item;
  return {
    ...publicFields,
    userId: owner || null,
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
      : {
          $or: [
            { userId: null },
            { userId: { $exists: false } },
            { targetType: "all" },
            { targetType: "member" },
            { targetType: { $exists: false } },
          ],
        };

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

    const filter = userId
      ? getUserFilter(userId)
      : {
          $or: [
            { userId: null },
            { userId: { $exists: false } },
            { targetType: "all" },
            { targetType: "member" },
            { targetType: { $exists: false } },
          ],
        };

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
      $or: [{ userId }, { userId: null }, { targetType: "all" }],
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
      {
        isRead: false,
        $or: [{ userId: null }, { targetType: "all" }],
        deletedBy: { $ne: userId },
      },
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
        $or: [{ userId }, { userId: null }, { targetType: "all" }],
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
