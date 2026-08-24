import express from "express";

import {
  getAlbums,
  getAlbumById,
  getRelatedAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from "../controllers/albumController.js";

const router = express.Router();

// get all albums
router.get("/albums", getAlbums);

// IMPORTANT: related route upar rakho
router.get("/albums/related/:id", getRelatedAlbums);

// single album
router.get("/albums/:id", getAlbumById);

// create
router.post("/albums", createAlbum);

// update
router.put("/albums/:id", updateAlbum);

// delete
router.delete("/albums/:id", deleteAlbum);

export default router;