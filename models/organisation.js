import mongoose from "mongoose";

const organisationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    fax: {
      type: String,
      default: "",
      trim: true,
    },
imageUrl: {
  type: String,
  default: "",
},

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Organisation = mongoose.model(
  "Organisation",
  organisationSchema
);

export default Organisation;