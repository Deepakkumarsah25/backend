import {
  getBearerToken,
  resolveFirebaseUser,
  unauthorized,
  verifyFirebaseToken,
} from "./firebaseAuth.js";

export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization === undefined) {
    req.user = null;
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

  try {
    req.user = await resolveFirebaseUser(decodedToken);
    return next();
  } catch (error) {
    console.error("Optional authenticated user resolution failed.", error?.message);
    return res.status(500).json({ success: false, message: "Authentication could not be completed." });
  }
};
