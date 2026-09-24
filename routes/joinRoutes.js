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

    POST /api/join/add-member
    GET  /api/join/my-added-members
    GET  /api/join/card/:memberId
*/

router.post(
  "/add-member",
  protect,
  upload.single("photo"),
  addMemberByAgent
);

router.get(
  "/my-added-members",
  protect,
  getMyAddedMembers
);

router.get(
  "/card/:memberId",
  getCardByMemberId
);

export default router;