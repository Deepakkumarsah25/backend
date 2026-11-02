import express from "express";

import {
  trackingPage,
  trackingStatus,
  startTracking,
  updateTracking,
} from "../../controllers/tracking/trackingController.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

const router = express.Router();

router.get("/track/:routeId", requireAdmin, trackingPage);
router.post("/api/tracking/start/:routeId", requireAdmin, startTracking);
router.get("/api/tracking/status/:routeId", requireAdmin, trackingStatus);
router.post("/api/tracking/update", requireAdmin, updateTracking);

export default router;
