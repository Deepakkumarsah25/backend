import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

console.log(
  "Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME
);

console.log(
  "API Key:",
  process.env.CLOUDINARY_API_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (buffer, folder = "members") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;