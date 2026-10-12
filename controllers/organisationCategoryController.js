import Category from "../models/OrganisationCategory.js";

// TODO: organisationcontroller.js ke sabse upar jo member model import hai, wahi line yahan paste karo.
// Agar model ka naam alag hai to neeche Organisation ki jagah wahi naam use karo.

import Organisation from "../models/organisation.js";

// App ke liye: sirf active categories
export const getPublicCategories = async (req, res) => {
  try {
    const data = await Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin ke liye: sab categories (inactive bhi)
export const getAllCategories = async (req, res) => {
  try {
    const data = await Category.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { title, title_hi, order, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title required hai" });
    }

    const exists = await Category.findOne({ title: title.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Ye category pehle se hai" });
    }

    const data = await Category.create({
      title: title.trim(),
      title_hi,
      order,
      isActive,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Category nahi mili" });
    }

    const { title, title_hi, order, isActive } = req.body;
    const oldTitle = cat.title;

    if (title !== undefined) cat.title = title.trim();
    if (title_hi !== undefined) cat.title_hi = title_hi;
    if (order !== undefined) cat.order = order;
    if (isActive !== undefined) cat.isActive = isActive;
    await cat.save();

    // Title badla to purane members ki category bhi update karo
    if (title && title.trim() !== oldTitle) {
      await Organisation.updateMany(
        { category: oldTitle },
        { $set: { category: cat.title } }
      );
    }

    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Category nahi mili" });
    }

    const count = await Organisation.countDocuments({ category: cat.title });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Is category me ${count} members hain. Pehle unhe hatao ya category ko inactive karo.`,
      });
    }

    await cat.deleteOne();
    res.json({ success: true, message: "Category delete ho gayi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ===== ADMIN PANEL (EJS) =====

export const showCategoryList = async (req, res) => {
  const categories = await Category.find().sort({ order: 1, createdAt: 1 });
  res.render("OrganisationCategory/list", { categories });
};

export const showAddCategory = (req, res) => {
  res.render("OrganisationCategory/add", { error: null });
};

export const addCategoryPage = async (req, res) => {
  try {
    const { title, title_hi, order } = req.body;
    if (!title || !title.trim()) {
      return res.render("OrganisationCategory/add", { error: "Category name zaroori hai" });
    }
    const exists = await Category.findOne({ title: title.trim() });
    if (exists) {
      return res.render("OrganisationCategory/add", { error: "Ye category pehle se hai" });
    }
    await Category.create({
      title: title.trim(),
      title_hi: (title_hi || "").trim(),
      order: Number(order) || 0,
      isActive: true,
    });
    res.redirect("/organisation/categories/manage");
  } catch (err) {
    res.render("OrganisationCategory/add", { error: err.message });
  }
};

export const showEditCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.redirect("/organisation/categories/manage");
  res.render("OrganisationCategory/edit", { category, error: null });
};

export const updateCategoryPage = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.redirect("/organisation/categories/manage");

    const oldTitle = cat.title;
    const newTitle = (req.body.title || "").trim();
    if (!newTitle) {
      return res.render("OrganisationCategory/edit", { category: cat, error: "Category name zaroori hai" });
    }

    cat.title = newTitle;
    cat.title_hi = (req.body.title_hi || "").trim();
    cat.order = Number(req.body.order) || 0;
    cat.isActive = req.body.isActive === "on";
    await cat.save();

    if (newTitle !== oldTitle) {
      await Organisation.updateMany({ category: oldTitle }, { $set: { category: newTitle } });
    }
    res.redirect("/organisation/categories/manage");
  } catch (err) {
    const category = await Category.findById(req.params.id);
    res.render("OrganisationCategory/edit", { category, error: err.message });
  }
};

export const deleteCategoryPage = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: "Category nahi mili" });

    const count = await Organisation.countDocuments({ category: cat.title });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Is category me ${count} members hain. Pehle unhe hatao ya category ko inactive karo.`,
      });
    }
    await cat.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};