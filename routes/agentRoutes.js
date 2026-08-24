import express from "express";
import { protect } from "../middlewar/firebaseAuth.js";
import { requestAgentVerification } from "../controllers/agentController.js";

const router = express.Router();

/*
  Mounted in server.js as:
    app.use("/api/agent", agentRoutes);

  Final paths:
    POST /api/agent/request-verification   (logged-in user asks to become an agent)
*/

router.post("/request-verification", protect, requestAgentVerification);

export default router;