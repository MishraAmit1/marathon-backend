import { connectToDatabase } from "../config/database.js";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const submitContactForm = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const db = await connectToDatabase();
    const entry_by = req.user.fullname || "Unknown";

    const [result] = await db.execute(
      `INSERT INTO contact_submissions (name, email, subject, message, entry_by, entry_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, subject, message, entry_by]
    );

    res.status(200).json({
      message:
        "Your message has been sent successfully! We'll get back to you soon.",
      submissionId: result.insertId,
    });
  } catch (error) {
    console.error("Error submitting contact form:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllSubmissions = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can view submissions." });
  }

  try {
    const db = await connectToDatabase();
    const [submissions] = await db.execute(
      `SELECT submission_id, name, email, subject, message, entry_by, entry_date, is_active
       FROM contact_submissions`
    );

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSubmission = async (req, res) => {
  const { submissionId } = req.params;

  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can delete submissions." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `DELETE FROM contact_submissions WHERE submission_id = ?`,
      [submissionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Submission not found." });
    }

    res.status(200).json({ message: "Submission deleted successfully." });
  } catch (error) {
    console.error("Error deleting submission:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getContactInfo = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [contactInfo] = await db.execute(
      `SELECT email, phone, address, map_url
       FROM contact_info
       WHERE is_active = 1
       ORDER BY updated_date DESC
       LIMIT 1`
    );

    if (contactInfo.length === 0) {
      return res.status(404).json({ message: "No contact info found." });
    }

    res.status(200).json(contactInfo[0]);
  } catch (error) {
    console.error("Error fetching contact info:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateContactInfo = async (req, res) => {
  const { infoId } = req.params;
  const { email, phone, address, map_url } = req.body;

  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can update contact info." });
  }

  if (!email || !phone || !address || !map_url) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const db = await connectToDatabase();
    const update_by = req.user.fullname;

    const [result] = await db.execute(
      `UPDATE contact_info 
       SET email = ?, phone = ?, address = ?, map_url = ?, update_by = ?, updated_date = NOW()
       WHERE info_id = ?`,
      [email, phone, address, map_url, update_by, infoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Contact info not found." });
    }

    res.status(200).json({ message: "Contact info updated successfully." });
  } catch (error) {
    console.error("Error updating contact info:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTotalSubmissions = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can view submissions." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "SELECT COUNT(*) as totalContactSubmissions FROM contact_submissions"
    );
    res
      .status(200)
      .json({ totalContactSubmissions: result[0].totalContactSubmissions });
  } catch (error) {
    console.error("Error fetching total contact submissions:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
