import express from "express";
import {
  getNotifications,
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
  unregisterDeviceToken,
} from "../../controllers/notification/notificationSettingsController.js";
import { requireAuth } from "../../middlewar/firebaseAuth.js";

const router = express.Router();

// Every endpoint uses a verified Firebase token and derives ownership from req.user.
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
