import mongoose from "mongoose";

const downloadItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "leaders-photo",
        "infographics-banner",
        "quotes",
        "mobile-wallpaper",
      ],
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    author: {
      type: String,
      default: "",
      trim: true,
    },
    fileSize: {
      type: String,
      default: "1.5 MB",
    },
    dimensions: {
      type: String,
      default: "1920x1080",
    },
    format: {
      type: String,
      default: "JPG",
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

downloadItemSchema.index({ category: 1, isPublished: 1, displayOrder: 1, createdAt: -1 });

export default mongoose.models.DownloadItem || mongoose.model("DownloadItem", downloadItemSchema);
