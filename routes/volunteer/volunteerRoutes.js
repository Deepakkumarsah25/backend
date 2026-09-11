import express from "express";
import upload from "../../middlewar/upload.js";
import { protect } from "../../middlewar/firebaseAuth.js";
import {
  joinVolunteer,
  getMyVolunteer,
  getVolunteerPrefill,
} from "../../controllers/volunteer/volunteerController.js";

const router = express.Router();

router.get("/prefill", protect, getVolunteerPrefill);
router.post("/join", protect, upload.single("photo"), joinVolunteer);
router.get("/me", protect, getMyVolunteer);

export default router;