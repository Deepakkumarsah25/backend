import express from "express";

import {
 getDrivers,
 getDriverList,
 addDriver,
 deleteDriver
}
from "../../controllers/driverController.js";
const router = express.Router();

router.get("/driver",getDrivers);
router.get(
 "/driverlist",
 getDriverList
);
router.post("/driver/add",addDriver);

router.get(
  "/driver/delete/:id",
  deleteDriver
);

export default router;