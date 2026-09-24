
import mongoose from "mongoose";

import Video from "../models/videogallery.js";

import {
  getMediaVersion,
  bumpMediaVersion,
} from "../utils/mediaVersion.js";

/* ===========================================
   Extract YouTube Video ID
=========================================== */

const extractVideoId = (url) => {
  if (!url) return null;

  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|v\/|u\/\w\/|embed\/|live\/|shorts\/)|youtu\.be\/)([^#&?]*).*/;

  const match = url.match(regExp);

  return match && match[1].length === 11
    ? match[1]
    : null;
};

/* ===========================================
   Get Videos Version
=========================================== */

export const getVideosVersion =
  async (req, res) => {
    try {
      const version =
        await getMediaVersion(
          "videos"
        );

      return res.status(200).json({
        success: true,
        version: String(version),
      });
    } catch (error) {
      console.error(
        "VIDEOS VERSION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };

/* ===========================================
   Get All Videos
=========================================== */

export const getVideos = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      parseInt(req.query.limit) || 5,
      30
    );

    const skip = (page - 1) * limit;

    const filter = {
      isPublished: true,
    };

    const [videos, total] =
      await Promise.all([
        Video.find(filter)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .skip(skip)
          .limit(limit),

        Video.countDocuments(filter),
      ]);

    const hasMore =
      skip + videos.length < total;

    return res.status(200).json({
      success: true,
      count: videos.length,
      total,
      page,
      limit,
      hasMore,
      data: videos,
    });
  } catch (error) {
    console.error(
      "GET VIDEOS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* ===========================================
   Get Single Video
=========================================== */

export const getVideoById =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid video id",
        });
      }

      const video =
        await Video.findById(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found.",
        });
      }

      video.views += 1;

      await video.save();

      return res.status(200).json({
        success: true,
        data: video,
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
   Get Related Videos
=========================================== */

export const getRelatedVideos =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid video id",
        });
      }

      const currentVideo =
        await Video.findById(id);

      if (!currentVideo) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      const relatedVideos =
        await Video.find({
          _id: {
            $ne: currentVideo._id,
          },
          isPublished: true,
        })
          .sort({
            createdAt: -1,
          })
          .limit(6);

      return res.status(200).json({
        success: true,
        count:
          relatedVideos.length,
        data: relatedVideos,
      });
    } catch (error) {
      console.error(
        "RELATED VIDEO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ===========================================
   Create Video
=========================================== */

export const createVideo =
  async (req, res) => {
    try {
      const {
        title,
        description,
        youtubeUrl,
        category,
        duration,
        isPublished,
      } = req.body;

      if (!title || !youtubeUrl) {
        return res.status(400).json({
          success: false,
          message:
            "Title and YouTube URL are required.",
        });
      }

      const videoId =
        extractVideoId(
          youtubeUrl
        );

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid YouTube URL.",
        });
      }

      const thumbnail =
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const video =
        await Video.create({
          title,
          description,
          youtubeUrl,
          youtubeId: videoId,
          thumbnail,
          category,
          duration,
          views: 0,
          isPublished:
            isPublished ?? true,
        });

      /*
       * Content changed
       */
      await bumpMediaVersion(
        "videos"
      );

      return res.status(201).json({
        success: true,
        message:
          "Video created successfully.",
        data: video,
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
   Update Video
=========================================== */

export const updateVideo =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        youtubeUrl,
        category,
        duration,
        isPublished,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid video id",
        });
      }

      const video =
        await Video.findById(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found.",
        });
      }

      let youtubeId =
        video.youtubeId;

      let thumbnail =
        video.thumbnail;

      if (
        youtubeUrl &&
        youtubeUrl !== video.youtubeUrl
      ) {
        youtubeId =
          extractVideoId(
            youtubeUrl
          );

        if (!youtubeId) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid YouTube URL.",
          });
        }

        thumbnail =
          `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      }

      video.title =
        title ?? video.title;

      video.description =
        description ??
        video.description;

      video.youtubeUrl =
        youtubeUrl ??
        video.youtubeUrl;

      video.youtubeId =
        youtubeId;

      video.thumbnail =
        thumbnail;

      video.category =
        category ??
        video.category;

      video.duration =
        duration ??
        video.duration;

      if (
        typeof isPublished ===
        "boolean"
      ) {
        video.isPublished =
          isPublished;
      }

      await video.save();

      /*
       * Content changed
       */
      await bumpMediaVersion(
        "videos"
      );

      return res.status(200).json({
        success: true,
        message:
          "Video updated successfully.",
        data: video,
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
   Delete Video
=========================================== */

export const deleteVideo =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid video id",
        });
      }

      const video =
        await Video.findById(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found.",
        });
      }

      await Video.findByIdAndDelete(
        id
      );

      /*
       * Content changed
       */
      await bumpMediaVersion(
        "videos"
      );

      return res.status(200).json({
        success: true,
        message:
          "Video deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  };