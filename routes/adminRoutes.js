import express from "express";
import upload from "../middlewar/upload.js";

import {
  loginAdmin,
  createAdmin,
  dashboard,
  addBanner,
  deleteBanner,
} from "../controllers/adminController.js";


import {
  getAllJoinApplications,
  getJoinApplicationById,
  updateJoinStatus,
  deleteJoinApplication,
  renderJoinAdminPage,
} from "../controllers/joinController.js";


import Video from "../models/videogallery.js";
import Album from "../models/Album.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/create-admin", createAdmin);

router.post("/login", loginAdmin);

router.get("/dashboard", dashboard);

router.get("/vip-live", (req, res) => {
  res.render("viplive");
});

router.get("/video_gallery", async (req, res) => {
  try {
    const videos = await Video.find().sort({
      createdAt: -1,
    });

    res.render("video_gallery", {
      videos,
    });
  } catch (error) {
    console.log(error);

    res.render("video_gallery", {
      videos: [],
    });
  }
});

router.get("/album", async (req, res) => {
  try {
    const albums = await Album.find().sort({
      createdAt: -1,
    });

    res.render("album", {
      albums,
    });
  } catch (error) {
    console.log(error);

    res.render("album", {
      albums: [],
    });
  }
});


/* Join Member */

router.get("/joinmember", renderJoinAdminPage);
router.get("/joinmember/data", getAllJoinApplications);
router.get("/joinmember/:id", getJoinApplicationById);
router.patch("/joinmember/:id/status", updateJoinStatus);
router.delete("/joinmember/:id", deleteJoinApplication);

/* Banner */

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