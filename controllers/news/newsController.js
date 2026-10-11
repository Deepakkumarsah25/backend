import News from "../../models/news/News.js";
import cloudinary from "../../config/cloudinary.js";

import {
  getMediaVersion,
  bumpMediaVersion,
} from "../../utils/mediaVersion.js";

/* =====================================================
   CLOUDINARY BUFFER UPLOAD
===================================================== */

const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};


/* =====================================================
   YOUTUBE ID EXTRACT
===================================================== */

const getYoutubeId = (url = "") => {
  if (!url) return "";

  const value = String(url).trim();

  const patterns = [
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/watch\?v=([^?&]+)/i,
    /youtube\.com\/embed\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
    /youtube\.com\/live\/([^?&/]+)/i,
    /youtube-nocookie\.com\/embed\/([^?&/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match && match[1]) {
      return match[1];
    }
  }

  return "";
};


/* =====================================================
   FILE HELPER
===================================================== */

const getFile = (files, fieldName) => {
  if (!files) {
    return null;
  }

  if (!Array.isArray(files)) {
    const field = files[fieldName];

    if (!field) {
      return null;
    }

    if (Array.isArray(field)) {
      return field[0] || null;
    }

    return field;
  }

  return (
    files.find(
      (file) =>
        file &&
        file.fieldname === fieldName
    ) || null
  );
};


/* =====================================================
   MULTIPLE FILE HELPER
===================================================== */

const getFiles = (files, fieldName) => {
  if (!files) {
    return [];
  }

  if (!Array.isArray(files)) {
    return files[fieldName] || [];
  }

  return files.filter(
    (file) =>
      file &&
      file.fieldname === fieldName
  );
};


/* =====================================================
   NEWS LIST PAGE
===================================================== */

export const newsPage = async (req, res) => {
  try {
    const news = await News.find()
      .sort({
        featured: -1,
        displayOrder: 1,
        createdAt: -1,
      });

    res.render("news/News", {
      news,
    });
  } catch (error) {
    console.log(
      "NEWS PAGE ERROR:",
      error
    );

    res.status(500).send(
      "Error Loading News"
    );
  }
};


/* =====================================================
   ADD NEWS PAGE
===================================================== */

export const addNewsPage = (req, res) => {
  try {
    res.render("news/addNews");
  } catch (error) {
    console.log(
      "ADD NEWS PAGE ERROR:",
      error
    );

    res.status(500).send(
      "Error Loading Add News Page"
    );
  }
};


/* =====================================================
   ADD NEWS
===================================================== */

export const addNews = async (req, res) => {
  try {
    console.log(
      "================================"
    );

    console.log(
      "NEWS UPLOAD STARTED"
    );

    console.log(
      "================================"
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "FILES:",
      req.files
    );

    const {
      title,
      description,
      content,
      category,
      date,
      location,
      author,
      videoType,
      youtubeUrl,
      active,
      featured,
      displayOrder,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).send(
        "News title is required"
      );
    }

    let coverImage = "";
    let coverImagePublicId = "";

    const images = [];

    let videoUrl = "";
    let videoPublicId = "";

    const coverFile = getFile(
      req.files,
      "coverImage"
    );

    if (coverFile) {
      const result =
        await uploadBuffer(
          coverFile.buffer,
          {
            folder:
              "VIPParty/News/Covers",
            resource_type:
              "image",
          }
        );

      coverImage =
        result.secure_url;

      coverImagePublicId =
        result.public_id;
    }

    const imageFiles =
      getFiles(
        req.files,
        "images"
      );

    for (const file of imageFiles) {
      const result =
        await uploadBuffer(
          file.buffer,
          {
            folder:
              "VIPParty/News/Images",
            resource_type:
              "image",
          }
        );

      images.push({
        url:
          result.secure_url,

        publicId:
          result.public_id,
      });
    }

    const videoFile =
      getFile(
        req.files,
        "video"
      );

    if (videoFile) {
      const result =
        await uploadBuffer(
          videoFile.buffer,
          {
            folder:
              "VIPParty/News/Videos",

            resource_type:
              "video",
          }
        );

      videoUrl =
        result.secure_url;

      videoPublicId =
        result.public_id;
    }

    let youtubeId = "";

    if (
      videoType === "youtube" &&
      youtubeUrl
    ) {
      youtubeId =
        getYoutubeId(
          youtubeUrl
        );

      if (!youtubeId) {
        return res.status(400).send(
          "Invalid YouTube URL"
        );
      }
    }

    let finalVideoType = "none";

    if (videoFile) {
      finalVideoType =
        "uploaded";
    } else if (youtubeId) {
      finalVideoType =
        "youtube";
    }

    const news =
      await News.create({
        title:
          title.trim(),

        description:
          description || "",

        content:
          content || "",

        category:
          category || "General",

        coverImage,

        coverImagePublicId,

        images,

        videoType:
          finalVideoType,

        youtubeUrl:
          finalVideoType === "youtube"
            ? youtubeUrl.trim()
            : "",

        youtubeId,

        videoUrl,

        videoPublicId,

        date:
          date
            ? new Date(date)
            : new Date(),

        location:
          location || "",

        author:
          author || "VIP Party",

        active:
          active === "on" ||
          active === "true",

        featured:
          featured === "on" ||
          featured === "true",

        displayOrder:
          Number(displayOrder) || 0,
      });

    await bumpMediaVersion(
      "news"
    );

    console.log(
      "NEWS CREATED:",
      news._id
    );

    res.redirect("/news");

  } catch (error) {
    console.log(
      "ADD NEWS ERROR:",
      error
    );

    res.status(500).send(
      error.message ||
        "Failed to add news"
    );
  }
};


/* =====================================================
   EDIT NEWS PAGE
===================================================== */

export const editNewsPage = async (
  req,
  res
) => {
  try {
    const news =
      await News.findById(
        req.params.id
      );

    if (!news) {
      return res
        .status(404)
        .send(
          "News Not Found"
        );
    }

    res.render(
      "news/editNews",
      {
        news,
      }
    );

  } catch (error) {
    console.log(
      "EDIT PAGE ERROR:",
      error
    );

    res.status(500).send(
      "Error Loading News"
    );
  }
};


/* =====================================================
   EDIT NEWS
===================================================== */

export const editNews = async (
  req,
  res
) => {
  try {
    const news =
      await News.findById(
        req.params.id
      );

    if (!news) {
      return res
        .status(404)
        .send(
          "News Not Found"
        );
    }

    const {
      title,
      description,
      content,
      category,
      date,
      location,
      author,
      videoType,
      youtubeUrl,
      active,
      featured,
      displayOrder,
    } = req.body;

    news.title =
      title?.trim() ||
      news.title;

    news.description =
      description || "";

    news.content =
      content || "";

    news.category =
      category || "General";

    if (date) {
      news.date =
        new Date(date);
    }

    news.location =
      location || "";

    news.author =
      author || "VIP Party";

    news.active =
      active === "on" ||
      active === "true";

    news.featured =
      featured === "on" ||
      featured === "true";

    news.displayOrder =
      Number(displayOrder) || 0;

    const coverFile =
      getFile(
        req.files,
        "coverImage"
      );

    if (coverFile) {
      if (
        news.coverImagePublicId
      ) {
        try {
          await cloudinary.uploader.destroy(
            news.coverImagePublicId
          );
        } catch (error) {
          console.log(
            "OLD COVER DELETE ERROR:",
            error
          );
        }
      }

      const result =
        await uploadBuffer(
          coverFile.buffer,
          {
            folder:
              "VIPParty/News/Covers",

            resource_type:
              "image",
          }
        );

      news.coverImage =
        result.secure_url;

      news.coverImagePublicId =
        result.public_id;
    }

    const imageFiles =
      getFiles(
        req.files,
        "images"
      );

    for (
      const file of imageFiles
    ) {
      const result =
        await uploadBuffer(
          file.buffer,
          {
            folder:
              "VIPParty/News/Images",

            resource_type:
              "image",
          }
        );

      news.images.push({
        url:
          result.secure_url,

        publicId:
          result.public_id,
      });
    }

    const videoFile =
      getFile(
        req.files,
        "video"
      );

    if (videoFile) {
      if (
        news.videoPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(
            news.videoPublicId,
            {
              resource_type:
                "video",
            }
          );
        } catch (error) {
          console.log(
            "OLD VIDEO DELETE ERROR:",
            error
          );
        }
      }

      const result =
        await uploadBuffer(
          videoFile.buffer,
          {
            folder:
              "VIPParty/News/Videos",

            resource_type:
              "video",
          }
        );

      news.videoType =
        "uploaded";

      news.videoUrl =
        result.secure_url;

      news.videoPublicId =
        result.public_id;

      news.youtubeUrl =
        "";

      news.youtubeId =
        "";

    } else if (
      videoType === "youtube" &&
      youtubeUrl
    ) {
      const newYoutubeId =
        getYoutubeId(
          youtubeUrl
        );

      if (!newYoutubeId) {
        return res.status(400).send(
          "Invalid YouTube URL"
        );
      }

      if (
        news.videoPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(
            news.videoPublicId,
            {
              resource_type:
                "video",
            }
          );
        } catch (error) {
          console.log(
            "OLD VIDEO DELETE ERROR:",
            error
          );
        }
      }

      news.videoType =
        "youtube";

      news.youtubeUrl =
        youtubeUrl.trim();

      news.youtubeId =
        newYoutubeId;

      news.videoUrl =
        "";

      news.videoPublicId =
        "";

    } else if (
      videoType === "none"
    ) {
      if (
        news.videoPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(
            news.videoPublicId,
            {
              resource_type:
                "video",
            }
          );
        } catch (error) {
          console.log(
            "VIDEO DELETE ERROR:",
            error
          );
        }
      }

      news.videoType =
        "none";

      news.youtubeUrl =
        "";

      news.youtubeId =
        "";

      news.videoUrl =
        "";

      news.videoPublicId =
        "";
    }

    await news.save();

    await bumpMediaVersion(
      "news"
    );

    console.log(
      "NEWS UPDATED:",
      news._id
    );

    res.redirect(
      "/news"
    );

  } catch (error) {
    console.log(
      "EDIT NEWS ERROR:",
      error
    );

    res.status(500).send(
      error.message ||
        "Failed to update news"
    );
  }
};
/* =====================================================
   DELETE NEWS
===================================================== */

export const deleteNews = async (
  req,
  res
) => {
  try {
    const news =
      await News.findById(
        req.params.id
      );

    if (!news) {
      return res
        .status(404)
        .send(
          "News Not Found"
        );
    }

    if (
      news.coverImagePublicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          news.coverImagePublicId
        );
      } catch (error) {
        console.log(
          "COVER DELETE ERROR:",
          error
        );
      }
    }

    for (
      const image of news.images || []
    ) {
      if (image.publicId) {
        try {
          await cloudinary.uploader.destroy(
            image.publicId
          );
        } catch (error) {
          console.log(
            "IMAGE DELETE ERROR:",
            error
          );
        }
      }
    }

    if (
      news.videoPublicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          news.videoPublicId,
          {
            resource_type:
              "video",
          }
        );
      } catch (error) {
        console.log(
          "VIDEO DELETE ERROR:",
          error
        );
      }
    }

    await News.findByIdAndDelete(
      req.params.id
    );

    await bumpMediaVersion(
      "news"
    );

    res.redirect(
      "/news"
    );

  } catch (error) {
    console.log(
      "DELETE NEWS ERROR:",
      error
    );

    res.status(500).send(
      error.message
    );
  }
};


/* =====================================================
   TOGGLE ACTIVE STATUS
===================================================== */

export const toggleNewsStatus = async (
  req,
  res
) => {
  try {
    const news =
      await News.findById(
        req.params.id
      );

    if (!news) {
      return res
        .status(404)
        .send(
          "News Not Found"
        );
    }

    news.active =
      !news.active;

    await news.save();

    await bumpMediaVersion(
      "news"
    );

    res.redirect(
      "/news"
    );

  } catch (error) {
    console.log(
      "STATUS ERROR:",
      error
    );

    res.status(500).send(
      error.message
    );
  }
};


/* =====================================================
   TOGGLE FEATURED
===================================================== */

export const toggleNewsFeatured = async (
  req,
  res
) => {
  try {
    const news =
      await News.findById(
        req.params.id
      );

    if (!news) {
      return res
        .status(404)
        .send(
          "News Not Found"
        );
    }

    news.featured =
      !news.featured;

    await news.save();

    await bumpMediaVersion(
      "news"
    );

    res.redirect(
      "/news"
    );

  } catch (error) {
    console.log(
      "FEATURED ERROR:",
      error
    );

    res.status(500).send(
      error.message
    );
  }
};


/* =====================================================
   UPDATE DISPLAY ORDER
===================================================== */

export const updateNewsOrder = async (
  req,
  res
) => {
  try {
    const {
      displayOrder,
    } = req.body;

    await News.findByIdAndUpdate(
      req.params.id,
      {
        displayOrder:
          Number(
            displayOrder
          ) || 0,
      }
    );

    await bumpMediaVersion(
      "news"
    );

    res.redirect(
      "/news"
    );

  } catch (error) {
    console.log(
      "ORDER ERROR:",
      error
    );

    res.status(500).send(
      error.message
    );
  }
};
/* =====================================================
   MOBILE API - ALL NEWS
===================================================== */

export const getNewsApi = async (
  req,
  res
) => {
  try {
    const page = Math.max(
      parseInt(
        req.query.page
      ) || 1,
      1
    );

    const limit = Math.min(
      parseInt(
        req.query.limit
      ) || 5,
      30
    );

    const skip =
      (page - 1) * limit;

    const filter = {
      active: true,
    };

    const [
      news,
      total,
    ] = await Promise.all([
      News.find(filter)
        .sort({
          featured: -1,
          displayOrder: 1,
          date: -1,
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      News.countDocuments(
        filter
      ),
    ]);

    const hasMore =
      skip + news.length <
      total;

    return res.json({
      success: true,
      count: news.length,
      total,
      page,
      limit,
      hasMore,
      data: news,
    });

  } catch (error) {
    console.log(
      "GET NEWS API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load news",
    });
  }
};


/* =====================================================
   MOBILE API - NEWS VERSION
===================================================== */

export const getNewsVersion = async (
  req,
  res
) => {
  try {
    const version =
      await getMediaVersion(
        "news"
      );

    return res.json({
      success: true,
      version:
        String(version),
    });

  } catch (error) {
    console.log(
      "GET NEWS VERSION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load news version",
    });
  }
};


/* =====================================================
   MOBILE API - SINGLE NEWS
===================================================== */

export const getNewsByIdApi = async (
  req,
  res
) => {
  try {
    const news =
      await News.findOne({
        _id:
          req.params.id,

        active:
          true,
      }).lean();

    if (!news) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "News Not Found",
        });
    }

    await News.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          views: 1,
        },
      }
    );

    res.json({
      success: true,
      data:
        news,
    });

  } catch (error) {
    console.log(
      "GET NEWS BY ID ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load news",
    });
  }
};


/* =====================================================
   MOBILE API - RELATED NEWS
===================================================== */

export const getRelatedNewsApi = async (
  req,
  res
) => {
  try {
    const current =
      await News.findById(
        req.params.id
      );

    if (!current) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "News Not Found",
        });
    }

    const related =
      await News.find({
        active:
          true,

        _id: {
          $ne:
            current._id,
        },

        category:
          current.category,
      })
        .sort({
          featured:
            -1,

          date:
            -1,
        })
        .limit(6)
        .lean();

    res.json({
      success: true,

      count:
        related.length,

      data:
        related,
    });

  } catch (error) {
    console.log(
      "RELATED NEWS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load related news",
    });
  }
};