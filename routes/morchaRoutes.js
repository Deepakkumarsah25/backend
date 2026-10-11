import express from "express";
import upload from "../middlewar/upload.js"; 
import { requireAdmin } from "../middlewar/requireAdmin.js";
import {
  renderMorcha,
  renderEditMorcha,
  addMorcha,
  updateMorcha,
  deleteMorcha,
  getAllMorcha,
  getMorchaById,
} from "../controllers/morchaController.js";

const router = express.Router();

/* ===========================
   Admin Routes
=========================== */
router.get("/morcha", requireAdmin, renderMorcha);
router.get("/morcha/edit/:id", requireAdmin, renderEditMorcha);
router.post("/morcha/add", requireAdmin, upload.single("image"), addMorcha);
router.post("/morcha/update/:id", requireAdmin, upload.single("image"), updateMorcha);
router.get("/morcha/delete/:id", requireAdmin, deleteMorcha);

/* ===========================
   App API Routes
=========================== */
router.get("/api/morcha", getAllMorcha);
router.get("/api/morcha/:id", getMorchaById);

export default router;
