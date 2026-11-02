import express from "express";

import { diskMediaFields } from "../../middlewar/diskMediaUpload.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

import {
  newsPage,
  addNewsPage,
  addNews,
  editNewsPage,
  editNews,
  deleteNews,
  toggleNewsStatus,
  toggleNewsFeatured,
  updateNewsOrder,
  getNewsApi,
  getNewsVersion,
  getNewsByIdApi,
  getRelatedNewsApi,
} from "../../controllers/news/newsController.js";

const router = express.Router();

/* =====================================================
   ADMIN
===================================================== */

router.get(
  "/news",
  requireAdmin,
  newsPage
);

router.get(
  "/news/add",
  requireAdmin,
  addNewsPage
);

router.post(
  "/news/add",
  requireAdmin,
  diskMediaFields([
    {
      name: "coverImage",
      maxCount: 1,
    },
    {
      name: "images",
      maxCount: 20,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  addNews
);

router.get(
  "/news/edit/:id",
  requireAdmin,
  editNewsPage
);

router.post(
  "/news/edit/:id",
  requireAdmin,
  diskMediaFields([
    {
      name: "coverImage",
      maxCount: 1,
    },
    {
      name: "images",
      maxCount: 20,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  editNews
);

router.get(
  "/news/delete/:id",
  requireAdmin,
  deleteNews
);

router.get(
  "/news/status/:id",
  requireAdmin,
  toggleNewsStatus
);

router.get(
  "/news/featured/:id",
  requireAdmin,
  toggleNewsFeatured
);

router.post(
  "/news/order/:id",
  requireAdmin,
  updateNewsOrder
);

/* =====================================================
   MOBILE API
===================================================== */

router.get(
  "/api/news",
  getNewsApi
);

router.get(
  "/api/news/version",
  getNewsVersion
);

router.get(
  "/api/news/related/:id",
  getRelatedNewsApi
);

router.get(
  "/api/news/:id",
  getNewsByIdApi
);

export default router;
