import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getGallery,
  createGallery,
  updateGallery,
  deleteGallery,
} from "../controllers/gallery.js";

const router = express.Router();

router.get("/gallery", getGallery);
router.post("/gallery", verifyToken, createGallery);
router.put("/gallery/:galleryId", verifyToken, updateGallery);
router.delete("/gallery/:galleryId", verifyToken, deleteGallery);

export default router;
