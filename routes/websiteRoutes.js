import express from "express";
import {
  renderSupportSettingsPage,
  updateSupportSettings,
  renderDonationsListPage,
  updateDonationStatus,
  deleteDonationRecord,
  exportDonationsCsv,
} from "../controllers/websiteController.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";
import { deleteTickerAnnouncement, editTickerAnnouncement, listTickerAnnouncements, publicTickerAnnouncement, publicTickerAnnouncements, saveTickerAnnouncement } from "../controllers/tickerAnnouncementController.js";

const router = express.Router();

router.get("/ticker-announcements/api", publicTickerAnnouncements);
router.get("/ticker-announcements/api/:slug", publicTickerAnnouncement);
router.get("/ticker-announcements", requireAdmin, listTickerAnnouncements);
router.get("/ticker-announcements/:id/edit", requireAdmin, editTickerAnnouncement);
router.post("/ticker-announcements/:id/save", requireAdmin, saveTickerAnnouncement);
router.post("/ticker-announcements/:id/delete", requireAdmin, deleteTickerAnnouncement);

// Support / Donate Page Settings
router.get("/support-settings", requireAdmin, renderSupportSettingsPage);
router.post("/support-settings/update", requireAdmin, updateSupportSettings);

// Donations Submissions List & Actions
router.get("/donations", requireAdmin, renderDonationsListPage);
router.post("/donations/status", requireAdmin, updateDonationStatus);
router.post("/donations/delete", requireAdmin, deleteDonationRecord);
router.get("/donations/export", requireAdmin, exportDonationsCsv);

export default router;
