import mongoose from "mongoose";

const journeyMilestoneSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    titleEn: { type: String, required: true, trim: true },
    titleHi: { type: String, required: true, trim: true },
    descriptionEn: { type: String, required: true, trim: true },
    descriptionHi: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

journeyMilestoneSchema.index({ year: 1 });

export default mongoose.model("JourneyMilestone", journeyMilestoneSchema);
