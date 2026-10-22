import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { protect } from "../../middlewar/firebaseAuth.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

import {
  createFeedback,
  getAllFeedback,
  getFeedbackStats,
  getFeedbackById,
  deleteFeedback,
} from "../../controllers/feedback/feedbackController.js";

const router = express.Router();

const feedbackIpLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many feedback submissions. Please try again later." },
});

const feedbackUserLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.user?.uid || req.body?.uid || ipKeyGenerator(req.ip),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many feedback submissions. Please try again later." },
});

// Middleware: Support Firebase token Bearer authentication or direct mobile app UID submission
const allowAppUserOrToken = async (req, res, next) => {
  const authHeader = req.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return protect(req, res, next);
  }

  // Check custom headers
  const headerUid =
    req.headers["x-dev-uid"] ||
    req.headers["x-user-uid"] ||
    req.headers["uid"];
  if (headerUid) {
    req.user = {
      uid: String(headerUid).trim(),
      _id: String(headerUid).trim(),
      name: req.headers["x-user-name"] || req.body?.name || "App User",
      email: req.headers["x-user-email"] || req.body?.email || "",
    };
    return next();
  }

  // Check body UID (as sent by mobile app Settings > Feedback)
  const bodyUid = req.body?.uid;
  if (bodyUid && typeof bodyUid === "string" && bodyUid.trim()) {
    req.user = {
      uid: bodyUid.trim(),
      _id: bodyUid.trim(),
      name: (req.body?.name || "").trim() || "App User",
      email: (req.body?.email || "").trim(),
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required. Please login before submitting feedback.",
  });
};

// =====================================================
// ADMIN DASHBOARD
// GET /feedback-admin
// =====================================================

router.get(
  "/",
  requireAdmin,
  (req, res) => {
    res.render(
      "Feedback/feedbackDashboard",
      {
        activeNav: "feedback-admin",
      }
    );
  }
);


// =====================================================
// MOBILE APP API
// POST /api/feedback
// =====================================================

router.post(
  "/feedback",
  feedbackIpLimit,
  allowAppUserOrToken,
  feedbackUserLimit,
  createFeedback
);


// =====================================================
// ADMIN API (APP ONLY)
// =====================================================

router.get(
  "/feedback",
  requireAdmin,
  getAllFeedback
);

router.get(
  "/feedback/stats",
  requireAdmin,
  getFeedbackStats
);

router.get(
  "/feedback/:id",
  requireAdmin,
  getFeedbackById
);

router.delete(
  "/feedback/:id",
  requireAdmin,
  deleteFeedback
);


export default router;
