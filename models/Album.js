import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    cover: {
      type: String,
      required: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ["Events", "Leaders", "Founders", "Campaigns"],
      default: "Events",
    },
    location: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Album = mongoose.model("albumsgallery", albumSchema);
export default Album;