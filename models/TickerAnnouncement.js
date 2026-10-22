import mongoose from "mongoose";

const contentSectionSchema = new mongoose.Schema({
  heading: { type: String, default: "", trim: true },
  content: { type: String, default: "", trim: true },
  imageUrl: { type: String, default: "", trim: true },
});

const tickerAnnouncementSchema = new mongoose.Schema({
  tickerText: { type: String, required: true, trim: true, maxlength: 400 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  summary: { type: String, default: "", trim: true, maxlength: 400 },
  content: { type: String, default: "", trim: true },
  coverImage: { type: String, default: "", trim: true },
  sections: [contentSectionSchema],
  active: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.TickerAnnouncement || mongoose.model("TickerAnnouncement", tickerAnnouncementSchema);
