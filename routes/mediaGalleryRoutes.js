import express from "express";
import upload from "../middlewar/upload.js";

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
router.get("/mediagallery", renderMediaGallery);

// Add
router.post(
  "/mediagallery/add",
  upload.single("image"),
  addMedia
);

// Update
router.post(
  "/mediagallery/update/:id",
  upload.single("image"),
  updateMedia
);

// Delete
router.get(
  "/mediagallery/delete/:id",
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