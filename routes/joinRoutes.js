import express from "express";
import { protect } from "../middlewar/firebaseAuth.js";
import {
  createJoinApplication,
  getPrefillData,
} from "../controllers/joinController.js";

const router = express.Router();

/*
  Mounted in server.js as:
    app.use("/api/join", joinRoutes);

  So the final paths are:
    POST /api/join/apply
    GET  /api/join/prefill
*/

router.post("/apply", protect, createJoinApplication);
router.get("/prefill", protect, getPrefillData);

export default router;