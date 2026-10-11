import express from "express";
import {
  createGrievance,
  getMyGrievances,
  getGrievanceById,
  renderGrievancesPage,
  getGrievancesData,
  getGrievanceDetail,
  updateGrievanceStatus,
  deleteGrievance,
} from "../../controllers/Grievance/Grievancecontroller.js";

// NOTE: import path/name yahan apne existing auth middleware ke hisab se
// confirm/adjust kar lena — yehi middleware jo /api/users/my-card route pe
// req.user is populated by the verified Firebase token middleware.
import { protect } from "../../middlewar/firebaseAuth.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

/*=======================================================
 * MOBILE APP ROUTER — mount at /api/grievances
 *======================================================*/
const grievanceRouter = express.Router();

grievanceRouter.post("/", protect, createGrievance);
grievanceRouter.get("/my", protect, getMyGrievances);
grievanceRouter.get("/:grievanceId", protect, getGrievanceById);

/*=======================================================
 * ADMIN PANEL ROUTER — mount at /grievances
 * (no `protect` here — admin panel auth, if any, is handled
 * the same way your other admin routes/sessions handle it)
 *======================================================*/
const adminGrievanceRouter = express.Router();
adminGrievanceRouter.use(requireAdmin);

adminGrievanceRouter.get("/", renderGrievancesPage);
adminGrievanceRouter.get("/data", getGrievancesData);
adminGrievanceRouter.get("/:id", getGrievanceDetail);
adminGrievanceRouter.patch("/:id/status", updateGrievanceStatus);
adminGrievanceRouter.delete("/:id", deleteGrievance);

export default grievanceRouter;
export { adminGrievanceRouter };
