import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from "../controllers/faq.js";

const router = express.Router();

router.get("/all", getAllFAQs);
router.post("/create", verifyToken, createFAQ);
router.put("/update/:faqId", verifyToken, updateFAQ);
router.delete("/delete/:faqId", verifyToken, deleteFAQ);

export default router;
