import mongoose from "mongoose";
import UserNotification from "../../models/notification/UserNotification.js";
import {
  getUserNotificationPage,
} from "../../services/notificationCampaignService.js";
import { ownedNotificationFilter } from "../../services/notificationPolicy.js";

const getVerifiedUserId = (req) => req.user?._id;

export const getNotifications = async (req, res) => {
  try {
    const userId = getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const page = await getUserNotificationPage(userId, {
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    if (page.invalidCursor) return res.status(400).json({ success: false, message: "Invalid notification cursor." });
    const unreadCount = await UserNotification.countDocuments({ userId, isRead: false });
    return res.json({ success: true, ...page, unreadCount });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to get notifications." });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const unreadCount = await UserNotification.countDocuments({ userId, isRead: false });
    return res.json({ success: true, unreadCount });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to get unread count." });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid notification ID." });
    const notification = await UserNotification.findOneAndUpdate(
      ownedNotificationFilter(userId, req.params.id),
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    ).lean();
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    const unreadCount = await UserNotification.countDocuments({ userId, isRead: false });
    return res.json({ success: true, message: "Notification marked as read.", unreadCount, notification });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to mark notification." });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    await UserNotification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return res.json({ success: true, message: "All notifications marked as read.", unreadCount: 0 });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to mark notifications as read." });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid notification ID." });
    const deleted = await UserNotification.findOneAndDelete({
      ...ownedNotificationFilter(userId, req.params.id),
    });
    if (!deleted) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.json({ success: true, message: "Notification deleted." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to delete notification." });
  }
};

export const deleteMultipleNotifications = async (req, res) => {
  try {
    const userId = getVerifiedUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100 || ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: "Provide between 1 and 100 valid notification IDs." });
    }
    const result = await UserNotification.deleteMany({
      ...ownedNotificationFilter(userId),
      _id: { $in: ids },
    });
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to delete notifications." });
  }
};
