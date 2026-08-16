import express from "express";
import upload from "../middlewar/upload.js";

import {
  scrollerPage,
  addScrollerMedia,
  getScrollerApi,
  deleteScrollerMedia,
  toggleScrollerStatus,
  updateDisplayOrder,
} from "../controllers/scrollerController.js";

const router = express.Router();

/* Upload Page */
router.get("/scroller", scrollerPage);

/* Upload Media */
router.post(
  "/scroller/add",
  upload.array("media", 20),
  addScrollerMedia
);

/* React Native API */
router.get("/api/scroller", getScrollerApi);

/* Delete */
router.get("/scroller/delete/:id", deleteScrollerMedia);

/* Active / Inactive */
router.get("/scroller/status/:id", toggleScrollerStatus);

/* Update Display Order */
router.post("/scroller/order/:id", updateDisplayOrder);

export default router;