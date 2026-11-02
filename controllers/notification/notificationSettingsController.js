import DeviceToken from "../../models/notification/DeviceToken.js";
import NotificationPreference from "../../models/notification/NotificationPreference.js";

const CATEGORY_DEFAULTS = {
  announcements: true,
  events: true,
  tracking: true,
  membership: true,
  general: true,
  promotional: true,
  wishes: true,
  pushEnabled: true,
};
const formatPreferences = (preferences = {}) => Object.fromEntries(
  Object.keys(CATEGORY_DEFAULTS).map((key) => [key, preferences[key] ?? CATEGORY_DEFAULTS[key]]),
);

export const getNotificationPreferences = async (req, res) => {
  try {
    const preferences = await NotificationPreference.findOne({ userId: req.user._id }).lean();
    return res.json({ success: true, preferences: formatPreferences(preferences || {}) });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load notification preferences." });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  const input = req.body || {};
  const allowed = Object.keys(CATEGORY_DEFAULTS);
  const updates = {};
  for (const key of allowed) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== "boolean") return res.status(400).json({ success: false, message: "Preference values must be boolean." });
      updates[key] = input[key];
    }
  }
  if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "No valid preference fields provided." });
  try {
    const preferences = await NotificationPreference.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates, $setOnInsert: { userId: req.user._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return res.json({ success: true, preferences: formatPreferences(preferences || {}) });
  } catch {
    return res.status(500).json({ success: false, message: "Could not save notification preferences." });
  }
};

export const registerDeviceToken = async (req, res) => {
  const { deviceId, fcmToken, platform } = req.body || {};
  if (typeof deviceId !== "string" || !deviceId.trim() || deviceId.length > 160 || typeof fcmToken !== "string" || fcmToken.length < 20 || fcmToken.length > 4096) {
    return res.status(400).json({ success: false, message: "Valid deviceId and FCM token are required." });
  }
  const validPlatforms = ["android", "ios", "web", "unknown"];
  if (platform !== undefined && !validPlatforms.includes(platform)) return res.status(400).json({ success: false, message: "Invalid platform." });
  const userId = req.user._id;
  try {
    const now = new Date();
    const existingDevice = await DeviceToken.exists({ userId, deviceId: deviceId.trim() });
    if (!existingDevice && await DeviceToken.countDocuments({ userId, isActive: true }) >= 20) {
      return res.status(409).json({ success: false, message: "This account has reached the active device limit." });
    }
    // A native push token belongs to one currently signed-in account/device.
    await DeviceToken.deleteMany({ fcmToken, $or: [{ userId: { $ne: userId } }, { deviceId: { $ne: deviceId.trim() } }] });
    const existing = await DeviceToken.findOneAndUpdate(
      { userId, deviceId: deviceId.trim() },
      { $set: { fcmToken, platform: platform || "unknown", isActive: true, lastSeenAt: now }, $setOnInsert: { userId, deviceId: deviceId.trim() } },
      { upsert: true, new: true, runValidators: true },
    );
    return res.json({ success: true, device: { id: String(existing._id), isActive: existing.isActive } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "Device token registration conflicted; retry registration." });
    return res.status(500).json({ success: false, message: "Could not register device token." });
  }
};

export const unregisterDeviceToken = async (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId || deviceId.length > 160) return res.status(400).json({ success: false, message: "Invalid device ID." });
  try {
    const result = await DeviceToken.deleteOne({ userId: req.user._id, deviceId });
    return res.json({ success: true, removed: result.deletedCount > 0 });
  } catch {
    return res.status(500).json({ success: false, message: "Could not unregister device token." });
  }
};
