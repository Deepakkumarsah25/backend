import mongoose from "mongoose";

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, required: false },
    deviceId: { type: String, required: true, trim: true, maxlength: 160 },
    fcmToken: { type: String, required: true, trim: true },
    platform: { type: String, enum: ["android", "ios", "web", "unknown"], default: "unknown" },
    isGuest: { type: Boolean, default: false },
    state: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

deviceTokenSchema.index({ deviceId: 1 });
deviceTokenSchema.index({ fcmToken: 1 }, { unique: true });
deviceTokenSchema.index({ userId: 1, isActive: 1 });
deviceTokenSchema.index({ isActive: 1 });
deviceTokenSchema.index({ isGuest: 1, isActive: 1 });

export default mongoose.model("DeviceToken", deviceTokenSchema);
