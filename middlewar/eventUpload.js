import multer from "multer";
import path from "path";
import fs from "fs";
import { hasAllowedFileSignature, isAllowedImageDimensions } from "./fileSignatures.js";

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "events"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const originalExt = path.extname(file.originalname);
    const extByMime = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const ext = extByMime[file.mimetype] || ".img";
    const name = path
      .basename(file.originalname, originalExt)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    cb(
      null,
      `${Date.now()}-${Math.round(
        Math.random() * 100000
      )}-${name}${ext}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      ),
      false
    );
  }
};

const eventUploadParser = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
    fields: 40,
    parts: 52,
  },
});

let activeEventUploads = 0;
const eventUpload = {
  array(fieldName, maxCount) {
    const parse = eventUploadParser.array(fieldName, maxCount);
    return (req, res, next) => {
      if (activeEventUploads >= 2) return res.status(429).json({ success: false, message: "Event upload capacity is busy. Please retry shortly." });
      activeEventUploads += 1;
      let released = false;
      const release = () => { if (!released) { released = true; activeEventUploads = Math.max(0, activeEventUploads - 1); } };
      req.once("aborted", release);
      res.once("finish", release);
      res.once("close", release);
      parse(req, res, (error) => {
        if (error) release();
        next(error);
      });
    };
  },
};

export const validateEventUploads = async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  try {
    for (const file of files) {
      const handle = await fs.promises.open(file.path, "r");
      const header = Buffer.alloc(Math.min(file.size, 1024 * 1024));
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      await handle.close();
      const sample = header.subarray(0, bytesRead);
      if (!hasAllowedFileSignature(sample, file.mimetype) || !isAllowedImageDimensions(sample, file.mimetype)) {
        await Promise.all(files.map((uploaded) => fs.promises.unlink(uploaded.path).catch(() => {})));
        return res.status(400).json({ success: false, message: "Uploaded file content does not match an allowed image type." });
      }
    }
    return next();
  } catch (error) {
    await Promise.all(files.map((uploaded) => fs.promises.unlink(uploaded.path).catch(() => {})));
    return next(error);
  }
};

export default eventUpload;
