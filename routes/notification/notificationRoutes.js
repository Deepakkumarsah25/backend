import express from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../../controllers/notification/notificationController.js";

const router = express.Router();


// Get all notifications
router.get(
  "/",
  getNotifications
);


// Get unread count
router.get(
  "/unread-count",
  getUnreadCount
);


// Mark one as read
router.put(
  "/read/:id",
  markNotificationRead
);


// Mark all as read
router.put(
  "/read-all",
  markAllNotificationsRead
);


// Delete
router.delete(
  "/:id",
  deleteNotification
);


export default router;