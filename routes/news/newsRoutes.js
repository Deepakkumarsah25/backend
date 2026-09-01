import express from "express";

import newsUpload from "../../middlewar/newsUpload.js";

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
  getNewsByIdApi,
  getRelatedNewsApi,
} from "../../controllers/news/newsController.js";

const router = express.Router();

/* =====================================================
   ADMIN
===================================================== */

router.get(
  "/news",
  newsPage
);

router.get(
  "/news/add",
  addNewsPage
);

router.post(
  "/news/add",
  newsUpload.fields([
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
  editNewsPage
);

router.post(
  "/news/edit/:id",
  newsUpload.fields([
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
  deleteNews
);

router.get(
  "/news/status/:id",
  toggleNewsStatus
);

router.get(
  "/news/featured/:id",
  toggleNewsFeatured
);

router.post(
  "/news/order/:id",
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
  "/api/news/:id",
  getNewsByIdApi
);

router.get(
  "/api/news/related/:id",
  getRelatedNewsApi
);

export default router;