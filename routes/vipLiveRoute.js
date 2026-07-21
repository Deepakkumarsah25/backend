import express from "express";

import {
  createLive,
  getLive,
  getLiveById,   
  updateLive,
  deleteLive,
  toggleLiveStatus,
} from "../controllers/vipLiveController.js";

const router = express.Router();

// Create Live
router.post("/live", createLive);

// Get Live + History (full list)
router.get("/live", getLive);

// Get single Live by id
router.get("/live/:id", getLiveById);

// Update Live
router.put("/live/:id", updateLive);

// Delete Live
router.delete("/live/:id", deleteLive);

// Toggle Live Status
router.patch("/live/:id/status", toggleLiveStatus);

export default router;