import Organisation from "../models/organisation.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// ===========================
// Helper: Upload buffer to Cloudinary
// ===========================
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ===========================
// Show All Organisation
// ===========================
export const showOrganisation = async (req, res) => {
  try {
    const organisation = await Organisation.find().sort({
      createdAt: -1,
    });

    res.render("Organisation/list", {
      organisation,
    });
  } catch (error) {
    console.log("Show Organisation Error:", error);

    res.status(500).send("Something went wrong");
  }
};

// ===========================
// Add Page
// ===========================
export const showAddOrganisation = (req, res) => {
  res.render("Organisation/add");
};

// ===========================
// Add Organisation
// ===========================
export const addOrganisation = async (req, res) => {
  try {
    const {
      category,
      name,
      designation,
      address,
      phone,
      email,
      fax,
    } = req.body;

    let imageUrl = "";

    // Upload image
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url;
    }

    await Organisation.create({
      category,
      name,
      designation,
      address,
      phone,
      email,
      fax,
      imageUrl,
    });

    res.redirect("/organisation");
  } catch (error) {
    console.log("Add Organisation Error:", error);
    console.log("Request Body:", req.body);

    res.status(500).send("Organisation Add Failed");
  }
};

// ===========================
// Edit Page
// ===========================
export const editOrganisation = async (req, res) => {
  try {
    const organisation = await Organisation.findById(req.params.id);

    if (!organisation) {
      return res.send("Organisation Member Not Found");
    }

    res.render("Organisation/edit", {
      organisation,
    });
  } catch (error) {
    console.log("Edit Organisation Error:", error);

    res.status(500).send("Something went wrong");
  }
};

// ===========================
// Update Organisation
// ===========================
export const updateOrganisation = async (req, res) => {
  try {
    const {
      category,
      name,
      designation,
      address,
      phone,
      email,
      fax,
    } = req.body;

    const organisation = await Organisation.findById(req.params.id);

    if (!organisation) {
      return res.send("Organisation Member Not Found");
    }

    // Keep old image if no new image is uploaded
    let imageUrl = organisation.imageUrl;

    // Upload new image
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url;
    }

    await Organisation.findByIdAndUpdate(
      req.params.id,
      {
        category,
        name,
        designation,
        address,
        phone,
        email,
        fax,
        imageUrl,
      },
      {
        new: true,
      }
    );

    res.redirect("/organisation");
  } catch (error) {
    console.log("Update Organisation Error:", error);
    console.log("Request Body:", req.body);

    res.status(500).send("Organisation Update Failed");
  }
};

// ===========================
// Delete Organisation
// ===========================
export const deleteOrganisation = async (req, res) => {
  try {
    const organisation = await Organisation.findByIdAndDelete(
      req.params.id
    );

    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: "Organisation Member Not Found",
      });
    }

    res.json({
      success: true,
      message: "Organisation Deleted Successfully",
    });
  } catch (error) {
    console.log("Delete Organisation Error:", error);

    res.status(500).json({
      success: false,
      message: "Delete Failed",
    });
  }
};

// ===========================
// Get All Organisation
// ===========================
export const getOrganisation = async (req, res) => {
  try {
    const filter = {};

    if (req.params.category) {
      filter.category = req.params.category;
    }

    const members = await Organisation.find(filter).sort({
      createdAt: 1,
    });

    res.json({
      success: true,
      members,
    });
  } catch (error) {
    console.log("Get Organisation Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// ===========================
// Single Organisation Details
// ===========================
export const getOrganisationDetails = async (req, res) => {
  try {
    const organisation = await Organisation.findById(
      req.params.id
    );

    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: "Organisation Member Not Found",
      });
    }

    res.json({
      success: true,
      organisation,
    });
  } catch (error) {
    console.log("Get Organisation Details Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};