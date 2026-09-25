import multer from "multer";
import { boundedMemoryStorage } from "./upload.js";

const newsUpload = multer({
  storage: boundedMemoryStorage,

  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 22,
    fields: 80,
    parts: 102,
  },

  fileFilter: (req, file, cb) => {
    const allowedImages = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    const allowedVideos = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/mov",
    ];

    if (
      allowedImages.includes(file.mimetype) ||
      allowedVideos.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, PNG, WEBP, MP4, WEBM and MOV files are allowed"
        )
      );
    }
  },
});

export default newsUpload;
