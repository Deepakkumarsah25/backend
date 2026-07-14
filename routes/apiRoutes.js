import express from "express";

import {
  getBanners,
} from "../controllers/apiController.js";

const router = express.Router();

router.get(
  "/banners",
  getBanners
);

export default router;