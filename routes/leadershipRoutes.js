import express from "express";
import upload from "../middlewar/upload.js";

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
router.get("/", showLeadership);

// Add Page
router.get("/add", showAddLeadership);

// Save
router.post(
  "/add",
  upload.single("image"),
  addLeadership
);

// Edit Page
router.get(
  "/edit/:id",
  editLeadership
);

// Update
router.post(
  "/update/:id",
  upload.single("image"),
  updateLeadership
);

// Delete
router.delete(
  "/delete/:id",
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