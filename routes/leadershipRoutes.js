import express from "express";
import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

import {
  showLeadership,
  showAddLeadership,
  addLeadership,
  editLeadership,
  updateLeadership,
  deleteLeadership,
  getFounders,
  getLeaders,
  getLeaderss,
  getLeadershipDetails,
} from "../controllers/leadershipController.js";

const router = express.Router();

// =======================
// Admin Panel
// =======================

// Show All
router.get("/", requireAdmin, showLeadership);

// Add Page
router.get("/add", requireAdmin, showAddLeadership);

// Save
router.post(
  "/add",
  requireAdmin,
  upload.single("image"),
  addLeadership
);

// Edit Page
router.get(
  "/edit/:id",
  requireAdmin,
  editLeadership
);

// Update
router.post(
  "/update/:id",
  requireAdmin,
  upload.single("image"),
  updateLeadership
);

// Delete
router.delete(
  "/delete/:id",
  requireAdmin,
  deleteLeadership
);

// =======================
// Mobile APIs
// =======================

// Founders
router.get(
  "/api/founders",
  getFounders
);

// MLA
router.get(
  "/api/leaders",
  getLeaders
);

// Party Leaders
router.get(
  "/api/leaderss",
  getLeaderss
);



// Details
router.get(
  "/api/details/:id",
  getLeadershipDetails
);

export default router;
