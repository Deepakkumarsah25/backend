import express from "express";

import {
  getRoutePage,
  addRoute,
  deleteRoute,
  sendRoute,
  stopTrackingRoute,
} from "../../controllers/route/routeController.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

const router = express.Router();

/* =========================================
   ROUTE PAGE
========================================= */

router.get(
  "/route",
  requireAdmin,
  getRoutePage
);

/* =========================================
   ADD ROUTE
========================================= */

router.post(
  "/route/add",
  requireAdmin,
  addRoute
);

/* =========================================
   DELETE ROUTE
========================================= */

router.get(
  "/route/delete/:id",
  requireAdmin,
  deleteRoute
);

/* =========================================
   SEND / SHARE ROUTE
========================================= */

router.get(
  "/route/send/:id",
  requireAdmin,
  sendRoute
);

router.post(
  "/route/send/:id",
  requireAdmin,
  sendRoute
);

/* =========================================
   STOP LIVE TRACKING
========================================= */

router.post(
  "/route/stop/:id",
  requireAdmin,
  stopTrackingRoute
);

export default router; 
