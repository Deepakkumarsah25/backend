import express from "express";
import upload from "../middlewar/upload.js";

import {
  showOrganisation,
  showAddOrganisation,
  addOrganisation,
  editOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getOrganisation,
  getOrganisationDetails,
} from "../controllers/organisationController.js";

const router = express.Router();

// =======================
// Admin Panel
// =======================

// Show All
router.get("/", showOrganisation);

// Add Page
router.get("/add", showAddOrganisation);

// Save
router.post(
  "/add",
  upload.single("image"),
  addOrganisation
);

// Edit Page
router.get(
  "/edit/:id",
  editOrganisation
);

// Update
router.post(
  "/update/:id",
  upload.single("image"),
  updateOrganisation
);

// Delete
router.delete(
  "/delete/:id",
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