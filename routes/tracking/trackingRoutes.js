import express from "express";

import {
  trackingPage,
  trackingStatus,
  startTracking,
  updateTracking,
} from "../../controllers/tracking/trackingController.js";

const router = express.Router();

/* =========================================
   PUBLIC LIVE TRACKING PAGE
========================================= */

router.get(
  "/track/:routeId",
  trackingPage
);


/* =========================================
   START TRACKING
   Admin Track button se call hoga
========================================= */

router.post(
  "/api/tracking/start/:routeId",
  startTracking
);


/* =========================================
   LIVE STATUS
========================================= */

router.get(
  "/api/tracking/status/:routeId",
  trackingStatus
);


/* =========================================
   LIVE GPS UPDATE
========================================= */

router.post(
  "/api/tracking/update",
  updateTracking
);

export default router;