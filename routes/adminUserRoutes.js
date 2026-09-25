import express from "express";
import { requireAdmin } from "../middlewar/requireAdmin.js";
import {
  renderUsersAdminPage,
  toggleAgentStatus,
  approveAgentRequest,
  rejectAgentRequest,
} from "../controllers/adminUserController.js";

const router = express.Router();

/*
  Mount in server.js as:
    app.use("/", adminUserRoutes);

  Final paths:
    GET  /AdminAgent                          -> list + search
    POST /AdminAgent/:id/toggle-agent          -> flip isAgent, redirect back
    POST /AdminAgent/:id/approve-request       -> approve pending agent request
    POST /AdminAgent/:id/reject-request        -> reject pending agent request

  NOTE: no auth guard right now — same as before. If this sits behind
  something (IP allowlist, login wall, etc.), add the same protection here.
*/

router.get("/AdminAgent", requireAdmin, renderUsersAdminPage);
router.post("/AdminAgent/:id/toggle-agent", requireAdmin, toggleAgentStatus);
router.post("/AdminAgent/:id/approve-request", requireAdmin, approveAgentRequest);
router.post("/AdminAgent/:id/reject-request", requireAdmin, rejectAgentRequest);

export default router;
