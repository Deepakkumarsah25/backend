import express from "express";
import upload from "../middlewar/upload.js";

import {
  loginAdmin,
  createAdmin,
  dashboard,
  addBanner,
  deleteBanner,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/create-admin", createAdmin);

router.post("/login", loginAdmin);

router.get("/dashboard", dashboard);

router.post(
  "/banner/add",
  upload.array("banner", 20),
  addBanner
);

router.delete(
  "/banner/delete/:id",
  deleteBanner
);

export default router;