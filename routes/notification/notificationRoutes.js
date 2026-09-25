import express from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../../controllers/notification/notificationController.js";

import { optionalAuth } from "../../middlewar/optionalAuth.js";
import { protect } from "../../middlewar/firebaseAuth.js";

const router = express.Router();

// Get all notifications
router.get(
  "/",
  optionalAuth,
  getNotifications
);

// Get unread count
router.get(
  "/unread-count",
  optionalAuth,
  getUnreadCount
);

// Mark one as read
router.put(
  "/read/:id",
  protect,
  markNotificationRead
);

// Mark all as read
router.put(
  "/read-all",
  protect,
  markAllNotificationsRead
);

// Delete
router.delete(
  "/:id",
  protect,
  deleteNotification
);

export default router;
