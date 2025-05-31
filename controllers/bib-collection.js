import { connectToDatabase } from "../config/database.js";

export const getBibCollection = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM bib_collection WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching bib collection:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createBibCollection = async (req, res) => {
  const {
    header_image,
    heading,
    intro_text,
    instructions_title,
    instructions_list,
    safety_notice_title,
    safety_notice_text,
    image_url,
  } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can create." });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname;

    const [result] = await db.execute(
      `INSERT INTO bib_collection (header_image, heading, intro_text, instructions_title, instructions_list, safety_notice_title, safety_notice_text, image_url, entry_by, entry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        header_image,
        heading,
        intro_text,
        instructions_title,
        instructions_list,
        safety_notice_title,
        safety_notice_text,
        image_url,
        entry_by,
      ]
    );

    res.status(200).json({
      message: "Bib Collection created successfully.",
      bibId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating bib collection:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateBibCollection = async (req, res) => {
  const { bibId } = req.params;
  const {
    header_image,
    heading,
    intro_text,
    instructions_title,
    instructions_list,
    safety_notice_title,
    safety_notice_text,
    image_url,
  } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can update." });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname;

    const [result] = await db.execute(
      `UPDATE bib_collection SET header_image = ?, heading = ?, intro_text = ?, instructions_title = ?, instructions_list = ?, safety_notice_title = ?, safety_notice_text = ?, image_url = ?, update_by = ?, updated_date = NOW()
       WHERE bib_id = ?`,
      [
        header_image,
        heading,
        intro_text,
        instructions_title,
        instructions_list,
        safety_notice_title,
        safety_notice_text,
        image_url,
        update_by,
        bibId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bib Collection not found." });
    }

    res.status(200).json({ message: "Bib Collection updated successfully." });
  } catch (error) {
    console.error("Error updating bib collection:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteBibCollection = async (req, res) => {
  const { bibId } = req.params;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can delete." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE bib_collection SET is_active = 0 WHERE bib_id = ?`,
      [bibId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bib Collection not found." });
    }

    res.status(200).json({ message: "Bib Collection deleted successfully." });
  } catch (error) {
    console.error("Error deleting bib collection:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
