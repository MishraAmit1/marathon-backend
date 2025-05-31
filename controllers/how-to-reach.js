import { connectToDatabase } from "../config/database.js";

const validateURL = (url) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return urlRegex.test(url);
};

const validateHowToReachFields = (fields) => {
  const {
    header_image,
    heading,
    intro_text,
    option1_title,
    option1_description,
    option2_title,
    option2_description,
    option3_title,
    option3_description,
  } = fields;
  if (
    !header_image ||
    !heading ||
    !intro_text ||
    !option1_title ||
    !option1_description ||
    !option2_title ||
    !option2_description ||
    !option3_title ||
    !option3_description
  ) {
    return "All required fields must be provided.";
  }
  if (!validateURL(header_image)) {
    return "Header image must be a valid URL.";
  }
  if (heading.length < 3 || heading.length > 100) {
    return "Heading must be between 3 and 100 characters.";
  }
  if (intro_text.length < 10 || intro_text.length > 1000) {
    return "Intro text must be between 10 and 1000 characters.";
  }
  if (option1_title.length < 3 || option1_title.length > 100) {
    return "Option 1 title must be between 3 and 100 characters.";
  }
  if (option1_description.length < 10 || option1_description.length > 1000) {
    return "Option 1 description must be between 10 and 1000 characters.";
  }
  if (option2_title.length < 3 || option2_title.length > 100) {
    return "Option 2 title must be between 3 and 100 characters.";
  }
  if (option2_description.length < 10 || option2_description.length > 1000) {
    return "Option 2 description must be between 10 and 1000 characters.";
  }
  if (option3_title.length < 3 || option3_title.length > 100) {
    return "Option 3 title must be between 3 and 100 characters.";
  }
  if (option3_description.length < 10 || option3_description.length > 1000) {
    return "Option 3 description must be between 10 and 1000 characters.";
  }
  if (
    fields.option1_details &&
    (fields.option1_details.length < 10 || fields.option1_details.length > 1000)
  ) {
    return "Option 1 details, if provided, must be between 10 and 1000 characters.";
  }
  if (
    fields.option2_details &&
    (fields.option2_details.length < 10 || fields.option2_details.length > 1000)
  ) {
    return "Option 2 details, if provided, must be between 10 and 1000 characters.";
  }
  if (
    fields.option3_details &&
    (fields.option3_details.length < 10 || fields.option3_details.length > 1000)
  ) {
    return "Option 3 details, if provided, must be between 10 and 1000 characters.";
  }
  if (
    fields.note_text &&
    (fields.note_text.length < 10 || fields.note_text.length > 1000)
  ) {
    return "Note text, if provided, must be between 10 and 1000 characters.";
  }
  return null;
};

export const getHowToReach = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM how_to_reach WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching how to reach:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createHowToReach = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can create how to reach content." });
  }

  const {
    header_image,
    heading,
    intro_text,
    option1_title,
    option1_description,
    option1_details,
    option2_title,
    option2_description,
    option2_details,
    option3_title,
    option3_description,
    option3_details,
    note_text,
  } = req.body;

  const validationError = validateHowToReachFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname || "unknown";

    const [result] = await db.execute(
      `INSERT INTO how_to_reach (header_image, heading, intro_text, option1_title, option1_description, option1_details, option2_title, option2_description, option2_details, option3_title, option3_description, option3_details, note_text, entry_by, entry_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
      [
        header_image,
        heading,
        intro_text,
        option1_title,
        option1_description,
        option1_details || null,
        option2_title,
        option2_description,
        option2_details || null,
        option3_title,
        option3_description,
        option3_details || null,
        note_text || null,
        entry_by,
      ]
    );

    res.status(201).json({
      message: "How to Reach created successfully.",
      reachId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating how to reach:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateHowToReach = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can update how to reach content." });
  }

  const { reachId } = req.params;
  const {
    header_image,
    heading,
    intro_text,
    option1_title,
    option1_description,
    option1_details,
    option2_title,
    option2_description,
    option2_details,
    option3_title,
    option3_description,
    option3_details,
    note_text,
  } = req.body;

  const validationError = validateHowToReachFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname || "unknown";

    const [result] = await db.execute(
      `UPDATE how_to_reach 
       SET header_image = ?, heading = ?, intro_text = ?, option1_title = ?, option1_description = ?, option1_details = ?, option2_title = ?, option2_description = ?, option2_details = ?, option3_title = ?, option3_description = ?, option3_details = ?, note_text = ?, update_by = ?, updated_date = NOW()
       WHERE reach_id = ? AND is_active = 1`,
      [
        header_image,
        heading,
        intro_text,
        option1_title,
        option1_description,
        option1_details || null,
        option2_title,
        option2_description,
        option2_details || null,
        option3_title,
        option3_description,
        option3_details || null,
        note_text || null,
        update_by,
        reachId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "How to Reach not found." });
    }

    res.status(200).json({ message: "How to Reach updated successfully." });
  } catch (error) {
    console.error("Error updating how to reach:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteHowToReach = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can delete how to reach content." });
  }

  const { reachId } = req.params;

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE how_to_reach SET is_active = 0 WHERE reach_id = ?`,
      [reachId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "How to Reach not found." });
    }

    res.status(200).json({ message: "How to Reach deleted successfully." });
  } catch (error) {
    console.error("Error deleting how to reach:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
