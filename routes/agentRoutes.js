import express from "express";
import { saveUser } from "../../controllers/user/userController.js";
import {
  sendDeleteOtp,
  verifyDeleteOtp,
  cancelDeletion,
} from "../../controllers/user/deleteAccountController.js";

const router = express.Router();

router.post("/api/user/save", saveUser);
router.post(
  "/api/user/delete/send-otp",
  sendDeleteOtp
);

router.post(
  "/api/user/delete/verify-otp",
  verifyDeleteOtp
);

router.post(
  "/api/user/delete/cancel",
  cancelDeletion
);

export default router;