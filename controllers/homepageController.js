import mongoose from "mongoose";
import Video from "../models/videogallery.js";
import News from "../models/news/News.js";
import { bumpMediaVersion } from "../utils/mediaVersion.js";

const extractVideoId = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|v\/|u\/\w\/|embed\/|live\/|shorts\/)|youtu\.be\/)([^#&?]*).*/;
  const match = raw.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
};

/**
 * Public API for mobile app Latest Updates slider
 * GET /api/homepage/latest-updates?page=1&limit=5
 */
export const getLatestUpdatesApi = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    // 1. Fetch all highlighted videos and news
    const [highlightedVideos, highlightedNews] = await Promise.all([
      Video.find({ isPublished: true, isHighlighted: true })
        .sort({ highlightedAt: -1, createdAt: -1 })
        .lean(),
      News.find({ active: true, isHighlighted: true, youtubeId: { $exists: true, $ne: "" } })
        .sort({ highlightedAt: -1, createdAt: -1 })
        .lean(),
    ]);

    const formattedHighlighted = [
      ...highlightedVideos.map((v) => ({
        _id: String(v._id),
        title: v.title,
        description: v.description || "",
        youtubeId: v.youtubeId,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
        category: v.category || "Video",
        date: v.date || v.createdAt,
        isHighlighted: true,
        source: "video",
        createdAt: v.createdAt,
      })),
      ...highlightedNews.map((n) => ({
        _id: String(n._id),
        title: n.title,
        description: n.description || "",
        youtubeId: n.youtubeId,
        thumbnail: n.coverImage || `https://img.youtube.com/vi/${n.youtubeId}/hqdefault.jpg`,
        category: n.category || "News",
        date: n.date || n.createdAt,
        isHighlighted: true,
        source: "news",
        createdAt: n.createdAt,
      })),
    ];

    const highlightedIds = new Set(formattedHighlighted.map((item) => item._id));

    // 2. Fetch regular published videos (fallback / pagination fill)
    const [recentVideos, recentNews] = await Promise.all([
      Video.find({ isPublished: true, _id: { $nin: Array.from(highlightedIds).map(id => new mongoose.Types.ObjectId(id)) } })
        .sort({ createdAt: -1, _id: -1 })
        .limit(50)
        .lean(),
      News.find({ active: true, youtubeId: { $exists: true, $ne: "" }, _id: { $nin: Array.from(highlightedIds).map(id => new mongoose.Types.ObjectId(id)) } })
        .sort({ createdAt: -1, _id: -1 })
        .limit(50)
        .lean(),
    ]);

    const formattedRecent = [
      ...recentVideos.map((v) => ({
        _id: String(v._id),
        title: v.title,
        description: v.description || "",
        youtubeId: v.youtubeId,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
        category: v.category || "Video",
        date: v.date || v.createdAt,
        isHighlighted: false,
        source: "video",
        createdAt: v.createdAt,
      })),
      ...recentNews.map((n) => ({
        _id: String(n._id),
        title: n.title,
        description: n.description || "",
        youtubeId: n.youtubeId,
        thumbnail: n.coverImage || `https://img.youtube.com/vi/${n.youtubeId}/hqdefault.jpg`,
        category: n.category || "News",
        date: n.date || n.createdAt,
        isHighlighted: false,
        source: "news",
        createdAt: n.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Highlighted first, followed by recent
    const allUpdates = [...formattedHighlighted, ...formattedRecent];
    const total = allUpdates.length;
    const paginatedItems = allUpdates.slice(skip, skip + limit);
    const hasMore = skip + paginatedItems.length < total;

    return res.status(200).json({
      success: true,
      count: paginatedItems.length,
      total,
      page,
      limit,
      hasMore,
      data: paginatedItems,
    });
  } catch (error) {
    console.error("GET LATEST UPDATES API ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Admin view for Home Page Management -> Latest Updates
 * GET /admin/homepage/latest-updates
 */
export const renderHomepageLatestUpdatesAdmin = async (req, res) => {
  try {
    const [videos, news] = await Promise.all([
      Video.find().sort({ createdAt: -1 }).limit(100).lean(),
      News.find({ youtubeId: { $exists: true, $ne: "" } }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const allMedia = [
      ...videos.map((v) => ({
        _id: String(v._id),
        title: v.title,
        description: v.description || "",
        youtubeId: v.youtubeId,
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
        category: v.category || "Video",
        date: v.date || v.createdAt,
        isHighlighted: Boolean(v.isHighlighted),
        source: "video",
        createdAt: v.createdAt,
      })),
      ...news.map((n) => ({
        _id: String(n._id),
        title: n.title,
        description: n.description || "",
        youtubeId: n.youtubeId,
        thumbnail: n.coverImage || `https://img.youtube.com/vi/${n.youtubeId}/hqdefault.jpg`,
        category: n.category || "News",
        date: n.date || n.createdAt,
        isHighlighted: Boolean(n.isHighlighted),
        source: "news",
        createdAt: n.createdAt,
      })),
    ].sort((a, b) => {
      // Highlighted first, then latest
      if (a.isHighlighted && !b.isHighlighted) return -1;
      if (!a.isHighlighted && b.isHighlighted) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const highlightedCount = allMedia.filter((m) => m.isHighlighted).length;

    res.render("homepage/latestUpdates", {
      mediaItems: allMedia,
      highlightedCount,
      query: req.query || {},
    });
  } catch (error) {
    console.error("RENDER HOMEPAGE ADMIN ERROR:", error);
    res.status(500).send("Error loading Homepage Management");
  }
};

/**
 * Toggle highlight status of a video or news item
 * POST /admin/homepage/latest-updates/toggle/:type/:id
 */
export const toggleHighlightStatus = async (req, res) => {
  const { type, id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }

  try {
    let updated;
    const now = new Date();

    if (type === "video") {
      const video = await Video.findById(id);
      if (!video) return res.status(404).json({ success: false, message: "Video not found" });
      video.isHighlighted = !video.isHighlighted;
      video.highlightedAt = video.isHighlighted ? now : null;
      updated = await video.save();
    } else if (type === "news") {
      const newsItem = await News.findById(id);
      if (!newsItem) return res.status(404).json({ success: false, message: "News not found" });
      newsItem.isHighlighted = !newsItem.isHighlighted;
      newsItem.highlightedAt = newsItem.isHighlighted ? now : null;
      updated = await newsItem.save();
    } else {
      return res.status(400).json({ success: false, message: "Invalid media type" });
    }

    await bumpMediaVersion("videos");

    return res.json({
      success: true,
      isHighlighted: updated.isHighlighted,
      message: updated.isHighlighted ? "Item highlighted for App Latest Updates" : "Highlight removed",
    });
  } catch (error) {
    console.error("TOGGLE HIGHLIGHT ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not update highlight status" });
  }
};

/**
 * Add a new video and optionally highlight it immediately
 * POST /admin/homepage/latest-updates/create-video
 */
export const createAndHighlightVideo = async (req, res) => {
  try {
    const { title, description, youtubeUrl, category, isHighlighted } = req.body;
    if (!title || !youtubeUrl) {
      return res.status(400).json({ success: false, message: "Title and YouTube URL are required." });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ success: false, message: "Invalid YouTube URL." });
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const shouldHighlight = isHighlighted === "true" || isHighlighted === true || isHighlighted === "on";

    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      youtubeId: videoId,
      thumbnail,
      category: category || "Events",
      isPublished: true,
      isHighlighted: shouldHighlight,
      highlightedAt: shouldHighlight ? new Date() : null,
    });

    await bumpMediaVersion("videos");

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      return res.status(201).json({ success: true, video });
    }
    return res.redirect("/admin/homepage/latest-updates");
  } catch (error) {
    console.error("CREATE HIGHLIGHTED VIDEO ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create video" });
  }
};
