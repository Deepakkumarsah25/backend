import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true },
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    email: { type: String, default: "", trim: true },
    gender: { type: String, default: "Male" },
    category: { type: String, default: "Nishad / Mallah" },
    dob: { type: String, default: "" },
    currentCourse: { type: String, required: true },
    institute: { type: String, required: true },
    percentageMarks: { type: String, default: "" },
    familyAnnualIncome: { type: String, default: "" },
    district: { type: String, required: true },
    assembly: { type: String, default: "" },
    address: { type: String, default: "" },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Scholarship || mongoose.model("Scholarship", scholarshipSchema);
