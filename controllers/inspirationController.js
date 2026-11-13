import mongoose from "mongoose";
import InspirationLeader from "../models/InspirationLeader.js";
import { logAdminActivity } from "../services/activityService.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const safeReturn = (message) => `/admin/website/inspiration?${message}`;

export const listInspirationLeaders = async (req, res) => {
  try {
    const leaders = await InspirationLeader.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
    res.render("website/inspiration", { leaders, activeNav: "website-inspiration", query: req.query });
  } catch (error) {
    console.error("Error loading inspiration leaders:", error.message);
    res.status(500).send("Unable to load inspiration content.");
  }
};

export const saveInspirationLeader = async (req, res) => {
  const { id } = req.params;
  const { name, role, description, imageUrl, icon, displayOrder, isPublished } = req.body;
  let uploadedImageUrl = String(imageUrl || "").trim();
  if (req.file?.buffer) {
    try {
      const uploaded = await uploadToCloudinary(req.file.buffer, "vip-party/inspiration");
      uploadedImageUrl = uploaded.secure_url;
    } catch (error) {
      console.error("Inspiration Cloudinary upload failed:", error.message);
      return res.status(502).send("Photo upload failed. Please try again.");
    }
  }
  const values = {
    name: String(name || "").trim(),
    role: String(role || "").trim(),
    description: String(description || "").trim(),
    imageUrl: uploadedImageUrl,
    icon: String(icon || "fa-star").trim(),
    displayOrder: Number(displayOrder || 0),
    isPublished: isPublished === "on" || isPublished === "true",
  };

  if (!values.name || !values.imageUrl || values.name.length > 140 || values.role.length > 180 ||
      values.description.length > 500 || values.imageUrl.length > 1000 ||
      !Number.isInteger(values.displayOrder) || values.displayOrder < 0 || values.displayOrder > 10000 ||
      !/^https:\/\//i.test(values.imageUrl) && !/^\/(?!\/)/.test(values.imageUrl)) {
    return res.status(400).send("Please provide valid inspiration details and an image URL.");
  }

  try {
    let leader;
    if (id === "new") {
      leader = await InspirationLeader.create(values);
    } else {
      if (!mongoose.isValidObjectId(id)) return res.sendStatus(400);
      leader = await InspirationLeader.findByIdAndUpdate(id, values, { new: true, runValidators: true });
      if (!leader) return res.sendStatus(404);
    }
    await logAdminActivity(req, {
      section: "Website Inspiration",
      action: `${id === "new" ? "Created" : "Updated"} ${leader.name}`,
      details: `Inspiration entry ${id === "new" ? "created" : "updated"}`,
      actionType: id === "new" ? "create" : "update",
    });
    res.redirect(safeReturn("saved=1"));
  } catch (error) {
    console.error("Error saving inspiration leader:", error.message);
    res.status(500).send("Unable to save inspiration entry.");
  }
};

export const deleteInspirationLeader = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(400);
  try {
    await InspirationLeader.findByIdAndDelete(req.params.id);
    res.redirect(safeReturn("deleted=1"));
  } catch (error) {
    console.error("Error deleting inspiration leader:", error.message);
    res.status(500).send("Unable to delete inspiration entry.");
  }
};
