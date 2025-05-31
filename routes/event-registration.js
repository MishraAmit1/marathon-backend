import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createRegistration,
  getAllRegistrations,
  getMyRegistrations,
  getRegistrationById,
  updateRegistration,
  deleteRegistration,
} from "../controllers/event-registration.js";

const router = express.Router();

router.post("/register", verifyToken, createRegistration);
router.get("/all-registrations", verifyToken, getAllRegistrations);
router.get("/my-registrations", verifyToken, getMyRegistrations);
router.get("/:registrationId", verifyToken, getRegistrationById);
router.put("/update/:registrationId", verifyToken, updateRegistration);
router.delete("/delete/:registrationId", verifyToken, deleteRegistration);

export default router;
