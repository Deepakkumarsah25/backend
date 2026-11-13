import express from "express";
import {
  getLatestUpdatesApi,
  renderHomepageLatestUpdatesAdmin,
  toggleHighlightStatus,
  createAndHighlightVideo,
} from "../controllers/homepageController.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

const router = express.Router();

/* ===========================================
   Public API for App (Latest Updates)
=========================================== */
router.get("/api/homepage/latest-updates", getLatestUpdatesApi);

/* ===========================================
   Admin Routes (Homepage Management)
=========================================== */
router.get("/admin/homepage/latest-updates", requireAdmin, renderHomepageLatestUpdatesAdmin);
router.post("/admin/homepage/latest-updates/toggle/:type/:id", requireAdmin, toggleHighlightStatus);
router.post("/admin/homepage/latest-updates/create-video", requireAdmin, createAndHighlightVideo);

export default router;
