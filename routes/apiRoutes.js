
import express from "express";
import {
  getBanners,
  getHeroBanners,
  getContact,
  getCmsPage,
} from "../controllers/apiController.js";
const router = express.Router();

router.get("/banners", getBanners);
router.get("/hero-banners", getHeroBanners);
router.get("/contact", getContact);

router.get(
  "/cms/:pageKey",
  getCmsPage
);

export default router;