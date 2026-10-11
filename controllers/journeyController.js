import mongoose from "mongoose";
import JourneyMilestone from "../models/JourneyMilestone.js";

const fields = [
  "year",
  "titleEn",
  "titleHi",
  "descriptionEn",
  "descriptionHi",
  "imageUrl",
];

const normalizeMilestone = (input = {}) => ({
  year: Number(input.year),
  titleEn: String(input.titleEn || "").trim(),
  titleHi: String(input.titleHi || "").trim(),
  descriptionEn: String(input.descriptionEn || "").trim(),
  descriptionHi: String(input.descriptionHi || "").trim(),
  imageUrl: String(input.imageUrl || "").trim(),
});

const validMilestone = (milestone) =>
  Number.isFinite(milestone.year) &&
  fields.slice(1, 5).every((field) => milestone[field]);

export const getJourneyMilestones = async (_req, res) => {
  try {
    const milestones = await JourneyMilestone.find()
      .sort({ year: 1, _id: 1 })
      .lean();
    return res.json({
      success: true,
      data: milestones.map(({ _id, ...milestone }) => ({
        ...milestone,
        id: String(_id),
      })),
    });
  } catch (error) {
    console.error("GET JOURNEY MILESTONES ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load journey milestones." });
  }
};

export const createJourneyMilestone = async (req, res) => {
  try {
    const milestone = normalizeMilestone(req.body);
    if (!validMilestone(milestone)) {
      return res.status(400).json({ success: false, message: "Year, titles, and descriptions are required." });
    }
    const created = await JourneyMilestone.create(milestone);
    return res.status(201).json({ success: true, data: { ...milestone, id: String(created._id) } });
  } catch (error) {
    console.error("CREATE JOURNEY MILESTONE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to create journey milestone." });
  }
};

export const updateJourneyMilestone = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid milestone ID." });
  }
  try {
    const milestone = normalizeMilestone(req.body);
    if (!validMilestone(milestone)) {
      return res.status(400).json({ success: false, message: "Year, titles, and descriptions are required." });
    }
    const updated = await JourneyMilestone.findByIdAndUpdate(req.params.id, milestone, {
      new: true,
      runValidators: true,
      lean: true,
    });
    if (!updated) return res.status(404).json({ success: false, message: "Milestone not found." });
    const { _id, ...data } = updated;
    return res.json({ success: true, data: { ...data, id: String(_id) } });
  } catch (error) {
    console.error("UPDATE JOURNEY MILESTONE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update journey milestone." });
  }
};

export const deleteJourneyMilestone = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid milestone ID." });
  }
  try {
    const deleted = await JourneyMilestone.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Milestone not found." });
    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE JOURNEY MILESTONE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to delete journey milestone." });
  }
};

export const resetJourneyMilestones = async (req, res) => {
  const milestones = Array.isArray(req.body?.milestones)
    ? req.body.milestones.map(normalizeMilestone)
    : [];
  if (!milestones.length || milestones.some((item) => !validMilestone(item))) {
    return res.status(400).json({ success: false, message: "A valid non-empty milestone list is required." });
  }
  try {
    await JourneyMilestone.deleteMany({});
    const created = await JourneyMilestone.insertMany(milestones);
    return res.json({ success: true, data: created.length });
  } catch (error) {
    console.error("RESET JOURNEY MILESTONES ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to reset journey milestones." });
  }
};
