// import express from "express";
// import User from "../models/User.js";
// import { protect } from "../middlewar/firebaseAuth.js";
// import Join from "../models/joinmodel.js";
// const router = express.Router();

// router.post("/save-user", async (req, res) => {
//   try {
//     const data = req.body;

//     let user = await User.findOne({
//       uid: data.uid,
//     });

//     if (!user) {
//       user = await User.create(data);
//     }

//     res.json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// });

// router.get("/me", protect, async (req, res) => {
//   try {
//     const membership = await Join.findOne({
//       userId: req.user._id,
//     }).lean();

//     res.json({
//       success: true,
//       user: {
//         id: req.user._id,
//         uid: req.user.uid,
//         name: req.user.name,
//         email: req.user.email,
//         phone: req.user.phone,
//         photoURL: req.user.photoURL,

//         membership: membership
//           ? {
//               exists: true,
//               memberId: membership.memberId,
//               mode: membership.mode,
//               type: membership.type,
//             }
//           : {
//               exists: false,
//             },
//       },
//     });
//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });
// export default router;


import express from "express";
import { protect } from "../middlewar/firebaseAuth.js";
import Join from "../models/joinmodel.js";
const router = express.Router();

router.post("/save-user", protect, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const membership = await Join.findOne({
      userId: req.user._id,
    }).lean();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        photoURL: req.user.photoURL,
        isAgent: req.user.isAgent || false,

        membership: membership
          ? {
              exists: true,
              memberId: membership.memberId,
              mode: membership.mode,
              type: membership.type,
            }
          : {
              exists: false,
            },
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
export default router;
