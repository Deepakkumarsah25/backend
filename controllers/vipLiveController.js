import VipLive from "../models/viplive.js";
import {
  getMediaVersion,
  bumpMediaVersion,
} from "../utils/mediaVersion.js";

const extractVideoId = (url) => {
  if (!url) return null;

  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|live\/|shorts\/)([^#&?]*).*/;

  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
};

// GET LIVE VERSION
export const getLiveVersion = async (req, res) => {
  try {
    const version = await getMediaVersion("live");

    return res.status(200).json({
      success: true,
      version,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// CREATE LIVE
export const createLive = async (req, res) => {
  try {
    const { title, description, youtubeUrl, isLive } = req.body;

    if (!title || !youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: "Title and YouTube URL are required.",
      });
    }

    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL.",
      });
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const live = await VipLive.create({
      title,
      description,
      youtubeUrl,
      videoId,
      thumbnail,
      isLive: isLive || false,
    });

    // Live data changed
    await bumpMediaVersion("live");

    return res.status(201).json({
      success: true,
      message: "Live stream created successfully.",
      data: live,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET ALL LIVE + HISTORY
export const getLive = async (req, res) => {
  try {
    const live = await VipLive.find({ isLive: true }).sort({
      createdAt: -1,
    });

    const history = await VipLive.find({ isLive: false }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      live,
      history,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET LIVE BY ID
export const getLiveById = async (req, res) => {
  try {
    const { id } = req.params;

    const live = await VipLive.findById(id);

    if (!live) {
      return res.status(404).json({
        success: false,
        message: "Live stream not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: live,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// UPDATE LIVE
export const updateLive = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      youtubeUrl,
      isLive,
    } = req.body;

    const live = await VipLive.findById(id);

    if (!live) {
      return res.status(404).json({
        success: false,
        message: "Live stream not found.",
      });
    }

    let videoId = live.videoId;
    let thumbnail = live.thumbnail;

    if (youtubeUrl && youtubeUrl !== live.youtubeUrl) {
      videoId = extractVideoId(youtubeUrl);

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: "Invalid YouTube URL.",
        });
      }

      thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    live.title = title ?? live.title;
    live.description = description ?? live.description;
    live.youtubeUrl = youtubeUrl ?? live.youtubeUrl;
    live.videoId = videoId;
    live.thumbnail = thumbnail;

    if (typeof isLive === "boolean") {
      live.isLive = isLive;
    }

    await live.save();

    // Live data changed
    await bumpMediaVersion("live");

    return res.status(200).json({
      success: true,
      message: "Live stream updated successfully.",
      data: live,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// DELETE LIVE
export const deleteLive = async (req, res) => {
  try {
    const { id } = req.params;

    const live = await VipLive.findById(id);

    if (!live) {
      return res.status(404).json({
        success: false,
        message: "Live stream not found.",
      });
    }

    await VipLive.findByIdAndDelete(id);

    // Live data changed
    await bumpMediaVersion("live");

    return res.status(200).json({
      success: true,
      message: "Live stream deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// TOGGLE LIVE STATUS
export const toggleLiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const live = await VipLive.findById(id);

    if (!live) {
      return res.status(404).json({
        success: false,
        message: "Live stream not found.",
      });
    }

    live.isLive = !live.isLive;

    await live.save();

    // Live data changed
    await bumpMediaVersion("live");

    return res.status(200).json({
      success: true,
      message: `Live stream ${
        live.isLive ? "started" : "stopped"
      } successfully.`,
      data: live,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};