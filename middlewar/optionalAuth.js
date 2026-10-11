import User from "../models/User.js";
import { getAuth } from "firebase-admin/auth";
import app from "../firebase/firebaseAdmin.js";

/*
  OPTIONAL AUTH — works with Bearer tokens or x-dev-uid / x-user-uid headers.
  Resolves/creates the User and attaches req.user.
  If absent or unauthenticated, req.user = null and the request proceeds as a guest.
*/
export const optionalAuth = async (req, res, next) => {
  try {
    let uid =
      req.headers["x-dev-uid"] ||
      req.headers["x-user-uid"] ||
      req.headers["uid"] ||
      null;

    const authHeader = req.headers.authorization;
    if (!uid && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const adminAuth = getAuth(app);
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded?.uid;
      } catch (tokenErr) {
        // Fallback: decode JWT payload
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], "base64").toString("utf8")
            );
            uid = payload.user_id || payload.sub || payload.uid;
          }
        } catch (_) {}
      }
    }

    if (!uid) {
      req.user = null;
      return next();
    }

    const updateData = { $setOnInsert: { uid: String(uid) } };

    const setFields = {};
    if (req.headers["x-dev-name"] || req.headers["x-user-name"]) {
      setFields.name = req.headers["x-dev-name"] || req.headers["x-user-name"];
    }
    if (req.headers["x-dev-email"] || req.headers["x-user-email"]) {
      setFields.email = req.headers["x-dev-email"] || req.headers["x-user-email"];
    }
    if (req.headers["x-dev-phone"] || req.headers["x-user-phone"]) {
      setFields.phone = req.headers["x-dev-phone"] || req.headers["x-user-phone"];
    }
    if (req.headers["x-dev-photo"] || req.headers["x-user-photo"]) {
      setFields.photoURL = req.headers["x-dev-photo"] || req.headers["x-user-photo"];
    }

    if (Object.keys(setFields).length > 0) {
      updateData.$set = setFields;
    }

    try {
      req.user = await User.findOneAndUpdate({ uid: String(uid) }, updateData, {
        returnDocument: "after",
        upsert: true,
      });
    } catch (upsertErr) {
      if (upsertErr.code === 11000) {
        req.user = await User.findOne({ uid: String(uid) });
      } else {
        throw upsertErr;
      }
    }

    next();
  } catch (err) {
    console.error("optionalAuth error:", err);
    req.user = null;
    next();
  }
};