import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createCategory,
  getAllCategories,
  getCategoriesByEventType,
  getCategoriesByEventId,
  getEventTypes,
  getEventsByEventType,
  updateCategory,
  getCategoryById,
  deleteCategory,
} from "../controllers/category.js";

const router = express.Router();

router.post("/create", verifyToken, createCategory);
router.get("/all", verifyToken, getAllCategories);
router.get("/categories/:eventType", verifyToken, getCategoriesByEventType);
router.get("/event/:eventId", verifyToken, getCategoriesByEventId);
router.get("/event-types", getEventTypes);
router.get("/events/:eventType", getEventsByEventType);
router.put("/update/:categoryId", verifyToken, updateCategory);
router.get("/category/:categoryId", verifyToken, getCategoryById);
router.delete("/delete/:categoryId", verifyToken, deleteCategory);

export default router;
