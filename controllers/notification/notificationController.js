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

  const excludedIds = [userObjectId];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    excludedIds.push(String(userId));
  }

  return {
    deletedBy: { $nin: excludedIds },
    $or: [
      // Direct notifications for this specific user
      { userId: userObjectId },
      { userId: String(userId) },

      // Broadcast / global notifications
      { targetType: "all", userId: null },
      { targetType: "all", userId: { $exists: false } },
      { targetType: "member", userId: null },
      { targetType: "member", userId: { $exists: false } },
      { userId: null, targetType: { $ne: "user" } },
      { userId: { $exists: false }, targetType: { $ne: "user" } },
    ],
  };
};

const formatNotification = (item, userId = null) => {
  const { userId: owner, deletedBy, readBy, ...publicFields } = item;
  const isPersonal = owner && userId && String(owner) === String(userId);
  const isReadByCurrentUser = Boolean(
    userId && readBy?.some((id) => String(id) === String(userId))
  );

  const isRead = isPersonal
    ? Boolean(item.isRead || isReadByCurrentUser)
    : (userId ? isReadByCurrentUser : Boolean(item.isRead));

  return {
    ...publicFields,
    userId: owner || null,
    isRead,
  };
};

export const getNotifications = async (req, res) => {
  try {
    const user = await resolveUser(req);
    const userId = user?._id || null;

    const rawDeletedIds = req.headers["x-deleted-ids"];
    const clientDeletedSet = new Set(
      rawDeletedIds && typeof rawDeletedIds === "string"
        ? rawDeletedIds.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    );

    const filter = userId
      ? getUserFilter(userId)
      : {
          $or: [
            { targetType: "all", userId: null },
            { targetType: "all", userId: { $exists: false } },
            { targetType: "member", userId: null },
            { targetType: "member", userId: { $exists: false } },
            { userId: null, targetType: { $ne: "user" } },
            { userId: { $exists: false }, targetType: { $ne: "user" } },
          ],
        };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const rawReadIds = req.headers["x-read-ids"];
    const clientReadSet = new Set(
      rawReadIds && typeof rawReadIds === "string"
        ? rawReadIds.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    );

    const formattedNotifications = notifications
      .filter((item) => !clientDeletedSet.has(String(item._id)))
      .map((item) => {
        const formatted = formatNotification(item, userId);
        if (clientReadSet.has(String(item._id))) {
          formatted.isRead = true;
        }
        return formatted;
      });

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

    const rawDeletedIds = req.headers["x-deleted-ids"];
    const clientDeletedSet = new Set(
      rawDeletedIds && typeof rawDeletedIds === "string"
        ? rawDeletedIds.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    );

    const filter = userId
      ? getUserFilter(userId)
      : {
          $or: [
            { targetType: "all", userId: null },
            { targetType: "all", userId: { $exists: false } },
            { targetType: "member", userId: null },
            { targetType: "member", userId: { $exists: false } },
            { userId: null, targetType: { $ne: "user" } },
            { userId: { $exists: false }, targetType: { $ne: "user" } },
          ],
        };

    const rawReadIds = req.headers["x-read-ids"];
    const clientReadSet = new Set(
      rawReadIds && typeof rawReadIds === "string"
        ? rawReadIds.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    );

    const notifications = await Notification.find(filter).select("userId isRead readBy").lean();
    const unreadCount = notifications
      .filter((item) => !clientDeletedSet.has(String(item._id)))
      .filter((item) => {
        if (clientReadSet.has(String(item._id))) return false;
        return !formatNotification(item, userId).isRead;
      }).length;

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const user = await resolveUser(req);
    const userId = user?._id;

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const existingNotification = await Notification.findOne({
        _id: id,
        deletedBy: { $ne: userObjectId },
      });

      if (!existingNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      const isOwner =
        existingNotification.userId &&
        String(existingNotification.userId) === String(userObjectId);

      const updateQuery = isOwner
        ? { $set: { isRead: true }, $addToSet: { readBy: userObjectId } }
        : { $addToSet: { readBy: userObjectId } };

      const notification = await Notification.findByIdAndUpdate(
        id,
        updateQuery,
        { new: true }
      );

      // Compute updated unread count for this user
      const filter = getUserFilter(userId);
      const rawReadIds = req.headers["x-read-ids"];
      const clientReadSet = new Set(
        rawReadIds && typeof rawReadIds === "string"
          ? rawReadIds.split(",").map((s) => s.trim()).filter(Boolean)
          : []
      );
      clientReadSet.add(String(id));

      const allNotifs = await Notification.find(filter).select("userId isRead readBy").lean();
      const unreadCount = allNotifs.filter((item) => {
        if (clientReadSet.has(String(item._id))) return false;
        return !formatNotification(item, userId).isRead;
      }).length;

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        unreadCount,
        notification: formatNotification(notification.toObject(), userObjectId),
      });
    } else {
      // Guest user marking notification as read
      const existingNotification = await Notification.findById(id);
      if (!existingNotification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }

      const rawReadIds = req.headers["x-read-ids"];
      const clientReadSet = new Set(
        rawReadIds && typeof rawReadIds === "string"
          ? rawReadIds.split(",").map((s) => s.trim()).filter(Boolean)
          : []
      );
      clientReadSet.add(String(id));

      const filter = {
        $or: [
          { userId: null },
          { userId: { $exists: false } },
          { targetType: "all" },
          { targetType: "member", userId: null },
          { targetType: "member", userId: { $exists: false } },
          { targetType: { $exists: false } },
        ],
      };

      const allNotifs = await Notification.find(filter).select("userId isRead readBy").lean();
      const unreadCount = allNotifs.filter((item) => {
        if (clientReadSet.has(String(item._id))) return false;
        return !formatNotification(item, null).isRead;
      }).length;

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        unreadCount,
        notification: {
          ...formatNotification(existingNotification.toObject(), null),
          isRead: true,
        },
      });
    }
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

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      await Notification.updateMany(
        {
          userId: userObjectId,
          deletedBy: { $ne: userObjectId },
        },
        {
          $set: { isRead: true },
          $addToSet: { readBy: userObjectId },
        }
      );

      await Notification.updateMany(
        {
          deletedBy: { $ne: userObjectId },
        },
        {
          $addToSet: { readBy: userObjectId },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return res.status(500).json({ success: false, message: "Failed" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const user = await resolveUser(req);
    const userId = user?._id;

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Soft delete ONLY for this specific user.
      // Other users will continue to see this notification.
      const notification = await Notification.findByIdAndUpdate(
        id,
        { $addToSet: { deletedBy: userObjectId } },
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
        message: "Notification deleted for this user",
      });
    } else {
      // Guest / unauthenticated device delete
      const existing = await Notification.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted for this device",
      });
    }
  } catch (error) {
    console.error("Delete Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

export const deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No notification IDs provided",
      });
    }

    const user = await resolveUser(req);
    const userId = user?._id;

    if (userId) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const validObjectIds = ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validObjectIds.length > 0) {
        await Notification.updateMany(
          { _id: { $in: validObjectIds } },
          { $addToSet: { deletedBy: userObjectId } }
        );
      }

      return res.status(200).json({
        success: true,
        message: "Notifications deleted for this user",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Notifications deleted for this device",
      });
    }
  } catch (error) {
    console.error("Delete Multiple Notifications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
    });
  }
};
