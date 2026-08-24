import express from "express";
import rateLimit from "express-rate-limit";
import { searchAll } from "../controllers/searchController.js";

const router = express.Router();

/* ===========================================
   Rate limiter — public endpoint, no auth
=========================================== */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,              // 30 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many search requests. Please slow down.",
  },
});

router.get("/search", searchLimiter, searchAll);

export default router;