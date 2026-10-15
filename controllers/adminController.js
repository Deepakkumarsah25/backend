import Admin from "../models/Admin.js";
import Banner from "../models/Banner.js";
import cloudinary from "../config/cloudinary.js";
import {
  logAdminActivity,
  getLastTwoEditors,
  getRecentActivities,
  getLast10DaysActivities,
  getPaginatedActivities,
} from "../services/activityService.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("index", {
        error: "Please enter both email and password",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const admin = await Admin.findOne({
      email: cleanEmail,
    });

    if (!admin || admin.password !== password.trim()) {
      return res.render("index", {
        error: "Invalid Email or Password",
      });
    }

    // Update lastLogin & lastActive
    admin.lastLogin = new Date();
    admin.lastActive = new Date();
    await admin.save();

    req.session.admin = {
      _id: admin._id,
      email: admin.email,
      name: admin.name || "VIP Admin",
      role: admin.role || "Administrator",
    };

    // Log admin login activity
    await logAdminActivity(req, {
      section: "Admin Authentication",
      action: "Admin Logged In",
      details: `${admin.name || "Admin"} (${admin.email}) signed in to Admin Panel`,
      actionType: "login",
      sectionIcon: "fa-solid fa-right-to-bracket",
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.render("index", {
      error: "An error occurred during login. Please try again.",
    });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    if (req.session && req.session.admin) {
      const email = req.session.admin.email;
      await logAdminActivity(req, {
        section: "Admin Authentication",
        action: "Admin Logged Out",
        details: `${email} logged out`,
        actionType: "login",
        sectionIcon: "fa-solid fa-right-from-bracket",
      });
      req.session.destroy(() => {
        res.redirect("/");
      });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error("Logout error:", err);
    res.redirect("/");
  }
};

export const dashboard = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    const lastTwoEditors = await getLastTwoEditors();
    const recentActivities = await getRecentActivities(10);
    const allAdmins = await Admin.find().select("-password");

    res.render("dashboard", {
      banners,
      lastTwoEditors,
      recentActivities,
      allAdmins,
    });
  } catch (error) {
    console.error("Dashboard render error:", error);
    res.render("dashboard", {
      banners: [],
      lastTwoEditors: [],
      recentActivities: [],
      allAdmins: [],
    });
  }
};

export const quickUpdateActivity = async (req, res) => {
  try {
    const { section, action, details } = req.body;

    if (!section || !action) {
      return res.status(400).json({
        success: false,
        message: "Section and action are required",
      });
    }

    const activity = await logAdminActivity(req, {
      section,
      action,
      details: details || `Updated ${section} section content`,
      actionType: "update",
    });

    if (req.headers.accept?.includes("application/json")) {
      return res.json({
        success: true,
        message: "Activity logged successfully",
        activity,
      });
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Quick update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log activity",
    });
  }
};

export const addBanner = async (req, res) => {
  try {
    console.log(req.files);

    const count = req.files ? req.files.length : 0;

    for (const file of req.files || []) {
      const result = await cloudinary.uploader.upload(file.path);

      await Banner.create({
        imageUrl: result.secure_url,
      });
    }

    // Log the update
    await logAdminActivity(req, {
      section: "Live Updates Banners",
      action: "Uploaded New Banner(s)",
      details: `Uploaded ${count} campaign/promotional banner image(s)`,
      actionType: "create",
      sectionIcon: "fa-solid fa-house-flag",
    });

    res.redirect("/bainar");
  } catch (error) {
    console.log(error);
    res.status(500).send("Upload Failed");
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);

    // Log the delete action
    await logAdminActivity(req, {
      section: "Live Updates Banners",
      action: "Deleted a Banner",
      details: `Removed banner ID ${req.params.id}`,
      actionType: "delete",
      sectionIcon: "fa-solid fa-house-flag",
    });

    res.json({
      success: true,
      message: "Banner deleted",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const adminExists = await Admin.findOne({
      email: "admin@vipparty.com",
    });

    if (adminExists) {
      return res.send("Admin Already Exists");
    }

    await Admin.create({
      email: "admin@vipparty.com",
      password: "123456",
      name: "Mukesh Sahani",
      role: "Super Admin",
    });

    res.send("Admin Created Successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error Creating Admin");
  }
};

/**
 * Controller to render the 10 Days Admin Activity Logs page (Default page 1, 10 items)
 */
export const getActivityLogsPage = async (req, res) => {
  try {
    const { email, section, actionType, search, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    const data = await getLast10DaysActivities({
      email: email || "all",
      section: section || "all",
      actionType: actionType || "all",
      search: search || "",
      page: pageNum,
      limit: limitNum,
    });

    res.render("activityLogs", {
      ...data,
      pageTitle: "Admin Activity Logs (Last 10 Days)",
      currentEmail: email || "all",
      currentSection: section || "all",
      currentActionType: actionType || "all",
      currentSearch: search || "",
      currentPage: pageNum,
      currentLimit: limitNum,
    });
  } catch (error) {
    console.error("Error loading activity logs page:", error);
    res.render("activityLogs", {
      activities: [],
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 0,
        endIndex: 0,
      },
      totalCount: 0,
      adminGroups: [],
      allSections: [],
      stats: { total10Days: 0, todayCount: 0, activeAdminsCount: 0, topSection: "N/A" },
      pageTitle: "Admin Activity Logs (Last 10 Days)",
      currentEmail: "all",
      currentSection: "all",
      currentActionType: "all",
      currentSearch: "",
      currentPage: 1,
      currentLimit: 10,
      filters: {},
    });
  }
};

/**
 * API Endpoint: Return 10 activity logs at a time with pagination and filtering
 * GET /api/activity-logs?page=1&limit=10&email=all&section=all&actionType=all&search=
 */
export const getActivityLogsApi = async (req, res) => {
  try {
    const { email, section, actionType, search, page, limit } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    const result = await getPaginatedActivities({
      email: email || "all",
      section: section || "all",
      actionType: actionType || "all",
      search: search || "",
      page: pageNum,
      limit: limitNum,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getActivityLogsApi:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
      error: error.message,
      activities: [],
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 0,
        endIndex: 0,
      },
    });
  }
};

