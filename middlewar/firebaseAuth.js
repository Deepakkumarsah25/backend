import User from "../models/User.js";
export const protect = async (req, res, next) => {
  try {
    const uid = req.headers["x-dev-uid"];

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "No uid provided (dev bypass mode).",
      });
    }

    // findOne + create ki jagah atomic upsert — race condition fix
const updateData = { $setOnInsert: { uid } };

    // Agar headers me actual profile data mila hai, to use $set karo taaki
    // existing user ka profile bhi update ho jaye (sirf insert pe nahi)
    const setFields = {};
    if (req.headers["x-dev-name"]) setFields.name = req.headers["x-dev-name"];
    if (req.headers["x-dev-email"]) setFields.email = req.headers["x-dev-email"];
    if (req.headers["x-dev-phone"]) setFields.phone = req.headers["x-dev-phone"];
    if (req.headers["x-dev-photo"]) setFields.photoURL = req.headers["x-dev-photo"];

    if (Object.keys(setFields).length > 0) {
      updateData.$set = setFields;
    }

    const user = await User.findOneAndUpdate({ uid }, updateData, {
      new: true,
      upsert: true,
    });

    req.user = user;
    next();
  } catch (err) {
    console.error("Dev auth bypass error:", err);
    return res.status(500).json({
      success: false,
      message: "Auth bypass failed.",
    });
  }
};