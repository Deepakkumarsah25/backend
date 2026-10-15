import mongoose from "mongoose";

const candidatureSchema = new mongoose.Schema(
  {
    candidatureId: { type: String, unique: true },
    applicantName: { type: String, required: true, trim: true },
    fatherOrHusbandName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "", trim: true },
    age: { type: Number, default: 25 },
    gender: { type: String, default: "Male" },
    state: { type: String, default: "Uttar Pradesh" },
    district: { type: String, required: true },
    assemblyConstituency: { type: String, required: true },
    casteCommunity: { type: String, default: "" },
    education: { type: String, default: "" },
    profession: { type: String, default: "" },
    politicalExperience: { type: String, default: "" },
    activeInVipSince: { type: String, default: "" },
    criminalCases: { type: String, default: "None" },
    status: { type: String, default: "Under Review" },
  },
  { timestamps: true }
);

export default mongoose.models.Candidature || mongoose.model("Candidature", candidatureSchema);
