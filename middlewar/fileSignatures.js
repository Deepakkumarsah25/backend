const hasBytes = (buffer, offset, bytes) =>
  buffer.length >= offset + bytes.length &&
  bytes.every((byte, index) => buffer[offset + index] === byte);

const ascii = (value) => Buffer.from(value, "ascii");

export const hasAllowedFileSignature = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return hasBytes(buffer, 0, [0xff, 0xd8, 0xff]);
    case "image/png":
      return hasBytes(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return buffer.subarray(0, 6).equals(ascii("GIF87a")) || buffer.subarray(0, 6).equals(ascii("GIF89a"));
    case "image/webp":
      return buffer.subarray(0, 4).equals(ascii("RIFF")) && buffer.subarray(8, 12).equals(ascii("WEBP"));
    case "video/mp4":
    case "video/mov":
    case "video/quicktime":
      return buffer.subarray(4, 8).equals(ascii("ftyp"));
    case "video/webm":
      return hasBytes(buffer, 0, [0x1a, 0x45, 0xdf, 0xa3]);
    case "video/x-msvideo":
      return buffer.subarray(0, 4).equals(ascii("RIFF")) && buffer.subarray(8, 12).equals(ascii("AVI "));
    default:
      return false;
  }
};

export const getImageDimensions = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer)) return null;
  if (mimeType === "image/png" && buffer.length >= 24) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (mimeType === "image/gif" && buffer.length >= 10) return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  if (mimeType === "image/webp" && buffer.length >= 30) {
    const chunk = buffer.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (chunk === "VP8L" && buffer[20] === 0x2f && buffer.length >= 25) {
      return {
        width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
        height: 1 + ((buffer[22] & 0xc0) >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
      };
    }
    if (chunk === "VP8 " && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
  }
  if (["image/jpeg", "image/jpg"].includes(mimeType) && buffer.length >= 4) {
    const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 4 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      while (buffer[offset] === 0xff) offset += 1;
      const marker = buffer[offset++];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) break;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) break;
      if (startOfFrame.has(marker) && segmentLength >= 7) {
        return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += segmentLength;
    }
  }
  return null;
};

export const isAllowedImageDimensions = (buffer, mimeType, { maxDimension = 12_000, maxPixels = 100_000_000 } = {}) => {
  if (!mimeType?.startsWith("image/")) return true;
  const dimensions = getImageDimensions(buffer, mimeType);
  return Boolean(dimensions?.width && dimensions?.height && dimensions.width <= maxDimension && dimensions.height <= maxDimension && dimensions.width * dimensions.height <= maxPixels);
};
