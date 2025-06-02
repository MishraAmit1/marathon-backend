import express from "express";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import {
  createSponsor,
  getAllSponsors,
  getSponsorById,
  updateSponsor,
  deleteSponsor,
} from "../controllers/sponsor.js";
// Configure Multer for sponsor image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/sponsor_images/"); // Folder for sponsor images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, and .png files are allowed!"));
    }
  },
});
const router = express.Router();

router.post(
  "/create",
  verifyToken,
  upload.single("sponsor_image"),
  createSponsor
);
router.get("/all", verifyToken, getAllSponsors);
router.get("/:sponsorId", verifyToken, getSponsorById);
router.put(
  "/update/:sponsorId",
  verifyToken,
  upload.single("sponsor_image"),
  updateSponsor
);
router.delete("/delete/:sponsorId", verifyToken, deleteSponsor);

export default router;
