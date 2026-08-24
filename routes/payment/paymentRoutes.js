import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";

import Donation from "../../models/Donation.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
========================================
CREATE RAZORPAY ORDER
========================================
*/

router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const donationAmount = Number(amount);

    if (!donationAmount || donationAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid donation amount",
      });
    }

    // ₹500 = 50000 paise
    const amountInPaise = Math.round(donationAmount * 100);

    const receipt = `donation_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
    });

    // Save order in MongoDB
    await Donation.create({
      amount: donationAmount,
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
    console.error("Create Razorpay Order Error:", error);

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

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
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
      donation.status = "failed";
      await donation.save();

      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Payment verified
    donation.razorpayPaymentId =
      razorpay_payment_id;

    donation.razorpaySignature =
      razorpay_signature;

    donation.status = "paid";

    await donation.save();

    return res.json({
      success: true,
      message: "Payment verified successfully",
      donationId: donation._id,
      amount: donation.amount,
    });
  } catch (error) {
    console.error("Razorpay Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

export default router;