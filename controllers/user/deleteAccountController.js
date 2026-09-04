import User from "../../models/User.js";
import { sendEmail } from "../../services/emailService.js";

export const sendDeleteOtp = async (req, res) => {
  try {
    const { uid } = req.body;

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    user.deleteOtp = otp;

    user.deleteOtpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    await sendEmail(
      user.email,
      "VIP Party Account Deletion OTP",
      `
      <h2>Account Deletion Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>OTP valid for 10 minutes.</p>
      `
    );

    res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

export const verifyDeleteOtp = async (req, res) => {
  try {
    const { uid, otp } = req.body;

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.deleteOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (
      !user.deleteOtpExpiry ||
      new Date() > user.deleteOtpExpiry
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.deletionRequested = true;

    user.deletionDate = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    user.deleteOtp = "";
    user.deleteOtpExpiry = null;

    await user.save();

    res.json({
      success: true,
      message: "Account scheduled for deletion",
      deletionDate: user.deletionDate,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

export const cancelDeletion = async (req, res) => {
  try {
    const { uid } = req.body;

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.deletionRequested = false;
    user.deletionDate = null;

    await user.save();

    res.json({
      success: true,
      message: "Deletion cancelled",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Cancel failed",
    });
  }
};