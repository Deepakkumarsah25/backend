import mongoose from "mongoose";

const vipOfficeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    incharge: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
    },

    district: {
  type: String,
  default: "",
},
officeType: {
  type: String,
  default: "District Office",
},

    lat: {
      type: Number,
      required: true,
    },

    lng: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("VipOffice", vipOfficeSchema);