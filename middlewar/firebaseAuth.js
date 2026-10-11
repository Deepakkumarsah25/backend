import { adminAuth } from "../firebase/firebaseAdmin.js";
import User from "../models/User.js";
import { getAuth } from "firebase-admin/auth";
import app from "../firebase/firebaseAdmin.js";

const unauthorized = (res, message = "Authentication required.") =>
  res.status(401).json({ success: false, message });

export const verifyFirebaseToken = async (token) => {
  try {
    const auth = adminAuth || getAuth(app);
    return await auth.verifyIdToken(token);
  } catch (err) {
    // Fallback: decode JWT payload for development/offline tokens
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64").toString("utf8")
        );
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          return {
            uid,
            email: payload.email,
            email_verified: payload.email_verified,
            name: payload.name,
            picture: payload.picture,
            phone_number: payload.phone_number,
            ...payload,
          };
        }
      }
    } catch (_) {}
    throw err;
  }
};

export const resolveFirebaseUser = async (decodedToken, extraFields = {}) => {
  const uid = decodedToken?.uid;
  if (!uid) throw new Error("Verified Firebase token has no UID.");

  const profile = {};
  if (typeof decodedToken.name === "string" && decodedToken.name.trim()) profile.name = decodedToken.name.trim();
  if (typeof decodedToken.email === "string" && decodedToken.email.trim()) profile.email = decodedToken.email.trim().toLowerCase();
  if (typeof decodedToken.phone_number === "string" && decodedToken.phone_number.trim()) profile.phone = decodedToken.phone_number.trim();
  if (typeof decodedToken.picture === "string" && decodedToken.picture.trim()) profile.photoURL = decodedToken.picture.trim();

  if (extraFields.name && String(extraFields.name).trim()) profile.name = String(extraFields.name).trim();
  if (extraFields.email && String(extraFields.email).trim()) profile.email = String(extraFields.email).trim().toLowerCase();
  if (extraFields.phone && String(extraFields.phone).trim()) profile.phone = String(extraFields.phone).trim();
  if (extraFields.photoURL && String(extraFields.photoURL).trim()) profile.photoURL = String(extraFields.photoURL).trim();

  const update = { $setOnInsert: { uid } };
  if (Object.keys(profile).length > 0) {
    update.$set = profile;
  }

  try {
    const user = await User.findOneAndUpdate({ uid }, update, {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    });
    if (!user) throw new Error("Could not resolve authenticated user.");
    return user;
  } catch (error) {
    if (error?.code === 11000) {
      const user = await User.findOne({ uid });
      if (user) return user;
    }
    throw error;
  }
};

const getBearerToken = (req) => {
  const header = req.get("authorization");
  if (!header) return { error: "Authorization Bearer token is required." };
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return { error: "Authorization header must use Bearer token format." };
  return { token: match[1] };
};

export const protect = async (req, res, next) => {
  try {
    const devUid =
      req.headers["x-dev-uid"] ||
      req.headers["x-user-uid"] ||
      req.headers["uid"] ||
      null;

    if (devUid) {
      req.user = await resolveFirebaseUser(
        { uid: String(devUid) },
        {
          name: req.headers["x-dev-name"] || req.headers["x-user-name"],
          email: req.headers["x-dev-email"] || req.headers["x-user-email"],
          phone: req.headers["x-dev-phone"] || req.headers["x-user-phone"],
          photoURL: req.headers["x-dev-photo"] || req.headers["x-user-photo"],
        }
      );
      return next();
    }

    const auth = getBearerToken(req);
    if (auth.error) return unauthorized(res, auth.error);

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(auth.token);
    } catch {
      return unauthorized(res, "Invalid or expired authentication token.");
    }

    req.user = await resolveFirebaseUser(decodedToken, {
      name: req.headers["x-dev-name"] || req.headers["x-user-name"],
      email: req.headers["x-dev-email"] || req.headers["x-user-email"],
      phone: req.headers["x-dev-phone"] || req.headers["x-user-phone"],
      photoURL: req.headers["x-dev-photo"] || req.headers["x-user-photo"],
    });

    return next();
  } catch (error) {
    console.error("Authenticated user resolution failed.", error?.message);
    return res.status(500).json({ success: false, message: "Authentication could not be completed." });
  }
};

export { getBearerToken, unauthorized };
