import mongoose from "mongoose";

const organisationCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    title_hi: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("OrganisationCategory", organisationCategorySchema);