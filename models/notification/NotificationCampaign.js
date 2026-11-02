import mongoose from "mongoose";

const notificationCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ["announcements", "events", "tracking", "membership", "general", "promotional", "wishes"],
      default: "general",
      index: true,
    },
    image: { type: String, default: "", trim: true, maxlength: 2048 },
    deepLink: { type: String, default: "", trim: true, maxlength: 2048 },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actionType: { type: String, default: "none", trim: true },
    actionUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    audience: {
      type: { type: String, enum: ["all", "members", "agents", "users"], default: "all" },
      userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    createdBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "publishing", "published", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    scheduledAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    fanoutStartedAt: { type: Date, default: null },
    lastError: { type: String, default: "", maxlength: 500 },
    deliveryStats: {
      eligible: { type: Number, default: 0 },
      inAppCreated: { type: Number, default: 0 },
      pushSent: { type: Number, default: 0 },
      pushFailed: { type: Number, default: 0 },
      pushSkipped: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

notificationCampaignSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model("NotificationCampaign", notificationCampaignSchema);
