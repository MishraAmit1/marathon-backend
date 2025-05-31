import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getEligibilityCriteria,
  createEligibilityCriteria,
  updateEligibilityCriteria,
  deleteEligibilityCriteria,
} from "../controllers/eligibility-criteria.js";

const router = express.Router();

router.get("/eligibility-criteria", getEligibilityCriteria);
router.post("/eligibility-criteria", verifyToken, createEligibilityCriteria);
router.put(
  "/eligibility-criteria/:criteriaId",
  verifyToken,
  updateEligibilityCriteria
);
router.delete(
  "/eligibility-criteria/:criteriaId",
  verifyToken,
  deleteEligibilityCriteria
);

export default router;
