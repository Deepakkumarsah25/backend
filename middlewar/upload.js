
import multer from "multer";
import { hasAllowedFileSignature, isAllowedImageDimensions } from "./fileSignatures.js";

/*
  Cloudinary uploads need a Buffer (req.file.buffer), not a disk path.
  memoryStorage keeps the file in RAM only — nothing is written to
  the local filesystem, and uploadToCloudinary(req.file.buffer)
  works directly.
*/
export const MEMORY_UPLOAD_POLICY = Object.freeze({
  maxFileSize: 10 * 1024 * 1024,
  maxTotalFileSize: 25 * 1024 * 1024,
  maxConcurrentRequests: 2,
  maxFiles: 22,
});
const { maxFileSize: MAX_FILE_SIZE, maxTotalFileSize: MAX_TOTAL_FILE_SIZE, maxConcurrentRequests: MAX_CONCURRENT_MEMORY_UPLOADS } = MEMORY_UPLOAD_POLICY;
let activeMemoryUploads = 0;

export const boundedMemoryStorage = {
  _handleFile(req, file, callback) {
    if (!req.__memoryUploadSlot) {
      if (activeMemoryUploads >= MAX_CONCURRENT_MEMORY_UPLOADS) {
        return callback(new multer.MulterError("LIMIT_FILE_SIZE", file.fieldname));
      }
      activeMemoryUploads += 1;
      req.__memoryUploadSlot = true;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        activeMemoryUploads = Math.max(0, activeMemoryUploads - 1);
      };
      req.once("aborted", release);
      req.res?.once("finish", release);
      req.res?.once("close", release);
    }
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
      if (!isAllowedImageDimensions(buffer, file.mimetype)) return fail(new Error("Image dimensions exceed the allowed limits or could not be verified."));
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
    files: MEMORY_UPLOAD_POLICY.maxFiles,
    fields: 40,
    parts: 62,
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
