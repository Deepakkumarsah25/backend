
import cmsRoutes from "./cmsRoutes.js";
import express from "express";
import upload from "../middlewar/upload.js";

import {
  loginAdmin,
  createAdmin,
  dashboard,
  addBanner,
  deleteBanner,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/create-admin", createAdmin);

router.post("/login", loginAdmin);

router.get("/dashboard", dashboard);

router.post(
  "/banner/add",
  upload.array("banner", 20),
  addBanner
);

router.delete(
  "/banner/delete/:id",
  deleteBanner
);


// contact us page ke liye 

import * as contactController from "../controllers/admin/contactController.js";
router.get("/admin/contact", contactController.renderContactPage);
router.post("/admin/contact/update", contactController.updateContactInfo);
router.post("/admin/contact/office/add", contactController.addOffice);
router.post("/admin/contact/office/edit/:id", contactController.editOffice);
router.post("/admin/contact/office/delete/:id", contactController.deleteOffice);
router.use("/cms", cmsRoutes);

export default router;