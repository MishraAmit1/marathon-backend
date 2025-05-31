import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getMarathonHub,
  createMarathonHub,
  updateMarathonHub,
  deleteMarathonHub,
} from "../controllers/marathon-hub.js";

const router = express.Router();

router.get("/marathon-hub", getMarathonHub);
router.post("/marathon-hub", verifyToken, createMarathonHub);
router.put("/marathon-hub/:hubId", verifyToken, updateMarathonHub);
router.delete("/marathon-hub/:hubId", verifyToken, deleteMarathonHub);

export default router;
