import express from "express";

import {
  getCmsPages,
  getCmsPage,
  getCmsPageApi,
  updateCmsPage,
  addSection,
  deleteSection,
  editSection,
  uploadBanner,
} from "../controllers/cmsController.js";

import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

const router = express.Router();


// ======================================================
// MOBILE APP API
// ======================================================

router.get(
  "/api/:pageKey",
  getCmsPageApi
);


// ======================================================
// CMS ADMIN DASHBOARD
// ======================================================

router.get(
  "/",
  requireAdmin,
  getCmsPages
);


// ======================================================
// SINGLE PAGE EDIT
// ======================================================

router.get(
  "/:pageKey",
  requireAdmin,
  getCmsPage
);


// ======================================================
// UPDATE PAGE
// ======================================================

router.post(
  "/:pageKey/update",
  requireAdmin,
  updateCmsPage
);


// ======================================================
// ADD SECTION
// ======================================================

router.post(
  "/:pageKey/section/add",
  requireAdmin,
  upload.single("image"),
  addSection
);


// ======================================================
// EDIT SECTION
// ======================================================

router.post(
  "/:pageKey/section/edit/:sectionId",
  requireAdmin,
  upload.single("image"),
  editSection
);


// ======================================================
// DELETE SECTION
// ======================================================

router.get(
  "/:pageKey/section/delete/:sectionId",
  requireAdmin,
  deleteSection
);


// ======================================================
// UPLOAD BANNER
// ======================================================

router.post(
  "/:pageKey/banner/upload",
  requireAdmin,
  upload.single("banner"),
  uploadBanner
);


export default router;
