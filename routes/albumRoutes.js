import express from "express";

import {
  getAlbums,
  getAlbumsVersion,
  getAlbumById,
  getRelatedAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from "../controllers/albumController.js";

const router = express.Router();

/* ===========================================
   Albums Version
=========================================== */

router.get(
  "/albums/version",
  getAlbumsVersion
);

/* ===========================================
   Albums
=========================================== */

router.get(
  "/albums",
  getAlbums
);

/* IMPORTANT: related route upar rakho */

router.get(
  "/albums/related/:id",
  getRelatedAlbums
);

/* Single album */

router.get(
  "/albums/:id",
  getAlbumById
);

/* Create */

router.post(
  "/albums",
  createAlbum
);

/* Update */

router.put(
  "/albums/:id",
  updateAlbum
);

/* Delete */

router.delete(
  "/albums/:id",
  deleteAlbum
);

export default router;