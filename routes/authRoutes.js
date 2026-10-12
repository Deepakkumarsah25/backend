import express from "express";
import { protect } from "../middlewar/firebaseAuth.js";
import Join from "../models/joinmodel.js";

const router = express.Router();

router.post("/save-user", protect, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const queryConditions = [{ userId: req.user._id }];
    if (req.user.uid) queryConditions.push({ uid: req.user.uid });
    if (req.user.phone) {
      const cleanPhone = String(req.user.phone).replace(/\D/g, "").slice(-10);
      if (cleanPhone) queryConditions.push({ mobile: cleanPhone });
    }

    const membership = await Join.findOne({
      $or: queryConditions,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        photoURL: req.user.photoURL,
        isAgent: req.user.isAgent || false,

        membership: membership
          ? {
              exists: true,
              status: membership.status || "Pending",
              isApproved: membership.status === "Approved",
              memberId: membership.memberId || null,
              mode: membership.mode || "full",
              type: membership.type || "party_member",
              bloodGroup: membership.bloodGroup || "",
              pinCode: membership.pinCode || "",
              dob: membership.dob || null,
            }
          : {
              exists: false,
            },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
