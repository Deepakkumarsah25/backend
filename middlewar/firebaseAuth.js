import { adminAuth } from "../firebase/firebaseAdmin.js";
import User from "../models/User.js";

const unauthorized = (res, message = "Authentication required.") =>
  res.status(401).json({ success: false, message });

/** Verify a Firebase ID token. Verification errors are deliberately propagated. */
export const verifyFirebaseToken = async (token) => {
  if (!adminAuth) {
    throw new Error("Firebase Admin authentication is unavailable.");
  }
  return adminAuth.verifyIdToken(token);
};

/** Parse only an Authorization Bearer token; identity headers are never trusted. */
export const getBearerToken = (req) => {
  const header = req.get("authorization");
  if (!header) return { error: "Authorization Bearer token is required." };
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) return { error: "Authorization header must use Bearer token format." };
  return { token: match[1] };
};

/** Resolve the database profile using a UID from a successfully verified token. */
export const resolveFirebaseUser = async (decodedToken) => {
  const uid = decodedToken?.uid;
  if (typeof uid !== "string" || !uid.trim()) {
    throw new Error("Verified Firebase token has no UID.");
  }

  const profile = {};
  if (typeof decodedToken.name === "string" && decodedToken.name.trim()) {
    profile.name = decodedToken.name.trim();
  }
  if (typeof decodedToken.email === "string" && decodedToken.email.trim()) {
    profile.email = decodedToken.email.trim().toLowerCase();
  }
  if (typeof decodedToken.phone_number === "string" && decodedToken.phone_number.trim()) {
    profile.phone = decodedToken.phone_number.trim();
  }
  if (typeof decodedToken.picture === "string" && decodedToken.picture.trim()) {
    profile.photoURL = decodedToken.picture.trim();
  }

  const update = { $setOnInsert: { uid } };
  if (Object.keys(profile).length) update.$set = profile;

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

export const requireAuth = async (req, res, next) => {
  const auth = getBearerToken(req);
  if (auth.error) return unauthorized(res, auth.error);

  let decodedToken;
  try {
    decodedToken = await verifyFirebaseToken(auth.token);
  } catch {
    return unauthorized(res, "Invalid or expired authentication token.");
  }

  try {
    const user = await resolveFirebaseUser(decodedToken);
    req.auth = decodedToken;
    req.user = user;
    return next();
  } catch (error) {
    // Do not expose token claims or database details in an authentication error.
    console.error("Authenticated user resolution failed.");
    return res.status(503).json({
      success: false,
      message: "Authentication service temporarily unavailable.",
    });
  }
};

// Preserve existing route imports while making the trusted behavior explicit.
export const protect = requireAuth;
