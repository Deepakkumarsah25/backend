
import multer from "multer";
import { hasAllowedFileSignature } from "./fileSignatures.js";

/*
  Cloudinary uploads need a Buffer (req.file.buffer), not a disk path.
  memoryStorage keeps the file in RAM only — nothing is written to
  the local filesystem, and uploadToCloudinary(req.file.buffer)
  works directly.
*/
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = 150 * 1024 * 1024;

export const boundedMemoryStorage = {
  _handleFile(req, file, callback) {
    const chunks = [];
    let size = 0;
    let completed = false;
    const fail = (error) => {
      if (completed) return;
      completed = true;
      chunks.length = 0;
      callback(error);
    };

    file.stream.on("data", (chunk) => {
      if (completed) return;
      size += chunk.length;
      req.uploadedFileBytes = (req.uploadedFileBytes || 0) + chunk.length;
      if (size > MAX_FILE_SIZE || req.uploadedFileBytes > MAX_TOTAL_FILE_SIZE) {
        file.stream.resume();
        return fail(new multer.MulterError("LIMIT_FILE_SIZE", file.fieldname));
      }
      chunks.push(chunk);
    });
    file.stream.on("error", fail);
    file.stream.on("end", () => {
      if (completed) return;
      const buffer = Buffer.concat(chunks);
      if (!hasAllowedFileSignature(buffer, file.mimetype)) {
        return fail(new Error("Uploaded file content does not match its declared type."));
      }
      completed = true;
      callback(null, { buffer, size });
    });
  },

  _removeFile(req, file, callback) {
    delete file.buffer;
    callback(null);
  },
};

const upload = multer({
  storage: boundedMemoryStorage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 22,
    fields: 80,
    parts: 102,
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
