import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getAbout,
  createAbout,
  updateAbout,
  deleteAbout,
  getOrganiser,
  createOraganiser,
  updateOraganiser,
  deleteOrganiser,
} from "../controllers/about.js";

const router = express.Router();

router.get("/about-us", getAbout);
router.post("/about-us", verifyToken, createAbout);
router.put("/about-us/:aboutId", verifyToken, updateAbout);
router.delete("/about-us/:aboutId", verifyToken, deleteAbout);
router.get("/about-organiser", verifyToken, getOrganiser);
router.post("/about-organiser", verifyToken, createOraganiser);
router.put("/about-organiser/:organiserId", verifyToken, updateOraganiser);
router.delete("/about-organiser/:organiserId", verifyToken, deleteOrganiser);

export default router;
