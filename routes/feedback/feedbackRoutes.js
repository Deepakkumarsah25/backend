import express from "express";

import {
  createFeedback,
  getAllFeedback,
  getFeedbackStats,
  getFeedbackById,
  deleteFeedback,
} from "../../controllers/feedback/feedbackController.js";

const router = express.Router();


// =====================================================
// ADMIN DASHBOARD
// GET /feedback-admin
// =====================================================

router.get(
  "/",
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
  createFeedback
);


// =====================================================
// ADMIN API
// =====================================================

router.get(
  "/feedback",
  getAllFeedback
);

router.get(
  "/feedback/stats",
  getFeedbackStats
);

router.get(
  "/feedback/:id",
  getFeedbackById
);

router.delete(
  "/feedback/:id",
  deleteFeedback
);


export default router;