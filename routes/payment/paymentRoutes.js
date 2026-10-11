import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import rateLimit from "express-rate-limit";

import Donation from "../../models/Donation.js";

const router = express.Router();

const createOrderLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many payment orders. Please try again later." },
});
const verifyPaymentLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many verification requests. Please try again later." },
});

const configuredMinAmount = Number(process.env.PAYMENT_MIN_AMOUNT_INR || 1);
const configuredMaxAmount = Number(process.env.PAYMENT_MAX_AMOUNT_INR || 100000);
const MIN_AMOUNT = Number.isFinite(configuredMinAmount) && configuredMinAmount > 0
  ? configuredMinAmount
  : 1;
const MAX_AMOUNT = Number.isFinite(configuredMaxAmount) && configuredMaxAmount > MIN_AMOUNT
  ? configuredMaxAmount
  : 100000;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
========================================
CREATE RAZORPAY ORDER
========================================
*/

router.post("/create-order", createOrderLimit, async (req, res) => {
  try {
    const { amount } = req.body;

    const donationAmount = Number(amount);
    const amountInPaise = Math.round(donationAmount * 100);

    if (
      !Number.isFinite(donationAmount) ||
      donationAmount < MIN_AMOUNT ||
      donationAmount > MAX_AMOUNT ||
      !Number.isSafeInteger(amountInPaise) ||
      Math.abs(donationAmount * 100 - amountInPaise) > 1e-6
    ) {
      return res.status(400).json({
        success: false,
        message: `Donation amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}`,
      });
    }

    // ₹500 = 50000 paise
    const receipt = `donation_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
    });

    // Save order in MongoDB
    await Donation.create({
      amount: amountInPaise / 100,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error?.message || "Unexpected error");

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
});

/*
========================================
VERIFY RAZORPAY PAYMENT
========================================
*/

router.post("/verify", verifyPaymentLimit, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (
      typeof razorpay_payment_id !== "string" ||
      !/^pay_[A-Za-z0-9]+$/.test(razorpay_payment_id) ||
      typeof razorpay_order_id !== "string" ||
      !/^order_[A-Za-z0-9]+$/.test(razorpay_order_id) ||
      typeof razorpay_signature !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(razorpay_signature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is missing",
      });
    }

    // Find order from OUR DATABASE
    const donation = await Donation.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation order not found",
      });
    }

    const body =
      donation.razorpayOrderId +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    const receivedBuffer = Buffer.from(
      razorpay_signature,
      "utf8"
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    const signatureValid =
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      );

    if (!signatureValid) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    if (donation.status === "paid") {
      if (donation.razorpayPaymentId === razorpay_payment_id) {
        return res.json({
          success: true,
          message: "Payment verified successfully",
          donationId: donation._id,
          amount: donation.amount,
        });
      }
      return res.status(409).json({ success: false, message: "This order has already been verified." });
    }

    const updatedDonation = await Donation.findOneAndUpdate(
      { _id: donation._id, status: { $ne: "paid" } },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "paid",
        },
      },
      { new: true },
    );

    if (!updatedDonation) {
      const current = await Donation.findById(donation._id);
      if (current?.status === "paid" && current.razorpayPaymentId === razorpay_payment_id) {
        return res.json({ success: true, message: "Payment verified successfully", donationId: current._id, amount: current.amount });
      }
      return res.status(409).json({ success: false, message: "This order has already been verified." });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
      donationId: updatedDonation._id,
      amount: updatedDonation.amount,
    });
  } catch (error) {
    console.error("Razorpay Verification Error:", error?.message || "Unexpected error");

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

export default router;
