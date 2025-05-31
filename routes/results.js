import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { uploadExcel } from "../middleware/upload.js";
import {
  uploadResultsExcel,
  addResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
} from "../controllers/results.js";

const router = express.Router();

router.post(
  "/upload-excel",
  verifyToken,
  uploadExcel.single("excel"),
  uploadResultsExcel
);
router.post("/add", verifyToken, addResult);
router.get("/all", verifyToken, getAllResults);
router.get("/:resultId", verifyToken, getResultById);
router.put("/update/:resultId", verifyToken, updateResult);
router.delete("/delete/:resultId", verifyToken, deleteResult);

export default router;
