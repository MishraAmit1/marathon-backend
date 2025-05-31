import { connectToDatabase } from "../config/database.js";

export const getAbout = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM about_us WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching about us:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createAbout = async (req, res) => {
  const {
    subheading,
    heading,
    description,
    button_text,
    button_link,
    image1_url,
    image2_url,
  } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can create." });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname;

    const [result] = await db.execute(
      `INSERT INTO about_us (subheading, heading, description, button_text, button_link, image1_url, image2_url, entry_by, entry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        subheading,
        heading,
        description,
        button_text,
        button_link,
        image1_url,
        image2_url,
        entry_by,
      ]
    );

    res.status(200).json({
      message: "About Us created successfully.",
      aboutId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating about us:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateAbout = async (req, res) => {
  const { aboutId } = req.params;
  const {
    subheading,
    heading,
    description,
    button_text,
    button_link,
    image1_url,
    image2_url,
  } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can update." });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname;

    const [result] = await db.execute(
      `UPDATE about_us SET subheading = ?, heading = ?, description = ?, button_text = ?, button_link = ?, image1_url = ?, image2_url = ?, update_by = ?, updated_date = NOW()
       WHERE about_id = ?`,
      [
        subheading,
        heading,
        description,
        button_text,
        button_link,
        image1_url,
        image2_url,
        update_by,
        aboutId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "About Us not found." });
    }

    res.status(200).json({ message: "About Us updated successfully." });
  } catch (error) {
    console.error("Error updating about us:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAbout = async (req, res) => {
  const { aboutId } = req.params;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can delete." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE about_us SET is_active = 0 WHERE about_id = ?`,
      [aboutId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "About Us not found." });
    }

    res.status(200).json({ message: "About Us deleted successfully." });
  } catch (error) {
    console.error("Error deleting about us:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOrganiser = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM about_organiser WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching about organiser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createOraganiser = async (req, res) => {
  const { heading, content, image1_url, image2_url } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can create." });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname;

    const [result] = await db.execute(
      `INSERT INTO about_organiser (heading, content, image1_url, image2_url, entry_by, entry_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [heading, content, image1_url, image2_url, entry_by]
    );

    res.status(200).json({
      message: "About Organiser created successfully.",
      organiserId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating about organiser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateOraganiser = async (req, res) => {
  const { organiserId } = req.params;
  const { heading, content, image1_url, image2_url } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can update." });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname;

    const [result] = await db.execute(
      `UPDATE about_organiser SET heading = ?, content = ?, image1_url = ?, image2_url = ?, update_by = ?, updated_date = NOW()
       WHERE organiser_id = ?`,
      [heading, content, image1_url, image2_url, update_by, organiserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "About Organiser not found." });
    }

    res.status(200).json({ message: "About Organiser updated successfully." });
  } catch (error) {
    console.error("Error updating about organiser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteOrganiser = async (req, res) => {
  const { organiserId } = req.params;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can delete." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE about_organiser SET is_active = 0 WHERE organiser_id = ?`,
      [organiserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "About Organiser not found." });
    }

    res.status(200).json({ message: "About Organiser deleted successfully." });
  } catch (error) {
    console.error("Error deleting about organiser:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
