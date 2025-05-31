import { connectToDatabase } from "../config/database.js";

export const getTotalUsers = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "SELECT COUNT(*) AS totalUsers FROM usermaster"
    );
    res.status(200).json({ totalUsers: result[0].totalUsers });
  } catch (error) {
    console.error("Error fetching total users:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [users] = await db.execute(
      "SELECT id, fullname, username, email, contact_no, isAdmin FROM usermaster"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectToDatabase();
    const [rows] = await db.execute("SELECT * FROM usermaster WHERE id = ?", [
      id,
    ]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullname, username, email, contact_no, isAdmin } = req.body;
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "UPDATE usermaster SET fullname = ?, username = ?, email = ?, contact_no = ?, isAdmin = ? WHERE id = ?",
      [fullname, username, email, contact_no, isAdmin, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User updated successfully." });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute("DELETE FROM usermaster WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "User deleted successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
