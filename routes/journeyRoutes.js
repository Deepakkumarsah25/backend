import express from "express";
import { protect } from "../middlewar/firebaseAuth.js";
import {
  createJourneyMilestone,
  deleteJourneyMilestone,
  getJourneyMilestones,
  resetJourneyMilestones,
  updateJourneyMilestone,
} from "../controllers/journeyController.js";

const router = express.Router();
const journeyAdminEmails = new Set(
  (process.env.JOURNEY_ADMIN_EMAILS || "admin@gmail.com,deepak@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const requireJourneyAdmin = (req, res, next) => {
  if (!req.user?.email || !journeyAdminEmails.has(req.user.email.toLowerCase())) {
    return res.status(403).json({ success: false, message: "Administrator access required." });
  }
  return next();
};

router.get("/api/journey", getJourneyMilestones);
router.post("/api/journey", protect, requireJourneyAdmin, createJourneyMilestone);
router.put("/api/journey/:id", protect, requireJourneyAdmin, updateJourneyMilestone);
router.delete("/api/journey/:id", protect, requireJourneyAdmin, deleteJourneyMilestone);
router.post("/api/journey/reset", protect, requireJourneyAdmin, resetJourneyMilestones);

export default router;
