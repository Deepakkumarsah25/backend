import express from "express";

import {
  createLive,
  getLive,
  getLiveVersion,
  getLiveById,
  updateLive,
  deleteLive,
  toggleLiveStatus,
} from "../controllers/vipLiveController.js";

const router = express.Router();

router.post("/live", createLive);

router.get("/live", getLive);

router.get("/live/version", getLiveVersion);

router.get("/live/:id", getLiveById);

router.put("/live/:id", updateLive);

router.delete("/live/:id", deleteLive);

router.patch("/live/:id/status", toggleLiveStatus);

export default router;