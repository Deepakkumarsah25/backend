import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    eventTime: {
      type: String,
      default: "",
      trim: true,
    },

    tag: {
      type: String,
      default: "Event",
      trim: true,
    },

    tagColor: {
      type: String,
      default: "#1d4ed8",
    },

    // First image = cover image
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (value) {
          return value.length <= 10;
        },
        message: "Maximum 10 images are allowed.",
      },
    },

    published: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({
  eventDate: 1,
  published: 1,
});

export default mongoose.model(
  "Event",
  eventSchema
);