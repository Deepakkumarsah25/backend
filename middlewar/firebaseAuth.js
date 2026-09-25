import { adminAuth } from "../firebase/firebaseAdmin.js";
import User from "../models/User.js";

const unauthorized = (res, message = "Authentication required.") =>
  res.status(401).json({ success: false, message });

export const verifyFirebaseToken = async (token) =>
  adminAuth.verifyIdToken(token);

export const resolveFirebaseUser = async (decodedToken) => {
  const uid = decodedToken?.uid;
  if (!uid) throw new Error("Verified Firebase token has no UID.");

  const profile = {};
  if (typeof decodedToken.name === "string") profile.name = decodedToken.name;
  if (typeof decodedToken.email === "string") profile.email = decodedToken.email;
  if (typeof decodedToken.phone_number === "string") profile.phone = decodedToken.phone_number;
  if (typeof decodedToken.picture === "string") profile.photoURL = decodedToken.picture;

  const update = { $setOnInsert: { uid, ...profile } };

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
  const auth = getBearerToken(req);
  if (auth.error) return unauthorized(res, auth.error);

  let decodedToken;
  try {
    decodedToken = await verifyFirebaseToken(auth.token);
  } catch {
    return unauthorized(res, "Invalid or expired authentication token.");
  }

  try {
    req.user = await resolveFirebaseUser(decodedToken);
    return next();
  } catch (error) {
    console.error("Authenticated user resolution failed.", error?.message);
    return res.status(500).json({ success: false, message: "Authentication could not be completed." });
  }
};

export { getBearerToken, unauthorized };
