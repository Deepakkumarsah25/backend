import express from "express";

import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

import {
  scrollerPage,
  addScrollerMedia,
  getScrollerApi,
  deleteScrollerMedia,
  toggleScrollerStatus,
  updateDisplayOrder,
} from "../controllers/scrollerController.js";

const router = express.Router();

/* =========================================
   Admin Scroller Page
========================================= */

router.get(
  "/scroller",
  requireAdmin,
  scrollerPage
);

/* =========================================
   Upload Media
========================================= */

router.post(
  "/scroller/add",
  requireAdmin,
  upload.array("media", 20),
  addScrollerMedia
);

/* =========================================
   React Native API
========================================= */

router.get(
  "/api/scroller",
  getScrollerApi
);

/* =========================================
   Delete Media
========================================= */

router.delete(
  "/scroller/delete/:id",
  requireAdmin,
  deleteScrollerMedia
);

/* =========================================
   Active / Inactive
========================================= */

router.get(
  "/scroller/status/:id",
  requireAdmin,
  toggleScrollerStatus
);

/* =========================================
   Display Order
========================================= */

router.post(
  "/scroller/order/:id",
  requireAdmin,
  updateDisplayOrder
);

export default router;
