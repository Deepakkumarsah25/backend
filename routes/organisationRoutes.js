import express from "express";
import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

import {
  showOrganisation,
  showAddOrganisation,
  addOrganisation,
  editOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getOrganisation,
  getOrganisationDetails,
} from "../controllers/organisationcontroller.js";

const router = express.Router();

// =======================
// Admin Panel
// =======================

// Show All
router.get("/", requireAdmin, showOrganisation);

// Add Page
router.get("/add", requireAdmin, showAddOrganisation);

// Save
router.post(
  "/add",
  requireAdmin,
  upload.single("image"),
  addOrganisation
);

// Edit Page
router.get(
  "/edit/:id",
  requireAdmin,
  editOrganisation
);

// Update
router.post(
  "/update/:id",
  requireAdmin,
  upload.single("image"),
  updateOrganisation
);

// Delete
router.delete(
  "/delete/:id",
  requireAdmin,
  deleteOrganisation
);

// =======================
// Mobile APIs
// =======================

// All Members
router.get(
  "/api",
  getOrganisation
);

// Members By Category
router.get(
  "/api/:category",
  getOrganisation
);

// Single Member Details
router.get(
  "/api/details/:id",
  getOrganisationDetails
);

export default router;
