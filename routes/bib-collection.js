import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getBibCollection,
  createBibCollection,
  updateBibCollection,
  deleteBibCollection,
} from "../controllers/bib-collection.js";

const router = express.Router();

router.get("/bib-collection", getBibCollection);
router.post("/bib-collection", verifyToken, createBibCollection);
router.put("/bib-collection/:bibId", verifyToken, updateBibCollection);
router.delete("/bib-collection/:bibId", verifyToken, deleteBibCollection);

export default router;
