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
  ADD MEMBER
  Firebase authentication required.
*/
router.post(
  "/add-member",
  protect,
  upload.single("photo"),
  addMemberByAgent
);


  // MY ADDED MEMBERS

router.get(
  "/my-added-members",
  protect,
  getMyAddedMembers
);


router.get(
  "/card/:memberId",
  protect,
  getCardByMemberId
);


export default router;