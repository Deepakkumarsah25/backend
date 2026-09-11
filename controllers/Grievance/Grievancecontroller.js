import Grievance, { GRIEVANCE_CATEGORIES, GRIEVANCE_STATUSES } from "../../models/Grievance/Grievance.js";

/*=======================================================
 * SHARED HELPERS
 *======================================================*/

// Formats a DD/MM/YYYY string the same way the old frontend mock did
// (new Date().toLocaleDateString("en-GB")).
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatGrievance = (doc) => ({
  id: doc.grievanceId,
  title: doc.title,
  category: doc.category,
  status: doc.status,
  date: formatDate(doc.createdAt),
  desc: doc.description,
});

// Generates a unique G-XXXX id, retrying on the rare collision with the
// unique index on grievanceId.
const generateGrievanceId = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `G-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await Grievance.exists({ grievanceId: candidate });
    if (!exists) return candidate;
  }
  // Extremely unlikely fallback — timestamp suffix guarantees uniqueness.
  return `G-${Date.now().toString().slice(-6)}`;
};

/*=======================================================
 * MOBILE APP ENDPOINTS (mounted at /api/grievances)
 *======================================================*/

/*******************************************************
 * FILE A GRIEVANCE
 * POST /api/grievances
 *******************************************************/
export const createGrievance = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please fill in both the title and description.",
      });
    }

    if (!GRIEVANCE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid category.",
      });
    }

    const grievanceId = await generateGrievanceId();

    const grievance = await Grievance.create({
      grievanceId,
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category,
    });

    return res.status(201).json({
      success: true,
      message: "Grievance submitted.",
      data: formatGrievance(grievance),
    });
  } catch (err) {
    console.error("createGrievance error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

/*******************************************************
 * MY GRIEVANCES — all grievances filed by the logged-in user
 * GET /api/grievances/my
 *******************************************************/
export const getMyGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: grievances.map(formatGrievance),
    });
  } catch (err) {
    console.error("getMyGrievances error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*******************************************************
 * SINGLE GRIEVANCE — by its human-readable grievanceId
 * (scoped to the logged-in user, not a public lookup)
 * GET /api/grievances/:grievanceId
 *******************************************************/
export const getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findOne({
      grievanceId: req.params.grievanceId,
      user: req.user._id,
    });

    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found." });
    }

    return res.json({ success: true, data: formatGrievance(grievance) });
  } catch (err) {
    console.error("getGrievanceById error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*=======================================================
 * ADMIN PANEL ENDPOINTS (mounted at /grievances)
 *======================================================*/

/*******************************************************
 * RENDER PAGE
 * GET /grievances
 *******************************************************/
export const renderGrievancesPage = async (req, res) => {
  try {
    const grievances = await Grievance.find({})
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .limit(20);

    const total = await Grievance.countDocuments({});

    res.render("grievance/grievances", {
      pageTitle: "Grievance Management",
      grievances,
      total,
    });
  } catch (err) {
    console.error("renderGrievancesPage error:", err);
    res.status(500).send("Something went wrong.");
  }
};

/*******************************************************
 * PAGINATED / FILTERED DATA (used by the table's fetch calls)
 * GET /grievances/data
 *******************************************************/
export const getGrievancesData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { category, status, search } = req.query;

    const filter = {};
    if (category && GRIEVANCE_CATEGORIES.includes(category)) filter.category = category;
    if (status && GRIEVANCE_STATUSES.includes(status)) filter.status = status;

    if (search?.trim()) {
      const User = (await import("../../models/User.js")).default;
      const regex = new RegExp(search.trim(), "i");
      const matchingUsers = await User.find({ $or: [{ name: regex }, { phone: regex }] }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);
      filter.$or = [{ title: regex }, { grievanceId: regex }, { user: { $in: userIds } }];
    }

    const total = await Grievance.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const grievances = await Grievance.find(filter)
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: grievances,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    console.error("getGrievancesData error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*******************************************************
 * SINGLE GRIEVANCE (admin view — any user's, by Mongo _id)
 * GET /grievances/:id
 *******************************************************/
export const getGrievanceDetail = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id).populate("user", "name phone email");

    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found." });
    }

    return res.json({ success: true, data: grievance });
  } catch (err) {
    console.error("getGrievanceDetail error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*******************************************************
 * UPDATE STATUS
 * PATCH /grievances/:id/status
 *******************************************************/
export const updateGrievanceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!GRIEVANCE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found." });
    }

    return res.json({ success: true, message: "Status updated.", data: grievance });
  } catch (err) {
    console.error("updateGrievanceStatus error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/*******************************************************
 * DELETE
 * DELETE /grievances/:id
 *******************************************************/
export const deleteGrievance = async (req, res) => {
  try {
    const grievance = await Grievance.findByIdAndDelete(req.params.id);

    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found." });
    }

    return res.json({ success: true, message: "Grievance deleted." });
  } catch (err) {
    console.error("deleteGrievance error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};