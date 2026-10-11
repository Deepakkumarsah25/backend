import express from "express";
import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

import {
  renderMediaGallery,
  getMediaByCategory,
  addMedia,
  updateMedia,
  deleteMedia,
} from "../controllers/mediaGalleryController.js";

const router = express.Router();

/* ==========================
   Admin Routes
========================== */

// Admin Page
router.get("/mediagallery", requireAdmin, renderMediaGallery);

// Add
router.post(
  "/mediagallery/add",
  requireAdmin,
  upload.single("image"),
  addMedia
);

// Update
router.post(
  "/mediagallery/update/:id",
  requireAdmin,
  upload.single("image"),
  updateMedia
);

// Delete
router.get(
  "/mediagallery/delete/:id",
  requireAdmin,
  deleteMedia
);

/* ==========================
   Mobile App API
========================== */

router.get(
  "/media/:category",
  getMediaByCategory
);

export default router;
