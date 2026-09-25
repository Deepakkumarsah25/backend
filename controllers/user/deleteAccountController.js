import User from "../../models/User.js";
import { sendEmail } from "../../services/emailService.js";

const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
const OTP_EXPIRY = 10 * 60 * 1000;

// ============================================
// SEND DELETE ACCOUNT OTP
// ============================================
export const sendDeleteOtp = async (req, res) => {
  try {
    const { uid } = req.body;

    console.log("================================");
    console.log("SEND DELETE OTP");
    console.log("UID:", uid);
    console.log("================================");

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User UID is required",
      });
    }

    // Find user in MongoDB
    const user = await User.findOne({ uid });

    if (!user) {
      console.log("DELETE OTP ERROR: User not found");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User found:", user.email);

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "No email found for this account",
      });
    }

    // ============================================
    // GENERATE 4 DIGIT OTP
    // ============================================

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    console.log("Generated OTP:", otp);

    // Save OTP
    user.deleteOtp = otp;

    // OTP valid for 10 minutes
    user.deleteOtpExpiry = new Date(Date.now() + OTP_EXPIRY);

    await user.save();

    /* ============================================
   VERIFY SAVE
============================================ */

    const verifySavedUser = await User.findOne({
      uid: user.uid,
    }).select("uid email deletionRequested deletionDate");

    console.log("================================");
    console.log("DELETE REQUEST SAVED IN MONGODB");
    console.log("UID:", verifySavedUser?.uid);
    console.log("EMAIL:", verifySavedUser?.email);
    console.log("deletionRequested:", verifySavedUser?.deletionRequested);
    console.log("deletionDate:", verifySavedUser?.deletionDate);
    console.log("================================");
    // ============================================
    // SEND EMAIL
    // ============================================

    await sendEmail(
      user.email,
      "VIP Party - Account Deletion OTP",
      `
        <!DOCTYPE html>

        <html>
          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>Account Deletion OTP</title>
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#f5f5f5;
              font-family:Arial,Helvetica,sans-serif;
            "
          >

            <div
              style="
                max-width:600px;
                margin:30px auto;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 4px 15px rgba(0,0,0,0.08);
              "
            >

              <!-- HEADER -->

              <div
                style="
                  background:#d72a2a;
                  padding:22px;
                  text-align:center;
                  color:#ffffff;
                "
              >
                <h1
                  style="
                    margin:0;
                    font-size:24px;
                  "
                >
                  VIP Party
                </h1>

                <p
                  style="
                    margin:7px 0 0;
                    font-size:14px;
                  "
                >
                  Account Deletion Verification
                </p>
              </div>

              <!-- CONTENT -->

              <div
                style="
                  padding:30px 25px;
                  color:#333333;
                "
              >

                <h2
                  style="
                    margin-top:0;
                    color:#222222;
                  "
                >
                  Hello ${user.name || "User"},
                </h2>

                <p
                  style="
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  You requested to delete your
                  VIP Party account.
                </p>

                <p
                  style="
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Please use the following
                  verification OTP:
                </p>

                <!-- OTP -->

                <div
                  style="
                    margin:25px 0;
                    text-align:center;
                  "
                >

                  <div
                    style="
                      display:inline-block;
                      padding:15px 30px;
                      background:#fef2f2;
                      border:2px solid #d72a2a;
                      border-radius:10px;
                      color:#d72a2a;
                      font-size:32px;
                      font-weight:bold;
                      letter-spacing:10px;
                    "
                  >
                    ${otp}
                  </div>

                </div>

                <p
                  style="
                    font-size:14px;
                    color:#666666;
                    text-align:center;
                  "
                >
                  This OTP is valid for
                  <strong>10 minutes</strong>.
                </p>

                <div
                  style="
                    margin-top:25px;
                    padding:15px;
                    background:#fff7ed;
                    border:1px solid #fed7aa;
                    border-radius:8px;
                  "
                >

                  <p
                    style="
                      margin:0;
                      color:#92400e;
                      font-size:13px;
                      line-height:1.6;
                    "
                  >
                    <strong>Important:</strong>
                    If you did not request account
                    deletion, please ignore this email.
                  </p>

                </div>

              </div>

              <!-- FOOTER -->

              <div
                style="
                  padding:18px;
                  text-align:center;
                  background:#f8f8f8;
                  color:#777777;
                  font-size:12px;
                "
              >
                VIP Party Official Mobile App
              </div>

            </div>

          </body>
        </html>
      `,
    );

    console.log("OTP email sent successfully to:", user.email);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("================================");

    console.error("SEND DELETE OTP ERROR:");

    console.error(error);

    console.error("================================");

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// VERIFY DELETE ACCOUNT OTP
// ============================================
export const verifyDeleteOtp = async (req, res) => {
  try {
    const { uid, otp } = req.body;

    console.log("================================");
    console.log("VERIFY DELETE OTP");
    console.log("UID:", uid);
    console.log("OTP:", otp);
    console.log("================================");

    if (!uid || !otp) {
      return res.status(400).json({
        success: false,
        message: "UID and OTP are required",
      });
    }

    // Find user
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ============================================
    // CHECK OTP
    // ============================================

    if (user.deleteOtp !== String(otp).trim()) {
      console.log("Invalid OTP");

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ============================================
    // CHECK OTP EXPIRY
    // ============================================

    if (!user.deleteOtpExpiry || new Date() > user.deleteOtpExpiry) {
      console.log("OTP expired");

      user.deleteOtp = "";
      user.deleteOtpExpiry = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // ============================================
    // SCHEDULE ACCOUNT DELETION
    // ============================================

    user.deletionRequested = true;

    user.deletionDate = new Date(Date.now() + TEN_DAYS);

    // Clear OTP after successful verification
    user.deleteOtp = "";
    user.deleteOtpExpiry = null;

    await user.save();

    console.log("Account deletion scheduled:");

    console.log("Deletion date:", user.deletionDate);

    return res.status(200).json({
      success: true,

      message: "Account deletion request submitted successfully",

      deletionDate: user.deletionDate,
    });
  } catch (error) {
    console.error("================================");

    console.error("VERIFY DELETE OTP ERROR:");

    console.error(error);

    console.error("================================");

    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

// ============================================
// CANCEL ACCOUNT DELETION
// ============================================
export const cancelDeletion = async (req, res) => {
  try {
    const { uid } = req.body;

    console.log("================================");
    console.log("CANCEL ACCOUNT DELETION");
    console.log("UID:", uid);
    console.log("================================");

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User UID is required",
      });
    }

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Cancel deletion
    user.deletionRequested = false;
    user.deletionDate = null;

    // Clear OTP data
    user.deleteOtp = "";
    user.deleteOtpExpiry = null;

    await user.save();

    console.log("Account deletion cancelled successfully");

    return res.status(200).json({
      success: true,
      message: "Account deletion cancelled",
    });
  } catch (error) {
    console.error("================================");

    console.error("CANCEL DELETION ERROR:");

    console.error(error);

    console.error("================================");

    return res.status(500).json({
      success: false,
      message: "Cancel failed",
    });
  }
};
