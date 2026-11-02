import express from "express";

import {
 getDrivers,
 getDriverList,
 addDriver,
 deleteDriver
}
from "../../controllers/driverController.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";
const router = express.Router();

router.get("/driver", requireAdmin, getDrivers);
router.get(
 "/driverlist",
 requireAdmin,
 getDriverList
);
router.post("/driver/add",requireAdmin,addDriver);

router.get(
  "/driver/delete/:id",
  requireAdmin,
  deleteDriver
);

export default router;
