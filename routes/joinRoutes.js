
// // // import express from "express";
// // // import upload from "../middlewar/upload.js";
// // // import { protect } from "../middlewar/firebaseAuth.js";
// // // import { optionalAuth } from "../middlewar/optionalAuth.js";
// // // import { requireAgent } from "../middlewar/requireAgent.js";
// // // import {
// // //   quickJoin,
// // //   associateGuestCard,
// // //   addMemberByAgent,
// // //   getMyAddedMembers,
// // //   getCardByMemberId,
// // //   getMyMembershipCard,
// // // } from "../controllers/joinController.js";

// // // const router = express.Router();

// // // /*
// // //   Mounted in server.js as:
// // //     app.use("/api/join", joinRoutes);

// // //   Final paths:
// // //     POST /api/join/quick            (guest or logged-in — one card per account/number)
// // //     POST /api/join/associate        (link a locally-saved guest card to the logged-in account)
// // //     POST /api/join/add-member       (agent only)
// // //     GET  /api/join/my-added-members (agent only)
// // //     GET  /api/join/my-card          (logged-in user, fetched fresh every time)
// // //     GET  /api/join/card/:memberId   (public lookup by memberId)
// // // */

// // // router.post("/quick", optionalAuth, upload.single("photo"), quickJoin);

// // // router.post("/associate", protect, associateGuestCard);

// // // router.post(
// // //   "/add-member",
// // //   protect,
// // //   requireAgent,
// // //   upload.single("photo"),
// // //   addMemberByAgent
// // // );

// // // router.get("/my-added-members", protect, requireAgent, getMyAddedMembers);

// // // router.get("/my-card", protect, getMyMembershipCard);

// // // router.get("/card/:memberId", getCardByMemberId);

// // // export default router;

// // import express from "express";
// // import upload from "../middlewar/upload.js";
// // import { protect } from "../middlewar/firebaseAuth.js";
// // import { optionalAuth } from "../middlewar/optionalAuth.js";
// // import { requireAgent } from "../middlewar/requireAgent.js";
// // import {
// //   quickJoin,
// //   addMemberByAgent,
// //   getMyAddedMembers,
// //   getCardByMemberId,
// //   getMyMembershipCard,
// // } from "../controllers/joinController.js";

// // const router = express.Router();

// // /*
// //   Mounted in server.js as:
// //     app.use("/api/join", joinRoutes);

// //   Final paths:
// //     POST /api/join/quick            (guest or logged-in — one card per account/number)
// //     POST /api/join/add-member       (agent only)
// //     GET  /api/join/my-added-members (agent only)
// //     GET  /api/join/my-card          (logged-in user, fetched fresh every time)
// //     GET  /api/join/card/:memberId   (public lookup by memberId)
// // */

// // router.post("/quick", optionalAuth, upload.single("photo"), quickJoin);

// // router.post(
// //   "/add-member",
// //   protect,
// //   requireAgent,
// //   upload.single("photo"),
// //   addMemberByAgent
// // );

// // router.get("/my-added-members", protect, requireAgent, getMyAddedMembers);

// // router.get("/my-card", protect, getMyMembershipCard);

// // router.get("/card/:memberId", getCardByMemberId);

// // export default router;
// import express from "express";
// import upload from "../middlewar/upload.js";
// import { protect } from "../middlewar/firebaseAuth.js";
// import { optionalAuth } from "../middlewar/optionalAuth.js";
// import {
//   quickJoin,
//   addMemberByAgent,
//   getMyAddedMembers,
//   getCardByMemberId,
//   getMyMembershipCard,
//   updateMyCard,
// } from "../controllers/joinController.js";

// const router = express.Router();

// /*
//   Mounted in server.js as:
//     app.use("/api/join", joinRoutes);

//   Final paths:
//     POST  /api/join/quick             (guest or logged-in — one card per account/number)
//     POST  /api/join/add-member        (any logged-in user — 5-member limit unless isAgent)
//     GET   /api/join/my-added-members  (any logged-in user — scoped to their own additions)
//     GET   /api/join/my-card           (logged-in user, fetched fresh every time)
//     PATCH /api/join/my-card           (logged-in user, complete/edit a skipped card)
//     GET   /api/join/card/:memberId    (public lookup by memberId)
// */

// router.post("/quick", optionalAuth, upload.single("photo"), quickJoin);

// router.post("/add-member", protect, upload.single("photo"), addMemberByAgent);
// router.get("/my-added-members", protect, getMyAddedMembers);

// router.get("/my-card", protect, getMyMembershipCard);
// router.patch("/my-card", protect, upload.single("photo"), updateMyCard);

// router.get("/card/:memberId", getCardByMemberId);

// export default router;

import express from "express";
import upload from "../middlewar/upload.js";
import { protect } from "../middlewar/firebaseAuth.js";
import {
  addMemberByAgent,
  getMyAddedMembers,
  getCardByMemberId,
} from "../controllers/joinController.js";

const router = express.Router();

/*
  Mounted in server.js as:
    app.use("/api/join", joinRoutes);

  Final paths:
    POST  /api/join/add-member        (any logged-in user — 5-member limit unless isAgent)
    GET   /api/join/my-added-members  (any logged-in user — scoped to their own additions)
    GET   /api/join/card/:memberId    (public lookup — added members only)
*/

router.post("/add-member", protect, upload.single("photo"), addMemberByAgent);
router.get("/my-added-members", protect, getMyAddedMembers);
router.get("/card/:memberId", getCardByMemberId);

export default router;