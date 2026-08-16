import express from "express";

import {
  getRoutePage,
  addRoute,
  deleteRoute,
} from "../../controllers/route/routeController.js";

const router = express.Router();

router.get("/route", getRoutePage);

router.post("/route/add", addRoute);

router.get("/route/delete/:id", deleteRoute);

export default router;