import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      required: true,
    },
    name: String,
    email: String,
    phone: String,
    photoURL: String,
    provider: String,

    // Set by admin via /AdminAgent — gates access to Add Member / My Members
    isAgent: {
      type: Boolean,
      default: false,
    },
agentRequestPending: { type: Boolean, default: false },
agentRequestedAt: { type: Date, default: null },
referralCode: {
      type: String,
      unique: true,
      sparse: true, // field genuinely absent (not null) on docs without one
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);