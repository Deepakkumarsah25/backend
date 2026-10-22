import express from "express";
import {
  getBanners,
  getHeroBanners,
  getContact,
  getCmsPage,
} from "../controllers/apiController.js";
import { submitWebsiteFeedbackApi } from "../controllers/websiteFeedbackController.js";

const router = express.Router();

router.get("/banners", getBanners);
router.get("/hero-banners", getHeroBanners);
router.get("/contact", getContact);

router.get(
  "/cms/:pageKey",
  getCmsPage
);

// Website Contact / Feedback submission endpoints
router.post("/website-feedback", submitWebsiteFeedbackApi);
router.post("/contact", submitWebsiteFeedbackApi);

export default router;
