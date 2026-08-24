import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    youtubeId: {
      type: String,
      required: true,
      unique: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Events", "Speech", "Campaign", "Interview", "Live"],
      default: "Events",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    duration: {
      type: String,
      default: "",
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

const Video = mongoose.model("videosgallery", videoSchema);

export default Video;