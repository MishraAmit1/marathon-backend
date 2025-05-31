import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import eventRoutes from "./routes/event.js";
import categoryRoutes from "./routes/category.js";
import eventRegistrationRoutes from "./routes/event-registration.js";
import participateInRoutes from "./routes/participate-in.js";
import primarySponsorRoutes from "./routes/primary-sponsor.js";
import contactRoutes from "./routes/contact.js";
import faqRoutes from "./routes/faq.js";
import aboutRoutes from "./routes/about.js";
import resultsRoutes from "./routes/results.js";
import howToReachRoutes from "./routes/how-to-reach.js";
import marathonHubRoutes from "./routes/marathon-hub.js";
import bibCollectionRoutes from "./routes/bib-collection.js";
import partnerAndSponsorRoutes from "./routes/partner-and-sponsor.js";
import galleryRoutes from "./routes/gallery.js";
import eligibilityCriteriaRoutes from "./routes/eligibility-criteria.js";

dotenv.config();

const app = express();

// Validate environment variables
if (!process.env.PORT) {
  console.error("PORT environment variable is not defined.");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/event", eventRoutes);
app.use("/category", categoryRoutes);
app.use("/event-registration", eventRegistrationRoutes);
app.use("/participatein", participateInRoutes);
app.use("/sponsor", primarySponsorRoutes);
app.use("/contact", contactRoutes);
app.use("/faq", faqRoutes);
app.use("/about", aboutRoutes);
app.use("/results", resultsRoutes);
app.use("/how-to-reach", howToReachRoutes);
app.use("/marathon-hub", marathonHubRoutes);
app.use("/bib-collection", bibCollectionRoutes);
app.use("/partner-and-sponsor", partnerAndSponsorRoutes);
app.use("/gallery", galleryRoutes);
app.use("/eligibility-criteria", eligibilityCriteriaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);

  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ message: `File upload error: ${err.message}` });
  }

  if (err.message.includes("Only")) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
