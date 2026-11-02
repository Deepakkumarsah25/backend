import express from "express";
import { protect } from "../middlewar/firebaseAuth.js";
import { requireFirebaseAdmin } from "../middlewar/requireFirebaseAdmin.js";
import {
  createJourneyMilestone,
  deleteJourneyMilestone,
  getJourneyMilestones,
  resetJourneyMilestones,
  updateJourneyMilestone,
} from "../controllers/journeyController.js";

const router = express.Router();
router.get("/api/journey", getJourneyMilestones);
router.post("/api/journey", protect, requireFirebaseAdmin, createJourneyMilestone);
router.put("/api/journey/:id", protect, requireFirebaseAdmin, updateJourneyMilestone);
router.delete("/api/journey/:id", protect, requireFirebaseAdmin, deleteJourneyMilestone);
router.post("/api/journey/reset", protect, requireFirebaseAdmin, resetJourneyMilestones);

export default router;
