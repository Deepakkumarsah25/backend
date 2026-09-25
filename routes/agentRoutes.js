import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { saveUser } from "../controllers/user/userController.js";
import { protect } from "../middlewar/firebaseAuth.js";

import {
  sendDeleteOtp,
  verifyDeleteOtp,
  cancelDeletion,
} from "../controllers/user/deleteAccountController.js";

const router = express.Router();

const deleteOtpSendIpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests. Please try again later." },
});
const deleteOtpSendUserLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req.ip),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests. Please try again later." },
});
const deleteOtpVerifyIpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many verification attempts. Please try again later." },
});
const deleteOtpVerifyUserLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user?.uid || ipKeyGenerator(req.ip),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many verification attempts. Please try again later." },
});

router.post("/api/user/save", protect, saveUser);

router.post(
  "/api/user/delete/send-otp",
  deleteOtpSendIpLimit,
  protect,
  deleteOtpSendUserLimit,
  sendDeleteOtp
);

router.post(
  "/api/user/delete/verify-otp",
  deleteOtpVerifyIpLimit,
  protect,
  deleteOtpVerifyUserLimit,
  verifyDeleteOtp
);

router.post(
  "/api/user/delete/cancel",
  protect,
  cancelDeletion
);

export default router;
