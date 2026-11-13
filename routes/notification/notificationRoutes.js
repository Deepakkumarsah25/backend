import express from "express";
import {
  getNotifications,
  getPublicNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteMultipleNotifications,
} from "../../controllers/notification/notificationController.js";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  registerDeviceToken,
  registerPublicDeviceToken,
  unregisterDeviceToken,
} from "../../controllers/notification/notificationSettingsController.js";
import { requireAuth } from "../../middlewar/firebaseAuth.js";

const router = express.Router();

// Public endpoints for non-logged-in guest devices
router.post("/public/device", registerPublicDeviceToken);
router.get("/public", getPublicNotifications);

// Every authenticated endpoint uses a verified Firebase token and derives ownership from req.user.
router.use(requireAuth);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read/:id", markNotificationRead);
router.put("/read-all", markAllNotificationsRead);
router.post("/delete-multiple", deleteMultipleNotifications);
router.delete("/:id", deleteNotification);
router.get("/preferences", getNotificationPreferences);
router.put("/preferences", updateNotificationPreferences);
router.post("/devices", registerDeviceToken);
router.delete("/devices/:deviceId", unregisterDeviceToken);

export default router;
