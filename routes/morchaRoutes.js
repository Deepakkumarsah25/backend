import express from "express";
import upload from "../middlewar/upload.js"; 
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
router.get("/morcha", renderMorcha);
router.get("/morcha/edit/:id", renderEditMorcha);
router.post("/morcha/add", upload.single("image"), addMorcha);
router.post("/morcha/update/:id", upload.single("image"), updateMorcha);
router.get("/morcha/delete/:id", deleteMorcha);

/* ===========================
   App API Routes
=========================== */
router.get("/api/morcha", getAllMorcha);
router.get("/api/morcha/:id", getMorchaById);

export default router;