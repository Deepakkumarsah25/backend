import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Scroller from "../models/Scroller.js";

/* ================================
   Upload Images / Videos
================================ */

export const addScrollerMedia = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const savedMedia = [];

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith("video");

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "ScrollerMedia",
        resource_type: isVideo ? "video" : "image",
      });

      const media = await Scroller.create({
        type: isVideo ? "video" : "image",
        mediaUrl: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname,
        fileSize: file.size,
      });

      savedMedia.push(media);

      fs.unlinkSync(file.path);
    }

    res.redirect("/scroller");
  } catch (error) {
    console.log(error);

  return res.redirect("/scroller");
  }
};

/* ================================
   Get All Media
================================ */

export const scrollerPage = async (req, res) => {
  try {

    const media = await Scroller.find().sort({
      createdAt: -1,
    });

    res.render("updateScrollerSection/Scroller", {
      media,
    });

  } catch (error) {

    console.log(error);

    res.send("Error Loading Scroller");

  }
};

/* ================================
   React Native API
================================ */

export const getScrollerApi = async (req, res) => {
  try {
    const media = await Scroller.find({
      active: true,
    }).sort({
      displayOrder: 1,
    });

    res.json(media);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
    });
  }
};

/* ================================
   Delete Media
================================ */

export const deleteScrollerMedia = async (req, res) => {

  try {

    console.log("Delete ID:", req.params.id);

    const media = await Scroller.findById(req.params.id);

    console.log(media);

    if (!media) {
      return res.status(404).send("Media Not Found");
    }

    await cloudinary.uploader.destroy(
      media.publicId,
      {
        resource_type:
          media.type === "video"
            ? "video"
            : "image",
      }
    );

    await Scroller.findByIdAndDelete(req.params.id);

    res.redirect("/scroller");
  } catch (error) {
    console.log(error);

    res.status(500).send(error.message);
  }
};

/* ================================
   Change Status
================================ */

export const toggleScrollerStatus = async (req, res) => {
  try {
    const media = await Scroller.findById(req.params.id);

    if (!media) {
      return res.status(404).send("Media Not Found");
    }

    media.active = !media.active;

    await media.save();

    res.redirect("/scroller/list");
  } catch (error) {
    console.log(error);

    res.status(500).send(error.message);
  }
};

/* ================================
   Update Display Order
================================ */

export const updateDisplayOrder = async (req, res) => {
  try {
    const { displayOrder } = req.body;

    await Scroller.findByIdAndUpdate(
      req.params.id,
      {
        displayOrder,
      }
    );

    res.redirect("/scroller/list");
  } catch (error) {
    console.log(error);

    res.status(500).send(error.message);
  }
};