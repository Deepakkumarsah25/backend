import express from "express";

import {
  getVideosVersion,
  getVideos,
  getVideoById,
  getRelatedVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "../controllers/videogalleryController.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

const router =
  express.Router();

/* ===========================================
   Version
=========================================== */

router.get(
  "/videos/version",
  getVideosVersion
);

/* ===========================================
   Get All
=========================================== */

router.get(
  "/videos",
  getVideos
);

/* ===========================================
   Related
=========================================== */

router.get(
  "/videos/related/:id",
  getRelatedVideos
);

/* ===========================================
   Single
=========================================== */

router.get(
  "/videos/:id",
  getVideoById
);

/* ===========================================
   Create
=========================================== */

router.post(
  "/videos",
  requireAdmin,
  createVideo
);

/* ===========================================
   Update
=========================================== */

router.put(
  "/videos/:id",
  requireAdmin,
  updateVideo
);

/* ===========================================
   Delete
=========================================== */

router.delete(
  "/videos/:id",
  requireAdmin,
  deleteVideo
);

export default router;
