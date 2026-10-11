import {
  getBearerToken,
  resolveFirebaseUser,
  verifyFirebaseToken,
} from "./firebaseAuth.js";

/*
  OPTIONAL AUTH — works with Bearer tokens or x-dev-uid / x-user-uid headers.
  Resolves/creates the User and attaches req.user.
  If absent or unauthenticated, req.user = null and the request proceeds as a guest.
*/
export const optionalAuth = async (req, res, next) => {
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

    if (!req.headers.authorization) {
      req.user = null;
      return next();
    }

    const auth = getBearerToken(req);
    if (auth.error) {
      req.user = null;
      return next();
    }

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(auth.token);
    } catch {
      req.user = null;
      return next();
    }

    req.user = await resolveFirebaseUser(decodedToken, {
      name: req.headers["x-dev-name"] || req.headers["x-user-name"],
      email: req.headers["x-dev-email"] || req.headers["x-user-email"],
      phone: req.headers["x-dev-phone"] || req.headers["x-user-phone"],
      photoURL: req.headers["x-dev-photo"] || req.headers["x-user-photo"],
    });
    return next();
  } catch (error) {
    console.error("optionalAuth resolution failed, continuing as guest:", error?.message);
    req.user = null;
    return next();
  }
};
