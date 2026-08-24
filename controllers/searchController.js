import Video from "../models/videogallery.js";
import Album from "../models/Album.js";
import MediaGallery from "../models/MediaGallery.js";
import VipLive from "../models/viplive.js";

/* ===========================================
   Escape regex metacharacters — ReDoS protection
=========================================== */
const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ===========================================
   Mappers — normalize each model to one shape
=========================================== */
const mediaMapper = (type) => (d) => ({
  id: d._id,
  type,
  title: d.title,
  description: "",
  thumbnail: d.image,
  createdAt: d.date,
});

const albumMapper = (d) => ({
  id: d._id,
  type: "gallery",
  title: d.title,
  description: d.description,
  thumbnail: d.cover,
  createdAt: d.createdAt,
});

const videoMapper = (d) => ({
  id: d._id,
  type: "videos",
  title: d.title,
  description: d.description,
  thumbnail: d.thumbnail,
  createdAt: d.createdAt,
});

const liveMapper = (d) => ({
  id: d._id,
  type: "live",
  title: d.title,
  description: d.description,
  thumbnail: d.thumbnail,
  isLive: d.isLive,
  createdAt: d.createdAt,
});

/* ===========================================
   Type Config
=========================================== */
const TYPE_CONFIG = {
  news: {
    model: MediaGallery,
    filter: { category: "newspaper" },
    textFields: ["title"],
    hasPublished: true,
    mapper: mediaMapper("news"),
  },
  pressrelease: {
    model: MediaGallery,
    filter: { category: "pressrelease" },
    textFields: ["title"],
    hasPublished: true,
    mapper: mediaMapper("pressrelease"),
  },
  infographics: {
    model: MediaGallery,
    filter: { category: "infographics" },
    textFields: ["title"],
    hasPublished: true,
    mapper: mediaMapper("infographics"),
  },
  gallery: {
    model: Album,
    filter: {},
    textFields: ["title", "description"],
    hasPublished: true,
    mapper: albumMapper,
  },
  videos: {
    model: Video,
    filter: {},
    textFields: ["title", "description"],
    hasPublished: true,
    mapper: videoMapper,
  },
  live: {
    model: VipLive,
    filter: {},
    textFields: ["title", "description"],
    hasPublished: false,
    mapper: liveMapper,
  },
};

const buildFilter = (config, regex) => {
  const orConditions = config.textFields.map((f) => ({ [f]: regex }));
  const searchFilter = { ...config.filter, $or: orConditions };
  if (config.hasPublished) searchFilter.isPublished = true;
  return searchFilter;
};

/* ===========================================
   Limits — hard caps
=========================================== */
const MAX_QUERY_LENGTH = 100;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30; // hard cap, chahe user kuch bhi bheje
const PREVIEW_LIMIT_PER_TYPE = 5;

/* ===========================================
   GET /api/search?q=&type=&page=&limit=
=========================================== */
export const searchAll = async (req, res) => {
  try {
    const { q = "", type = "all", page = 1, limit = DEFAULT_LIMIT } = req.query;

    const trimmedQuery = q.trim();

    if (!trimmedQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query 'q' is required.",
      });
    }

    // Query length cap
    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Query too long. Max ${MAX_QUERY_LENGTH} characters allowed.`,
      });
    }

    // Escape before building regex — ReDoS protection
    const safeQuery = escapeRegex(trimmedQuery);
    const regex = new RegExp(safeQuery, "i");

    const pageNum = Math.max(parseInt(page) || 1, 1);

    // Limit — hard capped, user chahe kitna bhi bheje max MAX_LIMIT hi milega
    const requestedLimit = parseInt(limit) || DEFAULT_LIMIT;
    const limitNum = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    // ---- Single type: full pagination ----
    if (type !== "all") {
      const config = TYPE_CONFIG[type];

      if (!config) {
        return res.status(400).json({
          success: false,
          message: "Invalid or unsupported type.",
        });
      }

      const searchFilter = buildFilter(config, regex);

      const [items, total] = await Promise.all([
        config.model
          .find(searchFilter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        config.model.countDocuments(searchFilter),
      ]);

      return res.status(200).json({
        success: true,
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: pageNum * limitNum < total,
        data: items.map(config.mapper),
      });
    }

    // ---- type=all: fixed small preview, no deep pagination ----
    const previewTypes = Object.keys(TYPE_CONFIG);

    const grouped = await Promise.all(
      previewTypes.map(async (t) => {
        const config = TYPE_CONFIG[t];
        const searchFilter = buildFilter(config, regex);
        const items = await config.model
          .find(searchFilter)
          .sort({ createdAt: -1 })
          .limit(PREVIEW_LIMIT_PER_TYPE);
        return items.map(config.mapper);
      })
    );

    const combined = grouped
      .flat()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      page: 1,
      hasMore: false,
      data: combined,
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};