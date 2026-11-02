import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { hasAllowedFileSignature, isAllowedImageDimensions } from "./fileSignatures.js";

export const DISK_MEDIA_UPLOAD_POLICY = Object.freeze({
  maxFileSize: 100 * 1024 * 1024,
  maxTotalFileSize: 150 * 1024 * 1024,
  maxConcurrentRequests: 2,
  maxFiles: 22,
});
const { maxFileSize: MAX_FILE_SIZE, maxTotalFileSize: MAX_TOTAL_FILE_SIZE, maxConcurrentRequests: MAX_CONCURRENT_DISK_UPLOADS, maxFiles: MAX_FILES } = DISK_MEDIA_UPLOAD_POLICY;
const TEMP_DIR = path.join(os.tmpdir(), "vip-party-media");
let activeDiskUploads = 0;
const mediaTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime", "video/mov"]);

const cleanAbandonedTempFiles = async () => {
  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const entry of await fs.promises.readdir(TEMP_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".upload")) continue;
      const target = path.join(TEMP_DIR, entry.name);
      const info = await fs.promises.stat(target).catch(() => null);
      if (info && info.mtimeMs < cutoff) await fs.promises.rm(target, { force: true }).catch(() => {});
    }
  } catch {}
};
void cleanAbandonedTempFiles();
const cleanupTimer = setInterval(() => { void cleanAbandonedTempFiles(); }, 60 * 60 * 1000);
cleanupTimer.unref?.();

const storage = {
  _handleFile(req, file, callback) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    const destination = path.join(TEMP_DIR, `${crypto.randomUUID()}.upload`);
    const output = fs.createWriteStream(destination, { flags: "wx" });
    let size = 0;
    let finished = false;
    const fail = (error) => {
      if (finished) return;
      finished = true;
      output.destroy();
      file.stream.destroy();
      fs.rm(destination, { force: true }, () => callback(error));
    };
    file.stream.on("data", (chunk) => {
      size += chunk.length;
      req.uploadedDiskBytes = (req.uploadedDiskBytes || 0) + chunk.length;
      if (size > MAX_FILE_SIZE || req.uploadedDiskBytes > MAX_TOTAL_FILE_SIZE) {
        fail(new multer.MulterError("LIMIT_FILE_SIZE", file.fieldname));
      }
    });
    file.stream.once("error", fail);
    output.once("error", fail);
    output.once("finish", () => {
      if (finished) return;
      finished = true;
      callback(null, { destination: TEMP_DIR, filename: path.basename(destination), path: destination, size });
    });
    file.stream.pipe(output);
  },
  _removeFile(req, file, callback) {
    fs.rm(file.path, { force: true }, callback);
  },
};

const parser = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES, fields: 40, parts: 62 },
  fileFilter(req, file, callback) {
    if (!mediaTypes.has(file.mimetype)) return callback(new Error("Unsupported media type."));
    callback(null, true);
  },
});

const validateSignatures = async (files) => {
  for (const file of files) {
    const handle = await fs.promises.open(file.path, "r");
    try {
      const header = Buffer.alloc(1024 * 1024);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      const sample = header.subarray(0, bytesRead);
      if (!hasAllowedFileSignature(sample, file.mimetype)) {
        throw new Error("Uploaded file content does not match its declared type.");
      }
      if (!isAllowedImageDimensions(sample, file.mimetype)) throw new Error("Image dimensions exceed the allowed limits or could not be verified.");
    } finally {
      await handle.close();
    }
  }
};

const cleanup = (req) => {
  const files = (Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat()).filter((item) => item?.path);
  for (const file of files) fs.rm(file.path, { force: true }, () => {});
};

export const diskMediaArray = (field, maxCount) => (req, res, next) => {
  if (activeDiskUploads >= MAX_CONCURRENT_DISK_UPLOADS) return res.status(429).send("Media upload capacity is busy. Please retry shortly.");
  activeDiskUploads += 1;
  let released = false;
  const release = () => { if (!released) { released = true; activeDiskUploads = Math.max(0, activeDiskUploads - 1); } };
  req.once("aborted", release);
  res.once("finish", release);
  res.once("close", release);
  parser.array(field, maxCount)(req, res, async (error) => {
    if (error) { cleanup(req); release(); return next(error); }
    try {
      await validateSignatures(req.files || []);
    } catch (validationError) {
      cleanup(req);
      release();
      return next(validationError);
    }
    res.once("finish", () => cleanup(req));
    res.once("close", () => cleanup(req));
    return next();
  });
};

export const diskMediaFields = (fields) => (req, res, next) => {
  if (activeDiskUploads >= MAX_CONCURRENT_DISK_UPLOADS) return res.status(429).send("Media upload capacity is busy. Please retry shortly.");
  activeDiskUploads += 1;
  let released = false;
  const release = () => { if (!released) { released = true; activeDiskUploads = Math.max(0, activeDiskUploads - 1); } };
  req.once("aborted", release);
  res.once("finish", release);
  res.once("close", release);
  parser.fields(fields)(req, res, async (error) => {
    if (error) { cleanup(req); release(); return next(error); }
    const files = Object.values(req.files || {}).flat();
    try {
      await validateSignatures(files);
    } catch (validationError) {
      cleanup(req);
      release();
      return next(validationError);
    }
    res.once("finish", () => cleanup(req));
    res.once("close", () => cleanup(req));
    return next();
  });
};
