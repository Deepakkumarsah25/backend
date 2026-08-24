import MediaGallery from "../models/MediaGallery.js";
import cloudinary from "../config/cloudinary.js";

/* ===========================
   Admin Page
=========================== */

export const renderMediaGallery = async (req, res) => {
  try {
    const media = await MediaGallery.find().sort({
      date: -1,
    });

    res.render("mediagallery", {
      media,
    });
  } catch (error) {
    console.log(error);

    res.render("mediagallery", {
      media: [],
    });
  }
};

/* ===========================
   App API
=========================== */

export const getMediaByCategory = async (req, res) => {
  try {
    console.log("Category =", req.params.category);

    const media = await MediaGallery.find({
      category: req.params.category,
      isPublished: true,
    });

    console.log(media);

    res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.log(error);
  }
};
/* ===========================
   Add
=========================== */

export const addMedia = async (req, res) => {
  try {
    const {
      title,
      category,
      date,
      isPublished,
    } = req.body;

    const result = await cloudinary.uploader.upload(
      req.file.path
    );

    await MediaGallery.create({
      title,
      category,
      image: result.secure_url,
      date: date || Date.now(),
      isPublished: isPublished ? true : false,
    });

    res.redirect("/mediagallery");
  } catch (error) {
    console.log(error);

    res.status(500).send("Upload Failed");
  }
};

/* ===========================
   Update
=========================== */

export const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      category,
      date,
      isPublished,
    } = req.body;

    const media = await MediaGallery.findById(id);

    if (!media) {
      return res.status(404).send("Media not found");
    }

    media.title = title;
    media.category = category;
    media.date = date;
    media.isPublished = isPublished ? true : false;

    if (req.file) {
      const result = await cloudinary.uploader.upload(
        req.file.path
      );

      media.image = result.secure_url;
    }

    await media.save();

    res.redirect("/mediagallery");
  } catch (error) {
    console.log(error);

    res.status(500).send("Update Failed");
  }
};

/* ===========================
   Delete
=========================== */

export const deleteMedia = async (req, res) => {
  try {
    await MediaGallery.findByIdAndDelete(
      req.params.id
    );

    res.redirect("/mediagallery");
  } catch (error) {
    console.log(error);

    res.status(500).send("Delete Failed");
  }
};