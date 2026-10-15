import express from "express";
import {
  renderAdminFormsPage,
  getFormItemDetail,
  updateFormStatus,
  deleteFormItem,
  exportFormsCsv,
} from "../controllers/adminFormsController.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";

const router = express.Router();

// Web Admin Dashboard for Forms
router.get("/", requireAdmin, renderAdminFormsPage);

// API Endpoints
router.get("/detail/:formType/:id", requireAdmin, getFormItemDetail);
router.post("/status", requireAdmin, updateFormStatus);
router.post("/delete", requireAdmin, deleteFormItem);
router.get("/export/:formType", requireAdmin, exportFormsCsv);

export default router;
