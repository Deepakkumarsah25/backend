import Admin from "../models/Admin.js";

/**
 * Authorization for Firebase-authenticated admin APIs. Admin permission is
 * taken from a verified Firebase custom claim or a server-side Admin record.
 */
export const requireFirebaseAdmin = async (req, res, next) => {
  if (!req.user || !req.auth?.uid) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  if (req.auth.admin === true || req.auth.role === "admin") {
    return next();
  }

  const email = typeof req.auth.email === "string"
    ? req.auth.email.trim().toLowerCase()
    : "";
  if (!email || req.auth.email_verified !== true) {
    return res.status(403).json({ success: false, message: "Administrator access required." });
  }

  try {
    const admin = await Admin.findOne({ email }).select("_id email role").lean();
    if (!admin) {
      return res.status(403).json({ success: false, message: "Administrator access required." });
    }
    req.admin = admin;
    return next();
  } catch {
    console.error("Firebase administrator authorization lookup failed.");
    return res.status(503).json({
      success: false,
      message: "Authorization service temporarily unavailable.",
    });
  }
};
