import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  heading: {
    type: String,
    default: "",
  },

  description: {
    type: String,
    default: "",
  },

  image: {
    type: String,
    default: "",
  },

  order: {
    type: Number,
    default: 0,
  },
});

const cmsPageSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
    },

    introText: {
      type: String,
      default: "",
    },

    sections: [sectionSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "CmsPage",
  cmsPageSchema
);