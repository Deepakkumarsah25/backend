import Feedback from "../../models/feedback/Feedback.js";
import mongoose from "mongoose";

/* =====================================================
   SUBMIT FEEDBACK
===================================================== */

export const createFeedback = async (req, res) => {
  try {
    const { rating, message } = req.body;
    const uid = req.user?.uid;
    const name = req.user?.name;
    const email = req.user?.email;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!req.user?._id || !uid) {
      return res.status(400).json({
        success: false,
        message: "User UID is required.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "User name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    if (rating === undefined || rating === null || rating === "") {
      return res.status(400).json({
        success: false,
        message: "Please select a rating.",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Feedback message is required.",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: "Feedback message must be 1000 characters or fewer." });
    }

    // -----------------------------
    // CREATE FEEDBACK
    // -----------------------------

    const feedback = await Feedback.create({
      uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: numericRating,
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback,
    });
  } catch (error) {
    console.error(
      "CREATE FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while submitting feedback.",
    });
  }
};


/* =====================================================
   GET ALL FEEDBACK
===================================================== */

export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      feedbacks,
    });
  } catch (error) {
    console.error(
      "GET FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback.",
    });
  }
};


/* =====================================================
   GET FEEDBACK STATISTICS
===================================================== */

export const getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback =
      await Feedback.countDocuments();

    const ratingStats =
      await Feedback.aggregate([
        {
          $group: {
            _id: null,

            averageRating: {
              $avg: "$rating",
            },

            totalRatings: {
              $sum: 1,
            },
          },
        },
      ]);

    const ratingCounts =
      await Feedback.aggregate([
        {
          $group: {
            _id: "$rating",

            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
      ]);

    const stats = {
      totalFeedback,
      averageRating:
        ratingStats.length > 0
          ? Number(
              ratingStats[0].averageRating.toFixed(1)
            )
          : 0,

      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    };

    ratingCounts.forEach((item) => {
      if (item._id === 5) {
        stats.fiveStar = item.count;
      }

      if (item._id === 4) {
        stats.fourStar = item.count;
      }

      if (item._id === 3) {
        stats.threeStar = item.count;
      }

      if (item._id === 2) {
        stats.twoStar = item.count;
      }

      if (item._id === 1) {
        stats.oneStar = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error(
      "FEEDBACK STATS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to calculate feedback statistics.",
    });
  }
};


/* =====================================================
   GET SINGLE FEEDBACK
===================================================== */

export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID.",
      });
    }

    const feedback =
      await Feedback.findById(id).lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found.",
      });
    }

    return res.status(200).json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error(
      "GET SINGLE FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback.",
    });
  }
};


/* =====================================================
   DELETE FEEDBACK
===================================================== */

export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID.",
      });
    }

    const deletedFeedback =
      await Feedback.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE FEEDBACK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete feedback.",
    });
  }
};
