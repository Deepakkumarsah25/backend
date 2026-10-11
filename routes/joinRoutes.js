import express from "express";
import upload from "../middlewar/upload.js";
import { protect } from "../middlewar/firebaseAuth.js";

import {
  applyForMembership,
  getMyApplicationStatus,
  getMyMembershipCard,
  getCardByMemberId,
  addMemberByAgent,
  getMyAddedMembers,
} from "../controllers/joinController.js";

const router = express.Router();

/*
  MEMBERSHIP APPLICATION (USER FLOW)
  Authentication required.
*/
router.post(
  "/apply",
  protect,
  upload.single("photo"),
  applyForMembership
);

/*
  STATUS CHECK
  Authentication required.
*/
router.get(
  "/my-status",
  protect,
  getMyApplicationStatus
);

router.get(
  "/status",
  protect,
  getMyApplicationStatus
);

/*
  MY APPROVED CARD
  Authentication required.
*/
router.get(
  "/my-card",
  protect,
  getMyMembershipCard
);

/*
  LOOKUP CARD BY MEMBER ID
*/
router.get(
  "/card/:memberId",
  getCardByMemberId
);

/*
  AGENT ROUTES (PRESERVED)
  Authentication required.
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

export default router;