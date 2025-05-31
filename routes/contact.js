import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  submitContactForm,
  getAllSubmissions,
  deleteSubmission,
  getContactInfo,
  updateContactInfo,
  getTotalSubmissions,
} from "../controllers/contact.js";

const router = express.Router();

router.post("/submit", verifyToken, submitContactForm);
router.get("/all", verifyToken, getAllSubmissions);
router.delete("/delete/:submissionId", verifyToken, deleteSubmission);
router.get("/info", getContactInfo);
router.put("/update/:infoId", verifyToken, updateContactInfo);
router.get("/total", verifyToken, getTotalSubmissions);

export default router;
