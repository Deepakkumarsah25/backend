import mongoose from "mongoose";

export const VOLUNTEER_TYPE_OPTIONS = [
  "Social Media",
  "Ground Campaign",
  "Event Management",
  "Youth Activities",
  "Women Activities",
  "Public Outreach",
  "Booth/Area Coordination",
  "Other",
];

const volunteerSchema = new mongoose.Schema(
  {
    volunteerId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    photoURL: { type: String, default: "" },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },

    state: { type: String, required: true },
    district: { type: String, required: true },
    assemblyConstituency: { type: String, default: "" },
    village: { type: String, default: "" },
    pinCode: { type: String, match: /^\d{6}$/, default: "" },

    volunteerTypes: [{ type: String, enum: VOLUNTEER_TYPE_OPTIONS }],
    otherTypeDetail: { type: String, default: "" },

    skills: { type: String, default: "" },
    previousExperience: { type: String, default: "" },
    availability: { type: String, default: "" },

    groundActivity: { type: Boolean, default: false },

    agreedDeclaration: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Volunteer", volunteerSchema);