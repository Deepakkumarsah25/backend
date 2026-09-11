import mongoose from "mongoose";

const morchaWingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true, // e.g. "women_wing", "youth_wing" - used as slug/identifier
    },
    titleHi: {
      type: String,
      required: true, // e.g. "महिला मोर्चा (Women Wing)"
    },
    titleEn: {
      type: String,
      required: true, // e.g. "Women Wing"
    },
    head: {
      type: String,
      default: "",
    },
    contact: {
      type: String,
      default: "",
    },
    established: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String, // cloudinary url, optional icon/banner
      default: "",
    },
    order: {
      type: Number,
      default: 0, // to control display sequence
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MorchaWing", morchaWingSchema);