import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "General",
      enum: [
        "General",
        "Politics",
        "Events",
        "Campaign",
        "Party",
        "Press",
        "Announcement",
      ],
    },

    coverImage: {
      type: String,
      default: "",
    },

    coverImagePublicId: {
      type: String,
      default: "",
    },

    images: [
      {
        url: {
          type: String,
        },
        publicId: {
          type: String,
        },
      },
    ],

    videoType: {
      type: String,
      enum: ["none", "youtube", "uploaded"],
      default: "none",
    },

    youtubeUrl: {
      type: String,
      default: "",
    },

    youtubeId: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
    },

    videoPublicId: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    location: {
      type: String,
      default: "",
    },

    author: {
      type: String,
      default: "VIP Party",
    },

    active: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("News", newsSchema);