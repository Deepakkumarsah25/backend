import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      default: "VIP App User",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    source: {
      type: String,
      default: "app",
      enum: ["app", "website"],
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.models.Feedback || mongoose.model(
  "Feedback",
  feedbackSchema
);

export default Feedback;
