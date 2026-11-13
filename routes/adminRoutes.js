import cmsRoutes from "./cmsRoutes.js";
import express from "express";
import rateLimit from "express-rate-limit";

import {
  loginAdmin,
  logoutAdmin,
  createAdmin,
  dashboard,
  quickUpdateActivity,
  getActivityLogsPage,
  getActivityLogsApi,
} from "../controllers/adminController.js";

import {
  getAllJoinApplications,
  getJoinAgents,
  getJoinApplicationById,
  deleteJoinApplication,
  renderJoinAdminPage,
  approveJoinApplication,
  rejectJoinApplication,
  reviewMembershipIdentityChange,
} from "../controllers/joinController.js";

import Video from "../models/videogallery.js";
import Album from "../models/Album.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";
import {
  createCampaignDraft,
  updateCampaignDraft,
  publishCampaignAdmin,
  listCampaigns,
  getCampaignStats,
  cancelScheduledCampaign,
  deleteCampaignAdmin,
  deleteMultipleCampaignsAdmin,
  renderNotificationAdminPage,
} from "../controllers/notification/notificationAdminController.js";

/* =========================================
   DELETE ACCOUNT CONTROLLER
========================================= */

import {
  renderDeleteAccountPage,
  adminDeleteAccount,
  adminCancelDeleteAccount,
} from "../controllers/admin/deleteAccountAdminController.js";

const router = express.Router();
const adminLoginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many login attempts. Please try again later.",
});

// Notification campaign management uses the existing administrator session.
router.get("/admin/notifications/:section", requireAdmin, renderNotificationAdminPage);
router.get("/api/admin/notifications/campaigns", requireAdmin, listCampaigns);
router.post("/api/admin/notifications/campaigns", requireAdmin, createCampaignDraft);
router.patch("/api/admin/notifications/campaigns/:id", requireAdmin, updateCampaignDraft);
router.post("/api/admin/notifications/campaigns/:id/publish", requireAdmin, publishCampaignAdmin);
router.get("/api/admin/notifications/campaigns/:id/stats", requireAdmin, getCampaignStats);
router.post("/api/admin/notifications/campaigns/:id/cancel", requireAdmin, cancelScheduledCampaign);
router.delete("/api/admin/notifications/campaigns/:id", requireAdmin, deleteCampaignAdmin);
router.post("/api/admin/notifications/campaigns/delete-multiple", requireAdmin, deleteMultipleCampaignsAdmin);

/* =========================================
   HOME
========================================= */

router.get("/", (req, res) => {
  res.render("index", { sessionExpired: req.query.session === "expired" });
});

/* =========================================
   ADMIN AUTH & DASHBOARD
========================================= */

// Public admin creation is disabled; provisioning must be done out of band.
router.get("/create-admin", (req, res) => res.sendStatus(404));

router.post("/login", adminLoginLimit, loginAdmin);

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
router.get("/activity-logs", requireAdmin, getActivityLogsPage);
router.get("/activity-log", requireAdmin, getActivityLogsPage);
router.get("/activitylogs", requireAdmin, getActivityLogsPage);
router.get("/activitylog", requireAdmin, getActivityLogsPage);
router.get("/activities", requireAdmin, getActivityLogsPage);
router.get("/activity", requireAdmin, getActivityLogsPage);
router.get("/10-day-activity", requireAdmin, getActivityLogsPage);
router.get("/10-days-activity", requireAdmin, getActivityLogsPage);
router.get("/10-days-activity-log", requireAdmin, getActivityLogsPage);
router.get("/admin/activity-logs", requireAdmin, getActivityLogsPage);
router.get("/admin/activity-log", requireAdmin, getActivityLogsPage);
router.get("/admin/activitylogs", requireAdmin, getActivityLogsPage);
router.get("/admin/activitylog", requireAdmin, getActivityLogsPage);
router.get("/admin/activities", requireAdmin, getActivityLogsPage);
router.get("/admin/activity", requireAdmin, getActivityLogsPage);

router.post("/api/admin/quick-update", requireAdmin, quickUpdateActivity);
router.get("/api/activity-logs", requireAdmin, getActivityLogsApi);
router.get("/api/admin/activity-logs", requireAdmin, getActivityLogsApi);


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
  "/joinmember/agents",
  requireAdmin,
  getJoinAgents
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

router.post(
  "/joinmember/:id/identity-change/:decision",
  requireAdmin,
  reviewMembershipIdentityChange
);

router.delete(
  "/joinmember/:id",
  requireAdmin,
  deleteJoinApplication
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
