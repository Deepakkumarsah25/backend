import express from "express";
import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";
import {
  renderDownloadsPage,
  addDownload,
  editDownload,
  toggleDownloadStatus,
  deleteDownload,
  getDownloadsApi,
  trackDownload,
} from "../controllers/downloadController.js";

const router = express.Router();

/* =========================================================
   PUBLIC / API ROUTES
========================================================= */

// Public API to get downloads by category (or all)
router.get("/api/list", getDownloadsApi);
router.get("/api/list/:category", getDownloadsApi);
router.post("/api/track/:id", trackDownload);

/* =========================================================
   ADMIN CRUD ROUTES
========================================================= */

// Admin Downloads Hub & Category View
router.get("/", requireAdmin, renderDownloadsPage);
router.get("/:category", requireAdmin, renderDownloadsPage);

// Add Download Item
router.post("/add", requireAdmin, upload.single("image"), addDownload);

// Edit / Update Download Item
router.post("/edit/:id", requireAdmin, upload.single("image"), editDownload);

// Toggle Published Status (AJAX)
router.post("/toggle/:id", requireAdmin, toggleDownloadStatus);

// Delete Download Item
router.post("/delete/:id", requireAdmin, deleteDownload);
router.delete("/delete/:id", requireAdmin, deleteDownload);

export default router;
