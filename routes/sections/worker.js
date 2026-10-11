import express from "express";
import upload from "../../middlewar/upload.js";
import Worker from "../../models/Worker.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

import {
  addWorker,
  getWorkers,
  deleteWorker,
} from "../../controllers/workerController.js";

const router = express.Router();

router.get("/member", getWorkers);

router.get("/workerlist", requireAdmin, async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });

    res.render("AddWorker/workerlist", {
      workers,
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading workers");
  }
});

router.post(
  "/worker/add",
  requireAdmin,
  upload.single("photo"),
  addWorker
);

router.get(
  "/worker/delete/:id",
  requireAdmin,
  deleteWorker
);

export default router;
