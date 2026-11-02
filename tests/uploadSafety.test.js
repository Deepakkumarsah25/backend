import test from "node:test";
import assert from "node:assert/strict";
import { MEMORY_UPLOAD_POLICY } from "../middlewar/upload.js";
import { DISK_MEDIA_UPLOAD_POLICY } from "../middlewar/diskMediaUpload.js";
import { hasAllowedFileSignature, isAllowedImageDimensions } from "../middlewar/fileSignatures.js";

test("small buffered uploads and streamed media have explicit bounded policies", () => {
  assert.equal(MEMORY_UPLOAD_POLICY.maxFileSize, 10 * 1024 * 1024);
  assert.equal(MEMORY_UPLOAD_POLICY.maxTotalFileSize, 25 * 1024 * 1024);
  assert.equal(MEMORY_UPLOAD_POLICY.maxConcurrentRequests, 2);
  assert.equal(DISK_MEDIA_UPLOAD_POLICY.maxFileSize, 100 * 1024 * 1024);
  assert.equal(DISK_MEDIA_UPLOAD_POLICY.maxTotalFileSize, 150 * 1024 * 1024);
  assert.equal(DISK_MEDIA_UPLOAD_POLICY.maxConcurrentRequests, 2);
});

test("actual file signature checks reject MIME spoofing", () => {
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assert.equal(hasAllowedFileSignature(validPngHeader, "image/png"), true);
  assert.equal(hasAllowedFileSignature(validPngHeader, "image/jpeg"), false);
  assert.equal(hasAllowedFileSignature(Buffer.alloc(12), "image/png"), false);
});

test("image dimensions are bounded to prevent extreme image payloads", () => {
  const pngHeader = Buffer.alloc(24);
  pngHeader.writeUInt32BE(2400, 16);
  pngHeader.writeUInt32BE(1600, 20);
  assert.equal(isAllowedImageDimensions(pngHeader, "image/png"), true);
  pngHeader.writeUInt32BE(13_000, 16);
  pngHeader.writeUInt32BE(100, 20);
  assert.equal(isAllowedImageDimensions(pngHeader, "image/png"), false);
});
