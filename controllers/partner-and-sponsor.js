import { connectToDatabase } from "../config/database.js";

const validateURL = (url) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return urlRegex.test(url);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePartnerAndSponsorFields = (fields) => {
  const {
    header_image,
    heading,
    partners_title,
    partners_text,
    sponsorship_title,
    sponsorship_text,
    contact_title,
    contact_email,
    image_url,
  } = fields;
  if (
    !header_image ||
    !heading ||
    !partners_title ||
    !partners_text ||
    !sponsorship_title ||
    !sponsorship_text ||
    !contact_title ||
    !contact_email ||
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
  if (!validateEmail(contact_email)) {
    return "Contact email must be a valid email address.";
  }
  if (heading.length < 3 || heading.length > 100) {
    return "Heading must be between 3 and 100 characters.";
  }
  if (partners_title.length < 3 || partners_title.length > 100) {
    return "Partners title must be between 3 and 100 characters.";
  }
  if (partners_text.length < 10 || partners_text.length > 1000) {
    return "Partners text must be between 10 and 1000 characters.";
  }
  if (sponsorship_title.length < 3 || sponsorship_title.length > 100) {
    return "Sponsorship title must be between 3 and 100 characters.";
  }
  if (sponsorship_text.length < 10 || sponsorship_text.length > 1000) {
    return "Sponsorship text must be between 10 and 1000 characters.";
  }
  if (contact_title.length < 3 || contact_title.length > 100) {
    return "Contact title must be between 3 and 100 characters.";
  }
  return null;
};

export const getPartnerAndSponsor = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM partner_and_sponsor WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching partner and sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createPartnerAndSponsor = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can create partner and sponsor content." });
  }

  const {
    header_image,
    heading,
    partners_title,
    partners_text,
    sponsorship_title,
    sponsorship_text,
    contact_title,
    contact_email,
    image_url,
  } = req.body;

  const validationError = validatePartnerAndSponsorFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname || "unknown";

    const [result] = await db.execute(
      `INSERT INTO partner_and_sponsor (header_image, heading, partners_title, partners_text, sponsorship_title, sponsorship_text, contact_title, contact_email, image_url, entry_by, entry_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [
        header_image,
        heading,
        partners_title,
        partners_text,
        sponsorship_title,
        sponsorship_text,
        contact_title,
        contact_email,
        image_url,
        entry_by,
      ]
    );

    res.status(201).json({
      message: "Partner and Sponsor created successfully.",
      partnerId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating partner and sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePartnerAndSponsor = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can update partner and sponsor content." });
  }

  const { partnerId } = req.params;
  const {
    header_image,
    heading,
    partners_title,
    partners_text,
    sponsorship_title,
    sponsorship_text,
    contact_title,
    contact_email,
    image_url,
  } = req.body;

  const validationError = validatePartnerAndSponsorFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname || "unknown";

    const [result] = await db.execute(
      `UPDATE partner_and_sponsor 
       SET header_image = ?, heading = ?, partners_title = ?, partners_text = ?, sponsorship_title = ?, sponsorship_text = ?, contact_title = ?, contact_email = ?, image_url = ?, update_by = ?, updated_date = NOW()
       WHERE partner_id = ? AND is_active = 1`,
      [
        header_image,
        heading,
        partners_title,
        partners_text,
        sponsorship_title,
        sponsorship_text,
        contact_title,
        contact_email,
        image_url,
        update_by,
        partnerId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Partner and Sponsor not found." });
    }

    res
      .status(200)
      .json({ message: "Partner and Sponsor updated successfully." });
  } catch (error) {
    console.error("Error updating partner and sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePartnerAndSponsor = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can delete partner and sponsor content." });
  }

  const { partnerId } = req.params;

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE partner_and_sponsor SET is_active = 0 WHERE partner_id = ?`,
      [partnerId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Partner and Sponsor not found." });
    }

    res
      .status(200)
      .json({ message: "Partner and Sponsor deleted successfully." });
  } catch (error) {
    console.error("Error deleting partner and sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
