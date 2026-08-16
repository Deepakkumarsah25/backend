import mongoose from "mongoose";

const contactInfoSchema = new mongoose.Schema(
  {
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
      default: "",
    },

    facebook: {
      type: String,
      default: "",
    },

    instagram: {
      type: String,
      default: "",
    },

    twitter: {
      type: String,
      default: "",
    },

    youtube: {
      type: String,
      default: "",
    },
 

  whatsapp: {
  type: String,
  default: "",
},

telegram: {
  type: String,
  default: "",
},

googleMapLink: {
  type: String,
  default: "",
},
 },
  {
    timestamps: true,
  }
);

export default mongoose.model("ContactInfo", contactInfoSchema);