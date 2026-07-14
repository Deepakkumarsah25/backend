import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/save-user", async (req, res) => {
  try {
    const data = req.body;

    let user = await User.findOne({
      uid: data.uid,
    });

    if (!user) {
      user = await User.create(data);
    }

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

export default router;