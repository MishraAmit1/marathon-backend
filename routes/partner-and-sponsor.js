import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getPartnerAndSponsor,
  createPartnerAndSponsor,
  updatePartnerAndSponsor,
  deletePartnerAndSponsor,
} from "../controllers/partner-and-sponsor.js";

const router = express.Router();

router.get("/partner-and-sponsor", getPartnerAndSponsor);
router.post("/partner-and-sponsor", verifyToken, createPartnerAndSponsor);
router.put(
  "/partner-and-sponsor/:partnerId",
  verifyToken,
  updatePartnerAndSponsor
);
router.delete(
  "/partner-and-sponsor/:partnerId",
  verifyToken,
  deletePartnerAndSponsor
);

export default router;
