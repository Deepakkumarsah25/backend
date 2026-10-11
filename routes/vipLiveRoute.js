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
import { requireAdmin } from "../middlewar/requireAdmin.js";

const router = express.Router();

router.post("/live", requireAdmin, createLive);

router.get("/live", getLive);

router.get("/live/version", getLiveVersion);

router.get("/live/:id", getLiveById);

router.put("/live/:id", requireAdmin, updateLive);

router.delete("/live/:id", requireAdmin, deleteLive);

router.patch("/live/:id/status", requireAdmin, toggleLiveStatus);

export default router;
