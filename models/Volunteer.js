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
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null, sparse: true },

    photoURL: { type: String, default: "" },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    dob: { type: mongoose.Schema.Types.Mixed },
    gender: { type: String, default: "Male" },

    state: { type: String, default: "Bihar" },
    district: { type: String, required: true },
    assemblyConstituency: { type: String, default: "" },
    village: { type: String, default: "" },
    pinCode: { type: String, default: "" },

    volunteerTypes: [{ type: String }],
    otherTypeDetail: { type: String, default: "" },

    skills: { type: String, default: "" },
    previousExperience: { type: String, default: "" },
    availability: { type: String, default: "Full Time" },

    groundActivity: { type: Boolean, default: false },

    agreedDeclaration: { type: Boolean, default: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);