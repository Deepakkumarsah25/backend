import express from "express";

import {
  getMediaVersions,
} from "../../controllers/mediaversion/MediaVersion.js";

const router = express.Router();

router.get("/media/versions", getMediaVersions);

export default router;