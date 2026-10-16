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

const router = express.Router();

// Support / Donate Page Settings
router.get("/support-settings", requireAdmin, renderSupportSettingsPage);
router.post("/support-settings/update", requireAdmin, updateSupportSettings);

// Donations Submissions List & Actions
router.get("/donations", requireAdmin, renderDonationsListPage);
router.post("/donations/status", requireAdmin, updateDonationStatus);
router.post("/donations/delete", requireAdmin, deleteDonationRecord);
router.get("/donations/export", requireAdmin, exportDonationsCsv);

export default router;
