import cmsRoutes from "./cmsRoutes.js";
import express from "express";
import upload from "../middlewar/upload.js";

import {
  loginAdmin,
  logoutAdmin,
  createAdmin,
  dashboard,
  quickUpdateActivity,
  addBanner,
  deleteBanner,
  getActivityLogsPage,
} from "../controllers/adminController.js";

import {
  getAllJoinApplications,
  getJoinApplicationById,
  deleteJoinApplication,
  renderJoinAdminPage,
  approveJoinApplication,
  rejectJoinApplication,
} from "../controllers/joinController.js";

import Video from "../models/videogallery.js";
import Album from "../models/Album.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

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
   ADMIN AUTH & DASHBOARD
========================================= */

// Public admin creation is disabled; provisioning must be done out of band.
router.get("/create-admin", (req, res) => res.sendStatus(404));

router.post("/login", loginAdmin);

router.get("/logout", logoutAdmin);
router.post("/logout", logoutAdmin);

/* =========================================
   LOGOUT
========================================= */

router.get(
  "/logout",
  requireAdmin,
  logoutAdmin
);

router.get(
  "/dashboard",
  requireAdmin,
  dashboard
);

/* 10-Day Activity Logs Route and Aliases */
router.get("/activity-logs", getActivityLogsPage);
router.get("/activity-log", getActivityLogsPage);
router.get("/activitylogs", getActivityLogsPage);
router.get("/activitylog", getActivityLogsPage);
router.get("/activities", getActivityLogsPage);
router.get("/activity", getActivityLogsPage);
router.get("/10-day-activity", getActivityLogsPage);
router.get("/10-days-activity", getActivityLogsPage);
router.get("/10-days-activity-log", getActivityLogsPage);
router.get("/admin/activity-logs", getActivityLogsPage);
router.get("/admin/activity-log", getActivityLogsPage);
router.get("/admin/activitylogs", getActivityLogsPage);
router.get("/admin/activitylog", getActivityLogsPage);
router.get("/admin/activities", getActivityLogsPage);
router.get("/admin/activity", getActivityLogsPage);

router.post("/api/admin/quick-update", quickUpdateActivity);


/* =========================================
   VIP LIVE
========================================= */

router.get(
  "/vip-live",
  requireAdmin,
  (req, res) => {
    res.render("viplive");
  }
);

/* =========================================
   VIDEO GALLERY
========================================= */

router.get(
  "/video_gallery",
  requireAdmin,
  async (req, res) => {
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
  }
);

/* =========================================
   ALBUM
========================================= */

router.get(
  "/album",
  requireAdmin,
  async (req, res) => {
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
  }
);

/* =========================================
   JOIN MEMBER
========================================= */

router.get(
  "/joinmember",
  requireAdmin,
  renderJoinAdminPage
);

router.get(
  "/joinmember/data",
  requireAdmin,
  getAllJoinApplications
);

router.get(
  "/joinmember/:id",
  requireAdmin,
  getJoinApplicationById
);

router.post(
  "/joinmember/:id/approve",
  requireAdmin,
  approveJoinApplication
);

router.post(
  "/joinmember/:id/reject",
  requireAdmin,
  rejectJoinApplication
);

router.delete(
  "/joinmember/:id",
  requireAdmin,
  deleteJoinApplication
);

/* =========================================
   BANNER
========================================= */

router.post(
  "/banner/add",
  requireAdmin,
  upload.array("banner", 20),
  addBanner
);

router.delete(
  "/banner/delete/:id",
  requireAdmin,
  deleteBanner
);

/* =========================================
   CONTACT US
========================================= */

import * as contactController from "../controllers/admin/contactController.js";

router.get(
  "/admin/contact",
  requireAdmin,
  contactController.renderContactPage
);

router.post(
  "/admin/contact/update",
  requireAdmin,
  contactController.updateContactInfo
);

router.post(
  "/admin/contact/office/add",
  requireAdmin,
  contactController.addOffice
);

router.post(
  "/admin/contact/office/edit/:id",
  requireAdmin,
  contactController.editOffice
);

router.post(
  "/admin/contact/office/delete/:id",
  requireAdmin,
  contactController.deleteOffice
);

/* =========================================
   DELETE ACCOUNT
========================================= */

/*
   Open Delete Account Requests page
   URL:
   /admin/delete-accounts
*/

router.get(
  "/admin/delete-accounts",
  requireAdmin,
  renderDeleteAccountPage
);

/*
   Admin permanently deletes account
   Firebase Auth + MongoDB
*/

router.post(
  "/admin/delete-account/:id",
  requireAdmin,
  adminDeleteAccount
);

/*
   Admin cancels deletion request
*/

router.post(
  "/admin/delete-account/cancel/:id",
  requireAdmin,
  adminCancelDeleteAccount
);

/* =========================================
   CMS
========================================= */

router.use(
  "/cms",
  cmsRoutes
);

export default router;