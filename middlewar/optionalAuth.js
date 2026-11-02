import {
  getBearerToken,
  resolveFirebaseUser,
  verifyFirebaseToken,
} from "./firebaseAuth.js";

/**
 * Optional Firebase authentication for genuinely public routes.
 * A missing Authorization header is a guest request; a malformed or invalid
 * supplied token is rejected and is never downgraded to guest access.
 */
export const optionalAuth = async (req, res, next) => {
  if (!req.get("authorization")) {
    req.auth = null;
    req.user = null;
    return next();
  }

  const auth = getBearerToken(req);
  if (auth.error) {
    return res.status(401).json({ success: false, message: auth.error });
  }

  let decodedToken;
  try {
    decodedToken = await verifyFirebaseToken(auth.token);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }

  try {
    req.auth = decodedToken;
    req.user = await resolveFirebaseUser(decodedToken);
    return next();
  } catch {
    console.error("Optional authenticated user resolution failed.");
    return res.status(503).json({
      success: false,
      message: "Authentication service temporarily unavailable.",
    });
  }
};
