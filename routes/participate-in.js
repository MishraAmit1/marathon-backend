import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createParticipateIn,
  getAllParticipateIn,
  updateParticipateIn,
  deleteParticipateIn,
  getEntriesByCategory,
  getDropdownData,
} from "../controllers/participate-in.js";

const router = express.Router();

router.post("/create", verifyToken, createParticipateIn);
router.get("/all", verifyToken, getAllParticipateIn);
router.put("/update/:id", verifyToken, updateParticipateIn);
router.delete("/delete/:participateinId", verifyToken, deleteParticipateIn);
router.get("/entries/:categoryId", verifyToken, getEntriesByCategory);
router.get("/dropdown-data", verifyToken, getDropdownData);

export default router;
