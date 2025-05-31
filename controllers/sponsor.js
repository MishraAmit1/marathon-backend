import { connectToDatabase } from "../config/database.js";

const validateURL = (url) => {
  if (!url) return true;
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return urlRegex.test(url);
};

const validateSponsorFields = (fields) => {
  const { sponsor_name, sponsor_description, website_url, is_active } = fields;
  if (!sponsor_name || sponsor_name.length < 3) {
    return "Sponsor name is required and must be at least 3 characters.";
  }
  if (sponsor_description && sponsor_description.length > 1000) {
    return "Sponsor description cannot exceed 1000 characters.";
  }
  if (website_url && !validateURL(website_url)) {
    return "Website URL must be a valid URL.";
  }
  if (
    is_active !== undefined &&
    ![true, false, "true", "false", 0, 1].includes(is_active)
  ) {
    return "is_active must be a boolean or 0/1.";
  }
  return null;
};

export const createSponsor = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can create sponsors." });
  }

  const { sponsor_name, sponsor_description, website_url, is_active } =
    req.body;
  const sponsor_image = req.file
    ? `/uploads/sponsor_images/${req.file.filename}`
    : null;

  const validationError = validateSponsorFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const [userResult] = await db.execute(
      "SELECT fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    const entry_by = userResult[0].fullname || "unknown";
    const activeStatus =
      is_active === "true" || is_active === true || is_active === 1 ? 1 : 0;

    const [result] = await db.execute(
      `INSERT INTO sponsor_master 
       (sponsor_name, sponsor_description, sponsor_image, website_url, is_active, entry_by, entry_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        sponsor_name,
        sponsor_description || "No description provided",
        sponsor_image,
        website_url || null,
        activeStatus,
        entry_by,
      ]
    );

    res.status(201).json({
      message: "Sponsor created successfully",
      sponsorId: result.insertId,
      sponsorImage: sponsor_image,
    });
  } catch (error) {
    console.error("Error creating sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllSponsors = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [sponsors] = await db.execute(
      "SELECT * FROM sponsor_master WHERE is_active = 1"
    );
    res.status(200).json(sponsors);
  } catch (error) {
    console.error("Error fetching sponsors:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSponsorById = async (req, res) => {
  const { sponsorId } = req.params;

  if (!sponsorId || isNaN(sponsorId)) {
    return res.status(400).json({ message: "Invalid sponsor ID." });
  }

  try {
    const db = await connectToDatabase();
    const [sponsor] = await db.execute(
      "SELECT * FROM sponsor_master WHERE sponsor_id = ? AND is_active = 1",
      [sponsorId]
    );

    if (sponsor.length === 0) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    res.status(200).json(sponsor[0]);
  } catch (error) {
    console.error("Error fetching sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSponsor = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can update sponsors." });
  }

  const { sponsorId } = req.params;
  const { sponsor_name, sponsor_description, website_url, is_active } =
    req.body;
  const sponsor_image = req.file
    ? `/uploads/sponsor_images/${req.file.filename}`
    : null;

  if (!sponsorId || isNaN(sponsorId)) {
    return res.status(400).json({ message: "Invalid sponsor ID." });
  }

  const validationError = validateSponsorFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const [existingSponsor] = await db.execute(
      "SELECT sponsor_image FROM sponsor_master WHERE sponsor_id = ? AND is_active = 1",
      [sponsorId]
    );
    if (existingSponsor.length === 0) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    const update_by = req.user.fullname || "unknown";
    const activeStatus =
      is_active === "true" || is_active === true || is_active === 1 ? 1 : 0;
    const finalSponsorImage = sponsor_image || existingSponsor[0].sponsor_image;

    const [result] = await db.execute(
      `UPDATE sponsor_master 
       SET sponsor_name = ?, sponsor_description = ?, sponsor_image = ?, website_url = ?, 
           is_active = ?, update_by = ?, updated_date = NOW()
       WHERE sponsor_id = ? AND is_active = 1`,
      [
        sponsor_name,
        sponsor_description || "No description provided",
        finalSponsorImage,
        website_url || null,
        activeStatus,
        update_by,
        sponsorId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    res.status(200).json({
      message: "Sponsor updated successfully",
      sponsorImage: finalSponsorImage,
    });
  } catch (error) {
    console.error("Error updating sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSponsor = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can delete sponsors." });
  }

  const { sponsorId } = req.params;

  if (!sponsorId || isNaN(sponsorId)) {
    return res.status(400).json({ message: "Invalid sponsor ID." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "UPDATE sponsor_master SET is_active = 0 WHERE sponsor_id = ?",
      [sponsorId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    res.status(200).json({ message: "Sponsor deleted successfully." });
  } catch (error) {
    console.error("Error deleting sponsor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
