import User from "../models/User.js";

/*
  OPTIONAL AUTH — like protect.js, but never 401s.
  If x-dev-uid header is present, resolves/creates the User
  and attaches req.user. If absent, req.user = null and the
  request proceeds as a guest. Used on routes that must work
  for both logged-in and anonymous callers (e.g. quick join).
*/
export const optionalAuth = async (req, res, next) => {
  try {
    const uid = req.headers["x-dev-uid"];

    if (!uid) {
      req.user = null;
      return next();
    }

    const updateData = { $setOnInsert: { uid } };

    const setFields = {};
    if (req.headers["x-dev-name"]) setFields.name = req.headers["x-dev-name"];
    if (req.headers["x-dev-email"]) setFields.email = req.headers["x-dev-email"];
    if (req.headers["x-dev-phone"]) setFields.phone = req.headers["x-dev-phone"];
    if (req.headers["x-dev-photo"]) setFields.photoURL = req.headers["x-dev-photo"];

    if (Object.keys(setFields).length > 0) {
      updateData.$set = setFields;
    }

    try {
      req.user = await User.findOneAndUpdate({ uid }, updateData, {
        returnDocument: "after",
        upsert: true,
      });
    } catch (upsertErr) {
      if (upsertErr.code === 11000) {
        req.user = await User.findOne({ uid });
      } else {
        throw upsertErr;
      }
    }

    next();
  } catch (err) {
    console.error("optionalAuth error:", err);
    // Fail OPEN — a broken lookup should never block a guest submission.
    req.user = null;
    next();
  }
};