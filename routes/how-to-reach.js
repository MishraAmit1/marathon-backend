import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getHowToReach,
  createHowToReach,
  updateHowToReach,
  deleteHowToReach,
} from "../controllers/how-to-reach.js";

const router = express.Router();

router.get("/how-to-reach", getHowToReach);
router.post("/how-to-reach", verifyToken, createHowToReach);
router.put("/how-to-reach/:reachId", verifyToken, updateHowToReach);
router.delete("/how-to-reach/:reachId", verifyToken, deleteHowToReach);

export default router;
