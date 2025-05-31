import { connectToDatabase } from "../config/database.js";
export const getAllFAQs = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [faqs] = await db.execute(
      `SELECT faq_id, question, answer
       FROM faqs
       WHERE is_active = 1
       ORDER BY entry_date ASC`
    );

    res.status(200).json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createFAQ = async (req, res) => {
  const { question, answer } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can create FAQs." });
  }

  if (!question || !answer) {
    return res
      .status(400)
      .json({ message: "Question and answer are required." });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname;

    const [result] = await db.execute(
      `INSERT INTO faqs (question, answer, entry_by, entry_date)
       VALUES (?, ?, ?, NOW())`,
      [question, answer, entry_by]
    );

    res
      .status(200)
      .json({ message: "FAQ created successfully.", faqId: result.insertId });
  } catch (error) {
    console.error("Error creating FAQ:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateFAQ = async (req, res) => {
  const { faqId } = req.params;
  const { question, answer } = req.body;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can update FAQs." });
  }

  if (!question || !answer) {
    return res
      .status(400)
      .json({ message: "Question and answer are required." });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname;

    const [result] = await db.execute(
      `UPDATE faqs 
       SET question = ?, answer = ?, update_by = ?, updated_date = NOW()
       WHERE faq_id = ?`,
      [question, answer, update_by, faqId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    res.status(200).json({ message: "FAQ updated successfully." });
  } catch (error) {
    console.error("Error updating FAQ:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteFAQ = async (req, res) => {
  const { faqId } = req.params;

  if (req.user.isAdmin !== 1) {
    return res.status(403).json({ message: "Only admins can delete FAQs." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE faqs SET is_active = 0 WHERE faq_id = ?`,
      [faqId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    res.status(200).json({ message: "FAQ deleted successfully." });
  } catch (error) {
    console.error("Error deleting FAQ:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
