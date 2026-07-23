import express from "express";
import {
  getCmsPages,
  getCmsPage,
  updateCmsPage,
  addSection,
  deleteSection,
  editSection,
} from "../controllers/cmsController.js";
import upload from "../middlewar/upload.js";

const router = express.Router();

// CMS Dashboard
router.get("/", getCmsPages);

// Single Page Edit
router.get("/:pageKey", getCmsPage);

// Save Page
router.post("/:pageKey/update", updateCmsPage);


// Add Section
router.post(
  "/:pageKey/section/add",
  upload.single("image"),
  addSection
);

router.post(
  "/:pageKey/section/edit/:sectionId",
  upload.single("image"),
  editSection
);

// Delete Section
router.get(
  "/:pageKey/section/delete/:sectionId",
  deleteSection
);

// router.post(
//   "/:pageKey/banner/upload",
//   upload.single("banner"),
//   uploadBanner
// );

export default router;
