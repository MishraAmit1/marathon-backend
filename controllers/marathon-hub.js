import { connectToDatabase } from "../config/database.js";

const validateURL = (url) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return urlRegex.test(url);
};

const validateMarathonHubFields = (fields) => {
  const {
    header_image,
    heading,
    location_title,
    location_details,
    timings_title,
    timings_text,
    image_url,
  } = fields;
  if (
    !header_image ||
    !heading ||
    !location_title ||
    !location_details ||
    !timings_title ||
    !timings_text ||
    !image_url
  ) {
    return "All fields are required.";
  }
  if (!validateURL(header_image)) {
    return "Header image must be a valid URL.";
  }
  if (!validateURL(image_url)) {
    return "Image URL must be a valid URL.";
  }
  if (heading.length < 3 || heading.length > 100) {
    return "Heading must be between 3 and 100 characters.";
  }
  if (location_title.length < 3 || location_title.length > 100) {
    return "Location title must be between 3 and 100 characters.";
  }
  if (location_details.length < 10 || location_details.length > 1000) {
    return "Location details must be between 10 and 1000 characters.";
  }
  if (timings_title.length < 3 || timings_title.length > 100) {
    return "Timings title must be between 3 and 100 characters.";
  }
  if (timings_text.length < 10 || timings_text.length > 1000) {
    return "Timings text must be between 10 and 1000 characters.";
  }
  return null;
};

export const getMarathonHub = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM marathon_hub WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching marathon hub:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createMarathonHub = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can create marathon hub content." });
  }

  const {
    header_image,
    heading,
    location_title,
    location_details,
    timings_title,
    timings_text,
    image_url,
  } = req.body;

  const validationError = validateMarathonHubFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname || "unknown";

    const [result] = await db.execute(
      `INSERT INTO marathon_hub (header_image, heading, location_title, location_details, timings_title, timings_text, image_url, entry_by, entry_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [
        header_image,
        heading,
        location_title,
        location_details,
        timings_title,
        timings_text,
        image_url,
        entry_by,
      ]
    );

    res.status(201).json({
      message: "Marathon Hub created successfully.",
      hubId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating marathon hub:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateMarathonHub = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can update marathon hub content." });
  }

  const { hubId } = req.params;
  const {
    header_image,
    heading,
    location_title,
    location_details,
    timings_title,
    timings_text,
    image_url,
  } = req.body;

  const validationError = validateMarathonHubFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname || "unknown";

    const [result] = await db.execute(
      `UPDATE marathon_hub 
       SET header_image = ?, heading = ?, location_title = ?, location_details = ?, timings_title = ?, timings_text = ?, image_url = ?, update_by = ?, updated_date = NOW()
       WHERE hub_id = ? AND is_active = 1`,
      [
        header_image,
        heading,
        location_title,
        location_details,
        timings_title,
        timings_text,
        image_url,
        update_by,
        hubId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Marathon Hub not found." });
    }

    res.status(200).json({ message: "Marathon Hub updated successfully." });
  } catch (error) {
    console.error("Error updating marathon hub:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteMarathonHub = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can delete marathon hub content." });
  }

  const { hubId } = req.params;

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE marathon_hub SET is_active = 0 WHERE hub_id = ?`,
      [hubId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Marathon Hub not found." });
    }

    res.status(200).json({ message: "Marathon Hub deleted successfully." });
  } catch (error) {
    console.error("Error deleting marathon hub:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
