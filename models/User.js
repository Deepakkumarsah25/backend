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

    // Set by admin via /AdminAgent — gates access to Add Member / My Members
    isAgent: {
      type: Boolean,
      default: false,
    },

    agentRequestPending: {
      type: Boolean,
      default: false,
    },

    agentRequestedAt: {
      type: Date,
      default: null,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true, // field genuinely absent (not null) on docs without one
    },
    deleteOtp: {
  type: String,
  default: "",
},

deleteOtpExpiry: {
  type: Date,
  default: null,
},

deletionRequested: {
  type: Boolean,
  default: false,
},

deletionDate: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);