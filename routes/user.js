import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getTotalUsers,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.js";

const router = express.Router();

router.get("/total-users", verifyToken, getTotalUsers);
router.get("/users", verifyToken, getAllUsers);
router.get("/users/:id", verifyToken, getUserById);
router.put("/users/:id", verifyToken, updateUser);
router.delete("/users/:id", verifyToken, deleteUser);

export default router;
