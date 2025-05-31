import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { connectToDatabase } from "../config/database.js";

export const signup = async (req, res) => {
  const { fullname, username, email, password, contact_no, inviteToken } =
    req.body;

  if (!fullname || !username || !email || !password || !contact_no) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  try {
    const db = await connectToDatabase();

    // Check if user already exists
    const [existingUser] = await db.execute(
      "SELECT * FROM usermaster WHERE email=?",
      [email]
    );
    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set isAdmin value based on invite token
    let adminValue = 2; // Default normal user
    if (inviteToken) {
      const [tokenResult] = await db.execute(
        "SELECT * FROM admin_invites WHERE token = ? AND used = 0",
        [inviteToken]
      );
      if (tokenResult.length > 0) {
        adminValue = 1; // Set as admin if valid token
        await db.execute("UPDATE admin_invites SET used = 1 WHERE token = ?", [
          inviteToken,
        ]);
      } else {
        return res
          .status(400)
          .json({ message: "Invalid or used invite token." });
      }
    }

    // Insert new user into the database
    const [result] = await db.execute(
      "INSERT INTO usermaster (fullname, username, email, password, contact_no, isAdmin) VALUES (?, ?, ?, ?, ?, ?)",
      [fullname, username, email, hashedPassword, contact_no, adminValue]
    );

    // Respond with success
    res.status(201).json({
      message: "User Registration Successful",
      userId: {
        id: result.insertId,
        fullname,
        username,
        email,
        contact_no,
        isAdmin: adminValue,
      },
    });
  } catch (error) {
    console.error("Error while registering user:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};
export const adminInvite = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can generate invites." });
  }
  try {
    const db = await connectToDatabase();
    const token = uuidv4();

    await db.execute(
      "INSERT INTO admin_invites (token, created_by, used) VALUES (?, ?, 0)",
      [token, req.user.id]
    );

    const inviteLink = `http://localhost:5173/signup?invite=${token}`;
    res.status(200).json({ message: "Invite generated", inviteLink });
  } catch (error) {
    console.error("Error generating invite:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    const db = await connectToDatabase();

    // Check if the user exists
    const [users] = await db.execute(
      "SELECT * FROM usermaster WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = users[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        fullname: user.fullname, // Ensure fullname is here
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    // Send Response
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        contact_no: user.contact_no,
        isAdmin: user.isAdmin,
      },
      token, // Send Token in Response
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const totalUsers = async (req, res) => {
  try {
    const db = await connectToDatabase();

    // Query to get the total number of users
    const [result] = await db.execute(
      "SELECT COUNT(*) AS totalUsers FROM usermaster"
    );

    // Send the total count of users
    res.status(200).json({ totalUsers: result[0].totalUsers });
  } catch (error) {
    console.error("Error fetching total users:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
export const users = async (req, res) => {
  try {
    const db = await connectToDatabase();

    // Fetch user data excluding the password
    const [users] = await db.execute(
      "SELECT id, fullname, username, email, contact_no, isAdmin FROM usermaster"
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
export const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const db = await connectToDatabase();

    // Delete user from the database
    const [result] = await db.execute("DELETE FROM usermaster WHERE id = ?", [
      userId,
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
export const getParticularUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const db = await connectToDatabase();

    const [rows] = await db.execute("SELECT * FROM usermaster WHERE id = ?", [
      userId,
    ]);

    if (rows.length > 0) {
      res.json(rows[0]); // Send back the first user from the rows array
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

    // Update the user in the database
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

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate the password fields
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both fields are required." });
  }

  try {
    const db = await connectToDatabase();

    // Get the current user from the database
    const [users] = await db.execute("SELECT * FROM usermaster WHERE id = ?", [
      req.user.id,
    ]);
    const user = users[0];

    // Check if the current password is correct
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await db.execute("UPDATE usermaster SET password = ? WHERE id = ?", [
      hashedNewPassword,
      req.user.id,
    ]);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
