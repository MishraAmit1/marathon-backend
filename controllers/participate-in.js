import { connectToDatabase } from "../config/database.js";

export const createParticipateIn = async (req, res) => {
  const { event_type, event_id, category_id, km, isactive, starttime } =
    req.body;

  console.log("Received request body:", req.body);

  if (!event_type || !event_id || !category_id || !km || !starttime) {
    return res
      .status(400)
      .json({ message: "Required fields are missing or invalid." });
  }

  try {
    const db = await connectToDatabase();

    // Validate event_type
    const [eventTypes] = await db.execute(
      "SELECT event_type FROM event_master WHERE event_type = ?",
      [event_type]
    );
    if (eventTypes.length === 0) {
      return res.status(400).json({ message: "Invalid event type." });
    }

    // Validate event_id
    const [events] = await db.execute(
      "SELECT event_id FROM event_master WHERE event_id = ?",
      [event_id]
    );
    if (events.length === 0) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // Validate category_id
    const [categories] = await db.execute(
      "SELECT category_id FROM category_master WHERE category_id = ?",
      [category_id]
    );
    if (categories.length === 0) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    // Validate and fetch entry_by
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    const [users] = await db.execute(
      "SELECT fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    const entry_by = req.body.entry_by || users[0]?.fullname || "Unknown";

    // Check for duplicate `km` entry for the same `event_id` and `category_id`
    const [existing] = await db.execute(
      "SELECT * FROM participateinmaster WHERE event_id = ? AND category_id = ? AND km = ?",
      [event_id, category_id, km]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        message: "Participation option with the same distance already exists.",
      });
    }

    // Insert new record if no duplicate is found
    const [result] = await db.execute(
      "INSERT INTO participateinmaster (event_id, category_id, km, isactive, entry_by, entry_date, starttime) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [
        event_id,
        category_id,
        km,
        isactive === undefined ? 1 : isactive, // Default value for is_active
        entry_by,
        starttime,
      ]
    );

    res.status(201).json({
      message: "Participation option created successfully!",
      participateinId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating participation record:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllParticipateIn = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const query = `
      SELECT p.participateinid, p.event_id, p.category_id, p.km, 
             DATE_FORMAT(p.starttime, '%Y-%m-%dT%H:%i') AS starttime,  -- Format starttime for frontend compatibility
             p.isactive, p.entry_by, e.event_name, e.event_type, c.category_name
      FROM participateinmaster p
      JOIN event_master e ON p.event_id = e.event_id
      JOIN category_master c ON p.category_id = c.category_id
    `;
    const [participations] = await db.execute(query);
    res.status(200).json(participations);
  } catch (error) {
    console.error("Error fetching participatein records:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateParticipateIn = async (req, res) => {
  const participateinid = req.params.id; // Get the ID from the URL
  const { event_id, category_id, km, isactive = 1, starttime } = req.body; // Provide a default value for isactive

  if (!participateinid || !event_id || !category_id || !km || !starttime) {
    return res
      .status(400)
      .json({ message: "Required fields are missing or invalid." });
  }

  try {
    const db = await connectToDatabase();

    // Validate token and fetch the logged-in user's name
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    const [users] = await db.execute(
      "SELECT fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    const update_by = users[0].fullname; // Get the logged-in user's name

    // Check for duplicate records (excluding the current record)
    const [existingRecord] = await db.execute(
      "SELECT * FROM participateinmaster WHERE event_id = ? AND category_id = ? AND km = ? AND participateinid != ?",
      [event_id, category_id, km, participateinid]
    );
    if (existingRecord.length > 0) {
      return res.status(400).json({ message: "Duplicate record exists." });
    }
    // Update the record
    const [updateResult] = await db.execute(
      "UPDATE participateinmaster SET event_id = ?, category_id = ?, km = ?, isactive = ?, starttime = ?, updated_date = NOW(), update_by = ? WHERE participateinid = ?",
      [
        event_id,
        category_id,
        km,
        isactive,
        starttime,
        update_by,
        participateinid,
      ]
    );

    res.status(200).json({
      message: "ParticipateIn record updated successfully",
      updatedId: participateinid,
    });
  } catch (error) {
    console.error("Error updating ParticipateIn record:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteParticipateIn = async (req, res) => {
  const { participateinId } = req.params;
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "DELETE FROM participateinmaster WHERE participateinid = ?",
      [participateinId]
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "ParticipateIn record not found." });
    }
    res
      .status(200)
      .json({ message: "ParticipateIn record deleted successfully." });
  } catch (error) {
    console.error("Error deleting participatein record:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getEntriesByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const db = await connectToDatabase();

    // Query to get events and the corresponding distances (km) for the given category
    const [events] = await db.execute(
      `SELECT e.event_id, e.event_name, e.event_type 
       FROM event_master e
       JOIN category_master c ON e.event_id = c.event_id 
       WHERE c.category_id = ? AND e.is_active = 1`,
      [categoryId]
    );

    if (events.length === 0) {
      return res
        .status(404)
        .json({ message: "No events found for this category." });
    }

    // Fetch the distances from participateinmaster based on category_id
    const [participationOptions] = await db.execute(
      `SELECT km 
       FROM participateinmaster 
       WHERE category_id = ? AND isactive = 1`,
      [categoryId]
    );

    if (participationOptions.length === 0) {
      return res
        .status(404)
        .json({ message: "No distances found for this category." });
    }

    // Return both events and distances
    res.status(200).json({ events, participationOptions });
  } catch (error) {
    console.error("Error fetching options:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDropdownData = async (req, res) => {
  try {
    const db = await connectToDatabase();

    const [events] = await db.execute(
      "SELECT event_id, event_type FROM event_master WHERE is_active = 1"
    );
    const [categories] = await db.execute(
      "SELECT category_id, category_name FROM category_master WHERE is_active = 1"
    );

    res.status(200).json({ events, categories });
  } catch (error) {
    console.error("Error fetching dropdown data:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
