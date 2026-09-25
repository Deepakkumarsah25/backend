import cmsRoutes from "./cmsRoutes.js";
import express from "express";
import upload from "../middlewar/upload.js";
import { requireAdmin } from "../middlewar/adminAuth.js";
import {
  loginAdmin,
  createAdmin,
  dashboard,
  addBanner,
  logoutAdmin,
  deleteBanner,
} from "../controllers/adminController.js";

import {
  getAllJoinApplications,
  getJoinApplicationById,
  deleteJoinApplication,
  renderJoinAdminPage,
} from "../controllers/joinController.js";

import Video from "../models/videogallery.js";
import Album from "../models/Album.js";

/* =========================================
   DELETE ACCOUNT CONTROLLER
========================================= */

import {
  renderDeleteAccountPage,
  adminDeleteAccount,
  adminCancelDeleteAccount,
} from "../controllers/admin/deleteAccountAdminController.js";

const router = express.Router();

/* =========================================
   HOME
========================================= */

router.get("/", (req, res) => {
  res.render("index");
});

/* =========================================
   ADMIN
========================================= */

router.get("/create-admin", createAdmin);

router.post("/login", loginAdmin);

router.get("/dashboard", requireAdmin, dashboard);

/* =========================================
   VIP LIVE
========================================= */

router.get("/vip-live", requireAdmin, (req, res) => {
  res.render("viplive");
});

/* =========================================
   VIDEO GALLERY
========================================= */

router.get("/video_gallery", async (req, res) => {
  try {
    const videos = await Video.find().sort({
      createdAt: -1,
    });

    res.render("video_gallery", {
      videos,
    });
  } catch (error) {
    console.log(error);

    res.render("video_gallery", {
      videos: [],
    });
  }
});

/* =========================================
   ALBUM
========================================= */

router.get("/album", async (req, res) => {
  try {
    const albums = await Album.find().sort({
      createdAt: -1,
    });

    res.render("album", {
      albums,
    });
  } catch (error) {
    console.log(error);

    res.render("album", {
      albums: [],
    });
  }
});

/* =========================================
   JOIN MEMBER
========================================= */

router.get("/joinmember", renderJoinAdminPage);

router.get("/joinmember/data", getAllJoinApplications);

router.get("/joinmember/:id", getJoinApplicationById);

router.delete("/joinmember/:id", deleteJoinApplication);

/* =========================================
   BANNER
========================================= */

router.post("/banner/add", upload.array("banner", 20), addBanner);

router.delete("/banner/delete/:id", deleteBanner);

/* =========================================
   CONTACT US
========================================= */

import * as contactController from "../controllers/admin/contactController.js";

router.get("/admin/contact", contactController.renderContactPage);

router.post("/admin/contact/update", contactController.updateContactInfo);

router.post("/admin/contact/office/add", contactController.addOffice);

router.post("/admin/contact/office/edit/:id", contactController.editOffice);

router.post("/admin/contact/office/delete/:id", contactController.deleteOffice);
router.get("/logout", logoutAdmin);

/* =========================================
   DELETE ACCOUNT
========================================= */

/*
   Open Delete Account Requests page
   URL:
   /admin/delete-accounts
*/

router.get("/admin/delete-accounts", renderDeleteAccountPage);

/*
   Admin permanently deletes account
   Firebase Auth + MongoDB
*/

router.post("/admin/delete-account/:id", adminDeleteAccount);

/*
   Admin cancels deletion request
*/

router.post("/admin/delete-account/cancel/:id", adminCancelDeleteAccount);

/* =========================================
   CMS
========================================= */

router.use("/cms", cmsRoutes);

export default router;
