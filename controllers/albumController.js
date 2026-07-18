import mongoose from "mongoose";
import Album from "../models/Album.js";

/* ===========================================
   Get All Albums
=========================================== */

export const getAlbums = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { isPublished: true };
    if (category && category !== "All") {
      filter.category = category;
    }

    const albums = await Album.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: albums.length,
      data: albums,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ===========================================
   Get Single Album
=========================================== */

export const getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid album id",
      });
    }

    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found.",
      });
    }

    album.views += 1;
    await album.save();

    return res.status(200).json({
      success: true,
      data: album,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ===========================================
   Get Related Albums
=========================================== */

export const getRelatedAlbums = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid album id",
      });
    }

    const currentAlbum = await Album.findById(id);

    if (!currentAlbum) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const relatedAlbums = await Album.find({
      _id: { $ne: currentAlbum._id },
      category: currentAlbum.category,
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .limit(3);

    return res.status(200).json({
      success: true,
      count: relatedAlbums.length,
      data: relatedAlbums,
    });
  } catch (error) {
    console.error("RELATED ALBUM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Create Album
=========================================== */

export const createAlbum = async (req, res) => {
  try {
    const {
      title,
      description,
      cover,
      photos,
      category,
      location,
      date,
      isPublished,
    } = req.body;

    if (!title || !cover) {
      return res.status(400).json({
        success: false,
        message: "Title and cover image are required.",
      });
    }

    const album = await Album.create({
      title,
      description,
      cover,
      photos,
      category,
      location,
      date,
      views: 0,
      isPublished: isPublished ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Album created successfully.",
      data: album,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Update Album
=========================================== */

export const updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      cover,
      photos,
      category,
      location,
      date,
      isPublished,
    } = req.body;

    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found.",
      });
    }

    album.title = title ?? album.title;
    album.description = description ?? album.description;
    album.cover = cover ?? album.cover;
    album.photos = photos ?? album.photos;
    album.category = category ?? album.category;
    album.location = location ?? album.location;
    album.date = date ?? album.date;

    if (typeof isPublished === "boolean") {
      album.isPublished = isPublished;
    }

    await album.save();

    return res.status(200).json({
      success: true,
      message: "Album updated successfully.",
      data: album,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================================
   Delete Album
=========================================== */

export const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found.",
      });
    }

    await Album.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Album deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};