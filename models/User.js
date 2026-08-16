import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    photoURL: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      default: "google",
    },

    // Firebase Cloud Messaging Token
    fcmToken: {
      type: String,
      default: "",
    },

    // Notification Enable / Disable
    notificationEnabled: {
      type: Boolean,
      default: true,
    },

    // Last Login Time
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);