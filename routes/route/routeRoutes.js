import express from "express";

import {
  getRoutePage,
  addRoute,
  deleteRoute,
  sendRoute,
  stopTrackingRoute,
} from "../../controllers/route/routeController.js";

const router = express.Router();

/* =========================================
   ROUTE PAGE
========================================= */

router.get(
  "/route",
  getRoutePage
);

/* =========================================
   ADD ROUTE
========================================= */

router.post(
  "/route/add",
  addRoute
);

/* =========================================
   DELETE ROUTE
========================================= */

router.get(
  "/route/delete/:id",
  deleteRoute
);

/* =========================================
   SEND / SHARE ROUTE
========================================= */

router.get(
  "/route/send/:id",
  sendRoute
);

router.post(
  "/route/send/:id",
  sendRoute
);

/* =========================================
   STOP LIVE TRACKING
========================================= */

router.post(
  "/route/stop/:id",
  stopTrackingRoute
);

export default router; 