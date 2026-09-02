import express from "express";

import {
  getAdminEvents,
  createEvent,
  getEditEvent,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
  getEventById,
} from "../../controllers/events/eventController.js";

import eventUpload from "../../middlewar/eventUpload.js";

const router = express.Router();

/* =========================
   ADMIN EVENTS
========================= */

router.get(
  "/admin/events",
  getAdminEvents
);

router.post(
  "/admin/events/create",
  eventUpload.array("images", 10),
  createEvent
);

router.get(
  "/admin/events/edit/:id",
  getEditEvent
);

router.post(
  "/admin/events/update/:id",
  eventUpload.array("images", 10),
  updateEvent
);

router.post(
  "/admin/events/delete/:id",
  deleteEvent
);

/* =========================
   MOBILE API
========================= */

router.get(
  "/api/events",
  getPublishedEvents
);

router.get(
  "/api/events/:id",
  getEventById
);

export default router;