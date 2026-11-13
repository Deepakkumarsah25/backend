import express from "express";
import { deleteInspirationLeader, listInspirationLeaders, saveInspirationLeader } from "../controllers/inspirationController.js";
import { requireAdmin } from "../middlewar/requireAdmin.js";
import upload from "../middlewar/upload.js";

const router = express.Router();
router.get("/", requireAdmin, listInspirationLeaders);
router.post("/:id/save", requireAdmin, upload.single("image"), saveInspirationLeader);
router.post("/:id/delete", requireAdmin, deleteInspirationLeader);

export default router;
