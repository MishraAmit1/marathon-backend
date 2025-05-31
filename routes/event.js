import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { uploadEventImage } from "../middleware/upload.js";
import {
  createEvent,
  getAllEvents,
  updateEvent,
  getEventById,
  deleteEvent,
  getEventTypes,
  getEventsByType,
  getTotalEvents,
  getActiveEvents,
} from "../controllers/event.js";

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  uploadEventImage.single("event_image"),
  createEvent
);
router.get("/all", verifyToken, getAllEvents);
router.put(
  "/update/:eventId",
  verifyToken,
  uploadEventImage.single("event_image"),
  updateEvent
);
router.get("/event/:eventId", verifyToken, getEventById);
router.delete("/delete/:eventId", verifyToken, deleteEvent);
router.get("/eventTypes", verifyToken, getEventTypes);
router.get("/events/:eventType", verifyToken, getEventsByType);
router.get("/total", verifyToken, getTotalEvents);
router.get("/active", verifyToken, getActiveEvents);

export default router;
