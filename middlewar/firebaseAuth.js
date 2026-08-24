// import User from "../models/User.js";
// export const protect = async (req, res, next) => {
//   try {
//     const uid = req.headers["x-dev-uid"];

//     if (!uid) {
//       return res.status(401).json({
//         success: false,
//         message: "No uid provided (dev bypass mode).",
//       });
//     }

//     // findOne + create ki jagah atomic upsert — race condition fix
// const updateData = { $setOnInsert: { uid } };

//     // Agar headers me actual profile data mila hai, to use $set karo taaki
//     // existing user ka profile bhi update ho jaye (sirf insert pe nahi)
//     const setFields = {};
//     if (req.headers["x-dev-name"]) setFields.name = req.headers["x-dev-name"];
//     if (req.headers["x-dev-email"]) setFields.email = req.headers["x-dev-email"];
//     if (req.headers["x-dev-phone"]) setFields.phone = req.headers["x-dev-phone"];
//     if (req.headers["x-dev-photo"]) setFields.photoURL = req.headers["x-dev-photo"];

//     if (Object.keys(setFields).length > 0) {
//       updateData.$set = setFields;
//     }

//     const user = await User.findOneAndUpdate({ uid }, updateData, {
//       new: true,
//       upsert: true,
//     });

//     req.user = user;
//     next();
//   } catch (err) {
//     console.error("Dev auth bypass error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Auth bypass failed.",
//     });
//   }
// };


import User from "../models/User.js";

/*
  DEV BYPASS — no real token verification.
  Frontend sends the logged-in user's uid (and optionally
  name/email/phone/photo) as plain headers instead of a
  verified Firebase ID token.

  TODO (later): swap this for real Firebase ID token
  verification once FIREBASE_PRIVATE_KEY_B64 is sorted —
  see firebaseAuth.js version from earlier in this chat.
*/
export const protect = async (req, res, next) => {
  try {
    const uid = req.headers["x-dev-uid"];

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: "No uid provided (dev bypass mode).",
      });
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

let user;
    try {
      user = await User.findOneAndUpdate({ uid }, updateData, {
        new: true,
        upsert: true,
      });
    } catch (upsertErr) {
      // Two near-simultaneous first-time requests for the same uid can
      // both try to insert -> MongoDB E11000 duplicate key on the loser.
      // The winner's doc now exists, so just fetch it instead of failing.
      if (upsertErr.code === 11000) {
        user = await User.findOne({ uid });
      } else {
        throw upsertErr;
      }
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "Could not resolve user.",
      });
    }

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