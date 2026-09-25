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

import eventUpload, { validateEventUploads } from "../../middlewar/eventUpload.js";
import { requireAdmin } from "../../middlewar/requireAdmin.js";

const router = express.Router();

/* =========================
   ADMIN EVENTS
========================= */

router.get(
  "/admin/events",
  requireAdmin,
  getAdminEvents
);

router.post(
  "/admin/events/create",
  requireAdmin,
  eventUpload.array("images", 10),
  validateEventUploads,
  createEvent
);

router.get(
  "/admin/events/edit/:id",
  requireAdmin,
  getEditEvent
);

router.post(
  "/admin/events/update/:id",
  requireAdmin,
  eventUpload.array("images", 10),
  validateEventUploads,
  updateEvent
);

router.post(
  "/admin/events/delete/:id",
  requireAdmin,
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
