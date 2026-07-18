import mongoose from "mongoose";

const mediaGallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "newspaper",
        "pressrelease",
        "infographics",
      ],
    },

    date: {
      type: Date,
      default: Date.now,
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

export default mongoose.model(
  "MediaGallery",
  mediaGallerySchema
);