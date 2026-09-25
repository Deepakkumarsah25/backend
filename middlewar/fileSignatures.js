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
