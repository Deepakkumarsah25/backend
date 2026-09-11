import MorchaWing from "../models/MorchaWing.js";
import { uploadToCloudinary } from "../config/cloudinary.js"; // apna actual path check kar lena

/* ===========================
   Admin Page
=========================== */

export const renderMorcha = async (req, res) => {
  try {
    const wings = await MorchaWing.find().sort({ order: 1, createdAt: -1 });

    res.render("morcha", {
      wings,
      editWing: null,
    });
  } catch (error) {
    console.log("RENDER MORCHA ERROR:", error.message);

    res.render("morcha", {
      wings: [],
      editWing: null,
    });
  }
};

export const renderEditMorcha = async (req, res) => {
  try {
    const { id } = req.params;

    const wings = await MorchaWing.find().sort({ order: 1, createdAt: -1 });
    const editWing = await MorchaWing.findById(id);

    if (!editWing) {
      return res.redirect("/morcha");
    }

    res.render("morcha", {
      wings,
      editWing,
    });
  } catch (error) {
    console.log("RENDER EDIT MORCHA ERROR:", error.message);
    res.redirect("/morcha");
  }
};

/* ===========================
   App API
=========================== */

export const getAllMorcha = async (req, res) => {
  try {
    const wings = await MorchaWing.find({ isPublished: true }).sort({
      order: 1,
      createdAt: -1,
    });

    res.json({
      success: true,
      data: wings,
    });
  } catch (error) {
    console.log("GET ALL MORCHA ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wings",
    });
  }
};

export const getMorchaById = async (req, res) => {
  try {
    const wing = await MorchaWing.findOne({
      _id: req.params.id,
      isPublished: true,
    });

    if (!wing) {
      return res.status(404).json({
        success: false,
        message: "Wing not found",
      });
    }

    res.json({
      success: true,
      data: wing,
    });
  } catch (error) {
    console.log("GET MORCHA BY ID ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wing",
    });
  }
};

/* ===========================
   Add
=========================== */

export const addMorcha = async (req, res) => {
  try {
    const {
      key,
      titleHi,
      titleEn,
      head,
      contact,
      established,
      description,
      order,
      isPublished,
    } = req.body;

    let imageUrl = "";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "morcha");
      imageUrl = result.secure_url;
    }

    await MorchaWing.create({
      key,
      titleHi,
      titleEn,
      head,
      contact,
      established,
      description,
      image: imageUrl,
      order: order || 0,
      isPublished: isPublished ? true : false,
    });

    res.redirect("/morcha");
  } catch (error) {
    console.log("ADD MORCHA ERROR:", error.message);

    res.status(500).send(`Add Failed: ${error.message}`);
  }
};

/* ===========================
   Update
=========================== */

export const updateMorcha = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      key,
      titleHi,
      titleEn,
      head,
      contact,
      established,
      description,
      order,
      isPublished,
    } = req.body;

    const wing = await MorchaWing.findById(id);

    if (!wing) {
      return res.status(404).send("Wing not found");
    }

    wing.key = key;
    wing.titleHi = titleHi;
    wing.titleEn = titleEn;
    wing.head = head;
    wing.contact = contact;
    wing.established = established;
    wing.description = description;
    wing.order = order || 0;
    wing.isPublished = isPublished ? true : false;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "morcha");
      wing.image = result.secure_url;
    }

    await wing.save();

    res.redirect("/morcha");
  } catch (error) {
    console.log("UPDATE MORCHA ERROR:", error.message);

    res.status(500).send(`Update Failed: ${error.message}`);
  }
};

/* ===========================
   Delete
=========================== */

export const deleteMorcha = async (req, res) => {
  try {
    await MorchaWing.findByIdAndDelete(req.params.id);

    res.redirect("/morcha");
  } catch (error) {
    console.log("DELETE MORCHA ERROR:", error.message);

    res.status(500).send(`Delete Failed: ${error.message}`);
  }
};