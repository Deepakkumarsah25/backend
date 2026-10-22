import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.models.TickerAnnouncementMeta || mongoose.model("TickerAnnouncementMeta", schema);
