import mongoose from "mongoose";

const mediaVersionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const MediaVersion = mongoose.model(
  "mediaversions",
  mediaVersionSchema
);

export default MediaVersion;