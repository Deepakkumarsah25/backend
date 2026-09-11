import mongoose from "mongoose";

const CATEGORIES = ["Roads", "Water", "Electricity", "Health", "Education", "Safety"];
const STATUSES = ["Submitted", "In Progress", "Resolved"];

const grievanceSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "Submitted",
    },
  },
  { timestamps: true }
);

export const GRIEVANCE_CATEGORIES = CATEGORIES;
export const GRIEVANCE_STATUSES = STATUSES;

export default mongoose.model("Grievance", grievanceSchema);