import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "NotificationCampaign", default: null },
    legacyNotificationId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ["announcements", "events", "tracking", "membership", "general", "promotional", "wishes"],
      default: "general",
    },
    image: { type: String, default: "" },
    deepLink: { type: String, default: "" },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actionType: { type: String, default: "none" },
    actionUrl: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "partial", "failed", "skipped"],
      default: "pending",
    },
    pushSuccessCount: { type: Number, default: 0 },
    pushFailureCount: { type: Number, default: 0 },
    pushDeliveryGeneration: { type: Number, default: 0 },
    pushDeliveries: [{
      deviceId: { type: String, required: true },
      status: { type: String, enum: ["processing", "sent", "failed"], required: true },
      attempts: { type: Number, default: 0 },
      leaseGeneration: { type: Number, required: true },
      lastAttemptAt: { type: Date, default: Date.now },
      deliveredAt: { type: Date, default: null },
      lastError: { type: String, default: "", maxlength: 300 },
    }],
  },
  { timestamps: true },
);

userNotificationSchema.index({ userId: 1, createdAt: -1, _id: -1 });
userNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index(
  { campaignId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { campaignId: { $type: "objectId" } } },
);
userNotificationSchema.index(
  { legacyNotificationId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      legacyNotificationId: { $type: "objectId" },
      userId: { $type: "objectId" },
    },
  },
);

export default mongoose.model("UserNotification", userNotificationSchema);
