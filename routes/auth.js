import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  login,
  changePassword,
  signup,
  totalUsers,
  adminInvite,
  users,
  getParticularUser,
  updateUser,
  deleteUser,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/admin/invite", verifyToken, adminInvite);
router.post("/login", login);
router.get("/total-users", totalUsers);
router.get("/users", users);
router.get("/users/:id", getParticularUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/change-password", verifyToken, changePassword);

export default router;
