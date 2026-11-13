import mongoose from "mongoose";

const inspirationLeaderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    role: { type: String, default: "", trim: true, maxlength: 180 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    imageUrl: { type: String, required: true, trim: true, maxlength: 1000 },
    icon: { type: String, default: "fa-star", trim: true, maxlength: 80 },
    displayOrder: { type: Number, default: 0, min: 0, max: 10000 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "inspirationleaders" }
);

inspirationLeaderSchema.index({ isPublished: 1, displayOrder: 1, createdAt: 1 });

export default mongoose.models.InspirationLeader ||
  mongoose.model("InspirationLeader", inspirationLeaderSchema);
