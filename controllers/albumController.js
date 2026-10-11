
import mongoose from "mongoose";
import Album from "../models/Album.js";

import {
  getMediaVersion,
  bumpMediaVersion,
} from "../utils/mediaVersion.js";

/* ===========================================
   Get Albums Version
   Lightweight API for cache validation
=========================================== */

export const getAlbumsVersion = async (req, res) => {
  try {
    const version = await getMediaVersion("gallery");

    return res.status(200).json({
      success: true,
      version: String(version),
    });
  } catch (error) {
    console.error("ALBUM VERSION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ===========================================
   Get Albums
   Pagination + Category
=========================================== */

export const getAlbums = async (req, res) => {
  try {
    const {
      category,
      page = 1,
      limit = 10,
    } = req.query;

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const pageLimit = Math.min(
      Math.max(parseInt(limit, 10) || 10, 1),
      30
    );

    const filter = {
      isPublished: true,
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    const skip = (currentPage - 1) * pageLimit;

    const [albums, total] = await Promise.all([
      Album.find(filter)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .select(
          "_id title description cover category date createdAt photos"
        )
        .lean(),

      Album.countDocuments(filter),
    ]);

    const data = albums.map((album) => ({
      _id: album._id,
      title: album.title,
      description: album.description,
      cover: album.cover,
      category: album.category,
      date: album.date || album.createdAt,
      photoCount: Array.isArray(album.photos)
        ? album.photos.length
        : 0,
    }));

    const totalPages = Math.ceil(
      total / pageLimit
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
      hasMore: currentPage < totalPages,
      data,
    });
  } catch (error) {
    console.error("GET ALBUMS ERROR:", error);

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
    console.error("GET ALBUM ERROR:", error);

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
      .sort({
        createdAt: -1,
        _id: -1,
      })
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

    // Gallery cache invalidate
    await bumpMediaVersion("gallery");

    return res.status(201).json({
      success: true,
      message: "Album created successfully.",
      data: album,
    });
  } catch (error) {
    console.error("CREATE ALBUM ERROR:", error);

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

    album.title =
      title ?? album.title;

    album.description =
      description ?? album.description;

    album.cover =
      cover ?? album.cover;

    album.photos =
      photos ?? album.photos;

    album.category =
      category ?? album.category;

    album.location =
      location ?? album.location;

    album.date =
      date ?? album.date;

    if (typeof isPublished === "boolean") {
      album.isPublished = isPublished;
    }

    await album.save();

    // Gallery cache invalidate
    await bumpMediaVersion("gallery");

    return res.status(200).json({
      success: true,
      message: "Album updated successfully.",
      data: album,
    });
  } catch (error) {
    console.error("UPDATE ALBUM ERROR:", error);

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

    await Album.findByIdAndDelete(id);

    // Gallery cache invalidate
    await bumpMediaVersion("gallery");

    return res.status(200).json({
      success: true,
      message: "Album deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ALBUM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};