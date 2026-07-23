import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
     
    },

    state: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    village: {
      type: String,
      required: true,
    },

    wardNo: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      default: "",
    },

    photo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Worker",
  workerSchema
);