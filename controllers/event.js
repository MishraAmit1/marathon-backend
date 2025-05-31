import { connectToDatabase } from "../config/database.js";
import moment from "moment";

export const createEvent = async (req, res) => {
  const {
    event_name,
    event_date,
    event_year,
    event_description,
    is_active,
    event_type,
    location,
    time,
  } = req.body;

  console.log("Received Request Body:", req.body);
  console.log("Received File:", req.file);

  const event_image = req.file
    ? `/uploads/event_images/${req.file.filename}`
    : null;
  const activeStatus = is_active === "true" || is_active === true ? 1 : 0;

  // Validation
  if (!event_name || event_name.length < 3 || event_name.length > 100) {
    return res
      .status(400)
      .json({ message: "Event name must be between 3 and 100 characters." });
  }
  if (
    !event_date ||
    !moment(event_date, "YYYY-MM-DD", true).isValid() ||
    moment(event_date).isBefore(moment())
  ) {
    return res
      .status(400)
      .json({ message: "Event date must be a valid date in the future." });
  }
  if (
    !event_year ||
    isNaN(event_year) ||
    event_year.length !== 4 ||
    event_year < moment().year() ||
    event_year > moment().year() + 10
  ) {
    return res.status(400).json({
      message:
        "Event year must be a valid 4-digit number between the current year and a future year limit.",
    });
  }
  if (moment(event_date).year() !== parseInt(event_year)) {
    return res
      .status(400)
      .json({ message: "Event year must match the year of the event date." });
  }
  if (
    !event_description ||
    event_description.length < 10 ||
    event_description.length > 500
  ) {
    return res.status(400).json({
      message: "Description must be between 10 and 500 characters.",
    });
  }
  if (!event_type) {
    return res.status(400).json({ message: "Event type is required." });
  }
  if (!location) {
    return res.status(400).json({ message: "Location is required." });
  }
  if (!time || !moment(time, "HH:mm", true).isValid()) {
    return res
      .status(400)
      .json({ message: "Time must be a valid time (e.g., 14:30)." });
  }

  try {
    const db = await connectToDatabase();
    const [existingEvent] = await db.execute(
      "SELECT * FROM event_master WHERE event_name = ? AND event_date = ?",
      [event_name, event_date]
    );
    if (existingEvent.length > 0) {
      return res.status(400).json({
        message: "Event with the same name and date already exists.",
      });
    }

    const [userResult] = await db.execute(
      "SELECT fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    console.log("User Result:", userResult);
    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }
    const userFullName = userResult[0].fullname;

    const [result] = await db.execute(
      `INSERT INTO event_master 
        (event_name, event_date, event_year, event_type, event_description, event_image, is_active, entry_date, entry_by, updated_date, update_by, location, time)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?)`,
      [
        event_name,
        event_date,
        event_year,
        event_type,
        event_description,
        event_image,
        activeStatus,
        userFullName,
        userFullName,
        location,
        time,
      ]
    );

    res.status(201).json({
      message: "Event created successfully",
      eventId: result.insertId,
      eventImage: event_image,
      updateBy: userFullName,
    });
  } catch (error) {
    console.error("Error creating event:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [events] = await db.execute(
      `SELECT 
          e.event_id, e.event_name, e.event_date, e.event_year, e.event_description, 
          e.event_image, e.is_active, e.event_type, e.entry_date, e.entry_by, 
          e.updated_date, e.location, e.time,
          u2.fullname AS updateByName
       FROM event_master e
       LEFT JOIN usermaster u2 ON e.update_by = u2.id`
    );
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const {
    event_name,
    event_date,
    event_year,
    event_description,
    is_active,
    event_type,
    location,
    time,
  } = req.body;

  const activeStatus = is_active === "true" || is_active === true ? 1 : 0;

  if (
    !event_year ||
    isNaN(event_year) ||
    event_year < 1000 ||
    event_year > 9999
  ) {
    return res
      .status(400)
      .json({ message: "Event year must be a valid 4-digit number." });
  }
  if (!location) {
    return res.status(400).json({ message: "Location is required." });
  }
  if (!time || !moment(time, "HH:mm", true).isValid()) {
    return res
      .status(400)
      .json({ message: "Time must be a valid time (e.g., 14:30)." });
  }
  const eventDateYear = moment(event_date).year();
  if (parseInt(event_year) !== eventDateYear) {
    return res.status(400).json({
      message: "Event year must match the year from the event date.",
    });
  }

  try {
    const db = await connectToDatabase();
    const [existingEvent] = await db.execute(
      "SELECT * FROM event_master WHERE event_id = ?",
      [eventId]
    );
    if (existingEvent.length === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    const finalEventImage = req.file
      ? `/uploads/event_images/${req.file.filename}`
      : existingEvent[0].event_image;

    const [result] = await db.execute(
      `UPDATE event_master
         SET event_name = ?, event_date = ?, event_year = ?, event_description = ?, 
             event_image = ?, is_active = ?, event_type = ?, updated_date = NOW(), 
             update_by = ?, location = ?, time = ?
         WHERE event_id = ?`,
      [
        event_name,
        event_date,
        event_year,
        event_description,
        finalEventImage,
        activeStatus,
        event_type,
        req.user.id,
        location,
        time,
        eventId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.status(200).json({
      message: "Event updated successfully",
      eventImage: finalEventImage,
    });
  } catch (error) {
    console.error("Error updating event:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getEventById = async (req, res) => {
  const { eventId } = req.params;
  console.log("Fetching event with eventId:", eventId);

  try {
    const db = await connectToDatabase();
    const [event] = await db.execute(
      `SELECT 
         e.event_id, e.event_name, e.event_date, e.event_year, e.event_description, 
         e.event_image, e.is_active AS isActive, e.event_type, e.entry_date, 
         e.entry_by, e.updated_date, e.location, e.time,
         u.fullname AS entryByName, u2.fullname AS updateByName
       FROM event_master e
       LEFT JOIN usermaster u ON e.entry_by = u.id
       LEFT JOIN usermaster u2 ON e.update_by = u2.id
       WHERE e.event_id = ?`,
      [eventId]
    );

    if (event.length === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    console.log("Fetched Event Data:", event[0]);
    res.status(200).json(event[0]);
  } catch (error) {
    console.error("Error fetching event details:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  console.log("Fetching event with eventId:", eventId);

  try {
    const db = await connectToDatabase();
    const [event] = await db.execute(
      `SELECT 
         e.event_id, e.event_name, e.event_date, e.event_year, e.event_description, 
         e.event_image, e.is_active AS isActive, e.event_type, e.entry_date, 
         e.entry_by, e.updated_date, e.location, e.time,
         u.fullname AS entryByName, u2.fullname AS updateByName
       FROM event_master e
       LEFT JOIN usermaster u ON e.entry_by = u.id
       LEFT JOIN usermaster u2 ON e.update_by = u2.id
       WHERE e.event_id = ?`,
      [eventId]
    );

    if (event.length === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    console.log("Fetched Event Data:", event[0]);
    res.status(200).json(event[0]);
  } catch (error) {
    console.error("Error fetching event details:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getEventTypes = async (req, res) => {
  const { event_name } = req.query;
  if (!event_name) {
    return res.status(400).json({ message: "Event name is required." });
  }
  try {
    const db = await connectToDatabase();
    const [eventTypes] = await db.execute(
      "SELECT DISTINCT event_type FROM event_master WHERE event_name = ?",
      [event_name]
    );
    if (eventTypes.length === 0) {
      return res
        .status(404)
        .json({ message: "No event types found for this event name." });
    }
    res.status(200).json(eventTypes);
  } catch (error) {
    console.error("Error fetching event types:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getEventsByType = async (req, res) => {
  const { eventType } = req.params;
  if (!eventType) {
    return res.status(400).json({ message: "Event type is required." });
  }
  try {
    const db = await connectToDatabase();
    const [events] = await db.execute(
      `SELECT 
          e.event_id, e.event_name, e.event_date, e.event_year, e.event_description, 
          e.event_image, e.is_active, e.event_type, e.entry_date, e.entry_by, 
          e.updated_date, e.location, e.time,
          u2.fullname AS updateByName
       FROM event_master e
       LEFT JOIN usermaster u2 ON e.update_by = u2.id
       WHERE e.event_type = ?`,
      [eventType]
    );
    if (events.length === 0) {
      return res
        .status(404)
        .json({ message: `No events found for type: ${eventType}` });
    }
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events by event type:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getTotalEvents = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "SELECT COUNT(*) as totalEvents FROM event_master"
    );
    res.status(200).json({ totalEvents: result[0].totalEvents });
  } catch (error) {
    console.error("Error fetching total events:", error.message, error.stack);
    res.status(500).json({
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};

export const getActiveEvents = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      "SELECT COUNT(*) as activeEvents FROM event_master WHERE is_active = 1"
    );
    res.status(200).json({ activeEvents: result[0].activeEvents });
  } catch (error) {
    console.error("Error fetching active events:", error.message, error.stack);
    res.status(500).json({
      message: "Internal Server Error. Please try again later.",
      error: error.message,
    });
  }
};
