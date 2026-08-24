import express from "express";

import {
  trackingPage,
  updateTracking
} from "../../controllers/tracking/trackingController.js";

const router = express.Router();

router.get(
  "/track/:routeId",
  trackingPage
);

router.post(
  "/api/tracking/update",
  updateTracking
);

export default router;