import mongoose from "mongoose";

const escapeRegex = (string = "") => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const notificationAudienceFilter = (audience = {}) => {
  switch (audience.type) {
    case "members": 
      return { deletionRequested: { $ne: true }, membershipId: { $exists: true, $nin: [null, ""] } };
    case "agents": 
      return { deletionRequested: { $ne: true }, isAgent: true };
    case "users": 
      return { _id: { $in: audience.userIds || [] }, deletionRequested: { $ne: true } };
    case "state_wise": {
      const filter = { deletionRequested: { $ne: true } };
      if (audience.state && audience.state.trim()) {
        filter.state = new RegExp(`^${escapeRegex(audience.state.trim())}$`, "i");
      }
      return filter;
    }
    case "district_wise": {
      const filter = { deletionRequested: { $ne: true } };
      if (audience.district && audience.district.trim()) {
        filter.district = new RegExp(`^${escapeRegex(audience.district.trim())}$`, "i");
      }
      if (audience.state && audience.state.trim()) {
        filter.state = new RegExp(`^${escapeRegex(audience.state.trim())}$`, "i");
      }
      return filter;
    }
    case "all_installed":
    case "all":
    default: 
      return { deletionRequested: { $ne: true } };
  }
};

export const notificationPreferenceAllows = (preferences, category) =>
  !preferences || preferences[category] !== false;

export const ownedNotificationFilter = (userId, notificationId) => ({
  ...(notificationId ? { _id: notificationId } : {}),
  userId,
});

export const encodeNotificationCursor = (item) => Buffer.from(
  JSON.stringify({ createdAt: item.createdAt.toISOString(), id: String(item._id) }),
).toString("base64url");

export const decodeNotificationCursor = (cursor) => {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const createdAt = new Date(parsed.createdAt);
    if (!mongoose.Types.ObjectId.isValid(parsed.id) || !Number.isFinite(createdAt.getTime())) return null;
    return { createdAt, id: new mongoose.Types.ObjectId(parsed.id) };
  } catch {
    return null;
  }
};
