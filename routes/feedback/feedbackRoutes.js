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
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many feedback submissions. Please try again later." },
});
const feedbackUserLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req.ip),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many feedback submissions. Please try again later." },
});


// =====================================================
// ADMIN DASHBOARD
// GET /feedback-admin
// =====================================================

router.get(
  "/",
  requireAdmin,
  (req, res) => {
    res.render(
      "Feedback/feedbackDashboard"
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
  protect,
  feedbackUserLimit,
  createFeedback
);


// =====================================================
// ADMIN API
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
