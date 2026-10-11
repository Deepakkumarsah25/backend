import User from "../../models/User.js";
import { sendEmail } from "../../services/emailService.js";
import { randomInt } from "node:crypto";
import { getBearerToken, verifyFirebaseToken } from "../../middlewar/firebaseAuth.js";

const TEN_DAYS = 10 * 24 * 60 * 60 * 1000;
const OTP_EXPIRY = 10 * 60 * 1000;
const OTP_SEND_COOLDOWN = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// ============================================
// SEND DELETE ACCOUNT OTP
// ============================================
export const sendDeleteOtp = async (req, res) => {
  try {
    const uid = req.user?.uid;

    console.log("================================");
    console.log("SEND DELETE OTP");
    console.log("================================");

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "User UID is required",
      });
    }

    const auth = getBearerToken(req);
    let verifiedEmail;
    try {
      const decodedToken = auth.error ? null : await verifyFirebaseToken(auth.token);
      if (decodedToken?.uid === uid && decodedToken.email_verified === true && typeof decodedToken.email === "string") {
        verifiedEmail = decodedToken.email.trim().toLowerCase();
      }
    } catch {
      return res.status(401).json({ success: false, message: "Authentication could not be verified." });
    }
    if (!verifiedEmail) {
      return res.status(403).json({ success: false, message: "A verified email address is required to request account deletion." });
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

    console.log("User found for account deletion request.");

    // Six-digit OTP generated with cryptographically secure randomness.
    const otp = String(randomInt(100000, 1000000));
    const now = new Date();
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        $or: [
          { deleteOtpLastSentAt: null },
          { deleteOtpLastSentAt: { $exists: false } },
          { deleteOtpLastSentAt: { $lte: new Date(now.getTime() - OTP_SEND_COOLDOWN) } },
        ],
      },
      {
        $set: {
          email: verifiedEmail,
          deleteOtp: otp,
          deleteOtpExpiry: new Date(now.getTime() + OTP_EXPIRY),
          deleteOtpAttempts: 0,
          deleteOtpLastSentAt: now,
        },
      },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    // ============================================
    // SEND EMAIL
    // ============================================

    await sendEmail(
      verifiedEmail,
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
                  Hello ${updatedUser.name || "User"},
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
      `
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "SEND DELETE OTP ERROR:"
    );

    console.error(error?.message || "Unexpected error");

    console.error(
      "================================"
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};


// ============================================
// VERIFY DELETE ACCOUNT OTP
// ============================================
export const verifyDeleteOtp = async (req, res) => {
  try {
    const uid = req.user?.uid;
    const { otp } = req.body;

    console.log("================================");
    console.log("VERIFY DELETE OTP");
    console.log("================================");

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "Authenticated user is required",
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

    if (!user.deleteOtp || !user.deleteOtpExpiry) {
      return res.status(400).json({ success: false, message: "No active OTP. Please request a new one." });
    }

    const now = new Date();
    if (now > user.deleteOtpExpiry) {
      await User.updateOne(
        { _id: user._id, deleteOtp: user.deleteOtp, deleteOtpExpiry: { $lte: now } },
        { $set: { deleteOtp: "", deleteOtpExpiry: null, deleteOtpAttempts: 0 } },
      );
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    const submittedOtp = typeof otp === "string" ? otp.trim() : String(otp ?? "");
    if (/^\d{6}$/.test(submittedOtp) && user.deleteOtp === submittedOtp) {
      const deletionDate = new Date(Date.now() + TEN_DAYS);
      const consumedUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          deleteOtp: submittedOtp,
          deleteOtpExpiry: { $gt: new Date() },
          deleteOtpAttempts: { $lt: MAX_OTP_ATTEMPTS },
        },
        {
          $set: {
            deletionRequested: true,
            deletionDate,
            deleteOtp: "",
            deleteOtpExpiry: null,
            deleteOtpAttempts: 0,
          },
        },
        { new: true },
      );
      if (consumedUser) {
        return res.status(200).json({
          success: true,
          message: "Account deletion request submitted successfully",
          deletionDate: consumedUser.deletionDate,
        });
      }
      return res.status(400).json({ success: false, message: "OTP is invalid, expired, or already used." });
    }

    const attemptResult = await User.updateOne(
      {
        _id: user._id,
        deleteOtp: user.deleteOtp,
        deleteOtpExpiry: { $gt: new Date() },
        deleteOtpAttempts: { $lt: MAX_OTP_ATTEMPTS },
      },
      { $inc: { deleteOtpAttempts: 1 } },
    );
    if (!attemptResult.modifiedCount) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts or OTP no longer active. Please request a new OTP.",
      });
    }
    const updatedUser = await User.findById(user._id).select("deleteOtpAttempts");
    const attemptsExhausted = updatedUser.deleteOtpAttempts >= MAX_OTP_ATTEMPTS;
    if (attemptsExhausted) {
      await User.updateOne(
        {
          _id: user._id,
          deleteOtp: user.deleteOtp,
          deleteOtpAttempts: { $gte: MAX_OTP_ATTEMPTS },
        },
        { $set: { deleteOtp: "", deleteOtpExpiry: null, deleteOtpAttempts: 0 } },
      );
    }
    return res.status(attemptsExhausted ? 429 : 400).json({
        success: false,
        message: attemptsExhausted
          ? "Too many incorrect attempts. Please request a new OTP."
          : "Invalid OTP",
    });

  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "VERIFY DELETE OTP ERROR:"
    );

    console.error(error?.message || "Unexpected error");

    console.error(
      "================================"
    );

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
    const uid = req.user?.uid;

    console.log("================================");
    console.log("CANCEL ACCOUNT DELETION");
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
    user.deleteOtpAttempts = 0;

    await user.save();

    console.log(
      "Account deletion cancelled successfully"
    );

    return res.status(200).json({
      success: true,
      message: "Account deletion cancelled",
    });

  } catch (error) {
    console.error(
      "================================"
    );

    console.error(
      "CANCEL DELETION ERROR:"
    );

    console.error(error);

    console.error(
      "================================"
    );

    return res.status(500).json({
      success: false,
      message: "Cancel failed",
    });
  }
};
