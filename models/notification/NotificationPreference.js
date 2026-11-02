import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    announcements: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    tracking: { type: Boolean, default: true },
    membership: { type: Boolean, default: true },
    general: { type: Boolean, default: true },
    promotional: { type: Boolean, default: true },
    wishes: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("NotificationPreference", notificationPreferenceSchema);
