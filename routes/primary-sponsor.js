import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { uploadSponsorImage } from "../middleware/upload.js";
import {
  createSponsor,
  getAllSponsors,
  getSponsorById,
  updateSponsor,
  deleteSponsor,
} from "../controllers/sponsor.js";

const router = express.Router();

router.post(
  "/create",
  verifyToken,
  uploadSponsorImage.single("sponsor_image"),
  createSponsor
);
router.get("/all", verifyToken, getAllSponsors);
router.get("/:sponsorId", verifyToken, getSponsorById);
router.put(
  "/update/:sponsorId",
  verifyToken,
  uploadSponsorImage.single("sponsor_image"),
  updateSponsor
);
router.delete("/delete/:sponsorId", verifyToken, deleteSponsor);

export default router;
