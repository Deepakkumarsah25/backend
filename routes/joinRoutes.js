// import express from "express";
// import { protect } from "../middlewar/firebaseAuth.js";
// import {
//   createJoinApplication,
//   getPrefillData,
// } from "../controllers/joinController.js";

// const router = express.Router();

// /*
//   Mounted in server.js as:
//     app.use("/api/join", joinRoutes);

//   So the final paths are:
//     POST /api/join/apply
//     GET  /api/join/prefill
// */

// router.post("/apply", protect, createJoinApplication);
// router.get("/prefill", protect, getPrefillData);

// export default router;
import express from "express";
import multer from "multer";
import { protect } from "../middlewar/firebaseAuth.js";
import {
  createJoinApplication,
  quickJoin,
  getPrefillData,
  getCardByMemberId,
} from "../controllers/joinController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Quick Join sends photo as FormData

/*
  Mounted in server.js as:
    app.use("/api/join", joinRoutes);

  Final paths:
    POST /api/join/quick         -> no login
    POST /api/join/apply         -> login required
    GET  /api/join/prefill       -> login required
    GET  /api/join/card/:id      -> no login
*/

router.post("/quick", upload.single("photo"), quickJoin);
router.post("/apply", protect, createJoinApplication);
router.get("/prefill", protect, getPrefillData);
router.get("/card/:memberId", getCardByMemberId);

export default router;