
import multer from "multer";

/*
  Cloudinary uploads need a Buffer (req.file.buffer), not a disk path.
  memoryStorage keeps the file in RAM only — nothing is written to
  the local filesystem, and uploadToCloudinary(req.file.buffer)
  works directly.
*/
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",

      "video/mp4",
      "video/webm",
      "video/mov",
      "video/quicktime",
      "video/x-msvideo",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image and video files are allowed."
        )
      );
    }
  },
});

export default upload;