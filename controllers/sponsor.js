import { connectToDatabase } from "../config/database.js";

export const createSponsor = async (req, res) => {
  const { sponsor_name, sponsor_description, website_url, is_active } =
    req.body;
  const sponsor_image = req.file
    ? `/uploads/sponsor_images/${req.file.filename}`
    : null;

  if (!sponsor_name) {
    return res.status(400).json({ message: "Sponsor name is required." });
  }

  try {
    const db = await connectToDatabase();
    const [userResult] = await db.execute(
      "SELECT fullname FROM userMaster WHERE id = ?",
      [req.user.id]
    );

    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    const entry_by = userResult[0].fullname;
    const activeStatus = is_active === "true" || is_active === true ? 1 : 0;

    const [result] = await db.execute(
      `INSERT INTO sponsor_master 
        (sponsor_name, sponsor_description, sponsor_image, website_url, is_active, entry_by, entry_date, updated_date, update_by)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [
        sponsor_name,
        sponsor_description || "No description provided",
        sponsor_image,
        website_url || null,
        activeStatus,
        entry_by,
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
    const [sponsors] = await db.execute("SELECT * FROM sponsor_master");
    res.status(200).json(sponsors);
  } catch (error) {
    console.error("Error fetching sponsors:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSponsorById = async (req, res) => {
  const { sponsorId } = req.params;

  try {
    const db = await connectToDatabase();
    const [sponsor] = await db.execute(
      "SELECT * FROM sponsor_master WHERE sponsor_id = ?",
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
  const { sponsorId } = req.params;
  const { sponsor_name, sponsor_description, website_url, is_active } =
    req.body;
  const sponsor_image = req.file
    ? `/uploads/sponsor_images/${req.file.filename}`
    : null;

  try {
    const db = await connectToDatabase();
    const [existingSponsor] = await db.execute(
      "SELECT * FROM sponsor_master WHERE sponsor_id = ?",
      [sponsorId]
    );

    if (existingSponsor.length === 0) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    const update_by = req.user.fullname;
    const activeStatus = is_active === "true" || is_active === true ? 1 : 0;
    const finalSponsorImage = sponsor_image || existingSponsor[0].sponsor_image;

    const [result] = await db.execute(
      `UPDATE sponsor_master 
        SET sponsor_name = ?, sponsor_description = ?, sponsor_image = ?, website_url = ?, 
            is_active = ?, update_by = ?, updated_date = NOW()
        WHERE sponsor_id = ?`,
      [
        sponsor_name,
        sponsor_description,
        finalSponsorImage,
        website_url,
        activeStatus,
        update_by,
        sponsorId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sponsor not found." });
    }

    res.status(200).json({
      message: "Sponsor updated successfullyy",
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
