
import express from "express";
import {
  getBanners,
  getContact,
  getCmsPage,
} from "../controllers/apiController.js";
const router = express.Router();

router.get("/banners", getBanners);
router.get("/contact", getContact);

router.get(
  "/cms/:pageKey",
  getCmsPage
);

export default router;