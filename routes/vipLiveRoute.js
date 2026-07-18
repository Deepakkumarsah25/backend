import express from "express";

import {
  createLive,
  getLive,
  updateLive,
  deleteLive,
  toggleLiveStatus,
} from "../controllers/vipLiveController.js";

const router = express.Router();

/* ===========================
   Live APIs
=========================== */

// Create Live
router.post("/live", createLive);

// Get Live + History
router.get("/live", getLive);

// Update Live
router.put("/live/:id", updateLive);

// Delete Live
router.delete("/live/:id", deleteLive);

// Toggle Live Status
router.patch("/live/:id/status", toggleLiveStatus);

export default router;