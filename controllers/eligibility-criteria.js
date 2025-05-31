import { connectToDatabase } from "../config/database.js";

export const getEligibilityCriteria = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `SELECT * FROM eligibility_criteria WHERE is_active = 1 LIMIT 1`
    );
    res.status(200).json(result[0] || {});
  } catch (error) {
    console.error("Error fetching eligibility criteria:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createEligibilityCriteria = async (req, res) => {
  const {
    header_image,
    heading,
    age_eligibility_title,
    age_eligibility_table,
    notes_title,
    notes_list,
  } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can create." });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname;

    const [result] = await db.execute(
      `INSERT INTO eligibility_criteria (header_image, heading, age_eligibility_title, age_eligibility_table, notes_title, notes_list, entry_by, entry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        header_image,
        heading,
        age_eligibility_title,
        JSON.stringify(age_eligibility_table),
        notes_title,
        JSON.stringify(notes_list),
        entry_by,
      ]
    );

    res.status(200).json({
      message: "Eligibility Criteria created successfully.",
      criteriaId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating eligibility criteria:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateEligibilityCriteria = async (req, res) => {
  const { criteriaId } = req.params;
  const {
    header_image,
    heading,
    age_eligibility_title,
    age_eligibility_table,
    notes_title,
    notes_list,
  } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can update." });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname;

    const [result] = await db.execute(
      `UPDATE eligibility_criteria SET header_image = ?, heading = ?, age_eligibility_title = ?, age_eligibility_table = ?, notes_title = ?, notes_list = ?, update_by = ?, updated_date = NOW()
       WHERE criteria_id = ?`,
      [
        header_image,
        heading,
        age_eligibility_title,
        JSON.stringify(age_eligibility_table),
        notes_title,
        JSON.stringify(notes_list),
        update_by,
        criteriaId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Eligibility Criteria not found." });
    }

    res
      .status(200)
      .json({ message: "Eligibility Criteria updated successfully." });
  } catch (error) {
    console.error("Error updating eligibility criteria:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteEligibilityCriteria = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can delete." });
  }
  const { criteriaId } = req.params;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can delete." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE eligibility_criteria SET is_active = 0 WHERE criteria_id = ?`,
      [criteriaId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Eligibility Criteria not found." });
    }

    res
      .status(200)
      .json({ message: "Eligibility Criteria deleted successfully." });
  } catch (error) {
    console.error("Error deleting eligibility criteria:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
