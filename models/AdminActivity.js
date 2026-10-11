import mongoose from "mongoose";

const adminActivitySchema = new mongoose.Schema(
  {
    adminEmail: {
      type: String,
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      default: "Admin",
    },
    adminRole: {
      type: String,
      default: "Administrator",
    },
    section: {
      type: String,
      required: true,
      index: true,
    },
    sectionIcon: {
      type: String,
      default: "fa-solid fa-pen-to-square",
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
    actionType: {
      type: String,
      enum: ["create", "update", "delete", "login", "other"],
      default: "update",
    },
    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
adminActivitySchema.index({ createdAt: -1 });
adminActivitySchema.index({ adminEmail: 1, createdAt: -1 });

export default mongoose.model("AdminActivity", adminActivitySchema);
