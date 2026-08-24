import Organisation from "../models/Organisation.js";
import cloudinary from "../config/cloudinary.js";

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
    console.log(error);
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

if (req.file) {
  const result = await cloudinary.uploader.upload(req.file.path);
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
    console.log(error);
    console.log(req.body);
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
    console.log(error);
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

    let imageUrl = organisation.imageUrl;

if (req.file) {
  const result = await cloudinary.uploader.upload(req.file.path);
  imageUrl = result.secure_url;
}

await Organisation.findByIdAndUpdate(req.params.id, {
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
    console.log(error);
    console.log(req.body);
    res.status(500).send("Organisation Update Failed");
  }
};

// ===========================
// Delete Organisation
// ===========================
export const deleteOrganisation = async (req, res) => {
  try {
    await Organisation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Organisation Deleted Successfully",
    });
  } catch (error) {
    console.log(error);

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
    console.log(error);

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
    const organisation = await Organisation.findById(req.params.id);

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
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};