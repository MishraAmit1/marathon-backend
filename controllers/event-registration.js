import { connectToDatabase } from "../config/database.js";
import moment from "moment";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRegistrationFields = (fields) => {
  const { name, gender, dob, city, email, contactno, participatein, event_id } =
    fields;
  if (
    !name ||
    !gender ||
    !dob ||
    !city ||
    !email ||
    !contactno ||
    !participatein ||
    !event_id
  ) {
    return "Please fill in all required fields.";
  }
  if (!validateEmail(email)) {
    return "Invalid email format.";
  }
  if (!moment(dob, "YYYY-MM-DD", true).isValid()) {
    return "Invalid date of birth format. Use YYYY-MM-DD.";
  }
  return null;
};

export const createRegistration = async (req, res) => {
  const {
    name,
    gender,
    dob,
    city,
    email,
    contactno,
    emergencyno,
    tshirtsize,
    bookingreference,
    participatein,
    event_id,
    category_id,
  } = req.body;

  if (
    !name ||
    !gender ||
    !dob ||
    !city ||
    !email ||
    !contactno ||
    !participatein ||
    !event_id
  ) {
    return res
      .status(400)
      .json({ message: "Please fill in all required fields." });
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

    const userFullName = userResult[0].fullname;

    // Check if user is already registered for this event date
    const [existingRegistration] = await db.execute(
      `SELECT r.event_id, e.event_date 
       FROM registration r
       JOIN event_master e ON r.event_id = e.event_id
       WHERE r.entryby = ? AND r.event_id = ?`,
      [userFullName, event_id]
    );

    if (existingRegistration.length > 0) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event." });
    }

    const [result] = await db.execute(
      `INSERT INTO registration 
      (name, gender, dob, city, email, contactno, emergencyno, tshirtsize, bookingreference, participatein, event_id, category_id, isactive, entrydate, entryby, updatedate, updateby) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        gender,
        dob,
        city,
        email,
        contactno,
        emergencyno,
        tshirtsize,
        bookingreference,
        participatein,
        event_id,
        category_id,
        req.body.isactive ? 1 : 0,
        moment().format(),
        userFullName,
        moment().format(),
        userFullName,
      ]
    );

    const registrationId = result.insertId;
    const bibno = name.slice(0, 4).toLowerCase() + registrationId;

    await db.execute(
      "UPDATE registration SET bibno = ? WHERE registrationid = ?",
      [bibno, registrationId]
    );

    res.status(201).json({
      message: "Registration successful",
      registrationDetails: {
        registrationid: registrationId,
        bibno: bibno,
        name,
        gender,
        dob,
        city,
        email,
        contactno,
        emergencyno,
        tshirtsize,
        bookingreference,
        participatein,
        event_id,
        category_id,
        isactive: true,
        entrydate: moment().format(),
        updatedate: moment().format(),
        entryby: userFullName,
        updateby: userFullName,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getAllRegistrations = async (req, res) => {
  try {
    const db = await connectToDatabase();

    const [registrations] = await db.execute(`
      SELECT 
        r.registrationid,
        r.bibno,
        r.name,
        r.gender,
        r.dob,
        r.city,
        r.email,
        r.contactno,
        r.emergencyno,
        r.tshirtsize,
        r.bookingreference,
        r.participatein,
        r.event_id,
        e.event_name,
        e.event_type,
        r.category_id,
        c.category_name,
        pm.km as distance,
        r.isactive,
        r.entrydate,
        r.entryby,
        r.updatedate,
        r.updateby
      FROM registration r
      LEFT JOIN event_master e ON r.event_id = e.event_id
      LEFT JOIN category_master c ON r.category_id = c.category_id
      LEFT JOIN participateinmaster pm 
        ON r.event_id = pm.event_id 
        AND r.category_id = pm.category_id
        AND pm.km = r.participatein 
      ORDER BY r.entrydate DESC
    `);

    if (registrations.length === 0) {
      return res.status(404).json({ message: "No registrations found." });
    }

    res.status(200).json({
      message: "Registrations fetched successfully.",
      data: registrations,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const db = await connectToDatabase();

    const [registrations] = await db.execute(
      `SELECT 
         r.registrationid,
         r.bibno,
         r.name,
         r.gender,
         r.dob,
         r.city,
         r.email,
         r.contactno,
         r.emergencyno,
         r.tshirtsize,
         r.bookingreference,
         r.participatein,
         r.event_id,
         e.event_name,
         e.event_date,
         r.category_id,
         c.category_name,
         r.isactive,
         r.entrydate,
         r.entryby,
         r.updatedate,
         r.updateby
       FROM registration r
       LEFT JOIN event_master e ON r.event_id = e.event_id
       LEFT JOIN category_master c ON r.category_id = c.category_id
       WHERE r.entryby = ? 
       ORDER BY r.entrydate DESC`,
      [req.user.fullname]
    );

    if (registrations.length === 0) {
      return res
        .status(200)
        .json({ message: "No registrations found.", data: [] });
    }

    res.status(200).json({
      message: "Registrations fetched successfully.",
      data: registrations,
    });
  } catch (error) {
    console.error("Error fetching my registrations:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getRegistrationById = async (req, res) => {
  const { registrationId } = req.params;

  try {
    const db = await connectToDatabase();

    const [registration] = await db.execute(
      "SELECT * FROM registration WHERE registrationid = ?",
      [registrationId]
    );

    if (registration.length === 0) {
      return res.status(404).json({ message: "Registration not found." });
    }

    res.status(200).json(registration[0]);
  } catch (error) {
    console.error("Error fetching registration:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateRegistration = async (req, res) => {
  const { registrationId } = req.params;
  const {
    name,
    gender,
    dob,
    city,
    email,
    contactno,
    emergencyno,
    tshirtsize,
    bookingreference,
    participatein,
    event_name,
    category_name,
    event_type,
    distance,
    isactive,
  } = req.body;

  const update_by = req.user.fullname;

  try {
    const db = await connectToDatabase();

    const [existingRegistration] = await db.execute(
      "SELECT * FROM registration WHERE registrationid = ?",
      [registrationId]
    );

    if (existingRegistration.length === 0) {
      return res.status(404).json({ message: "Registration not found." });
    }

    const [eventResult] = await db.execute(
      "SELECT event_id FROM event_master WHERE event_name = ?",
      [event_name]
    );

    if (eventResult.length === 0) {
      return res.status(404).json({ message: "Event not found." });
    }
    const event_id = eventResult[0].event_id;

    await db.execute(
      "UPDATE event_master SET event_type = ? WHERE event_id = ?",
      [event_type, event_id]
    );

    const [categoryResult] = await db.execute(
      "SELECT category_id FROM category_master WHERE category_name = ?",
      [category_name]
    );

    if (categoryResult.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }
    const category_id = categoryResult[0].category_id;

    await db.execute(
      `UPDATE registration 
      SET 
        name = ?, 
        gender = ?, 
        dob = ?, 
        city = ?, 
        email = ?, 
        contactno = ?, 
        emergencyno = ?, 
        tshirtsize = ?, 
        bookingreference = ?, 
        participatein = ?, 
        event_id = ?, 
        category_id = ?, 
        isactive = ?, 
        updateby = ?, 
        updatedate = ? 
      WHERE registrationid = ?`,
      [
        name || null,
        gender || null,
        dob || null,
        city || null,
        email || null,
        contactno || null,
        emergencyno || null,
        tshirtsize || null,
        bookingreference || null,
        participatein || null,
        event_id,
        category_id,
        isactive !== undefined ? isactive : 0,
        update_by,
        new Date(),
        registrationId,
      ]
    );

    if (distance !== undefined) {
      const [participationExists] = await db.execute(
        "SELECT * FROM participateinmaster WHERE event_id = ? AND category_id = ?",
        [event_id, category_id]
      );

      if (participationExists.length > 0) {
        await db.execute(
          "UPDATE participateinmaster SET km = ? WHERE event_id = ? AND category_id = ?",
          [distance, event_id, category_id]
        );
      } else {
        await db.execute(
          "INSERT INTO participateinmaster (event_id, category_id, km) VALUES (?, ?, ?)",
          [event_id, category_id, distance]
        );
      }
    }

    res.status(200).json({ message: "Registration updated successfully." });
  } catch (error) {
    console.error("Error updating registration:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteRegistration = async (req, res) => {
  const { registrationId } = req.params;

  if (!registrationId) {
    return res.status(400).json({ message: "Registration ID is required." });
  }

  try {
    const db = await connectToDatabase();

    const [existingRegistration] = await db.execute(
      "SELECT * FROM registration WHERE registrationid = ?",
      [registrationId]
    );

    if (existingRegistration.length === 0) {
      return res.status(404).json({ message: "Registration not found." });
    }

    const [result] = await db.execute(
      "DELETE FROM registration WHERE registrationid = ?",
      [registrationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Registration not found." });
    }

    res.status(200).json({ message: "Registration deleted successfully." });
  } catch (error) {
    console.error("Error deleting registration:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
