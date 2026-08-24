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
    email: {
      type: String,
      default: "",
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

   
    photo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
    },
    location: {
      lat: {
        type: Number,
        default: 0,
      },
      lng: {
        type: Number,
        default: 0,
      },
    },
    alertSent: {
  type: Boolean,
  default: false
},

lastAlertAt: {
  type: Date,
  default: null
},
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Worker", workerSchema);
