import { connectToDatabase } from "../config/database.js";
import XLSX from "xlsx";

const formatTime = (timeValue) => {
  if (!timeValue) return null;
  if (typeof timeValue === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }
  if (typeof timeValue === "number") {
    const hours = Math.floor(timeValue * 24);
    const minutes = Math.floor((timeValue * 24 * 60) % 60);
    const seconds = Math.floor((timeValue * 24 * 60 * 60) % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  const timeStr = timeValue.toString();
  const timeParts = timeStr.split(":");
  if (timeParts.length >= 2) {
    const hours = timeParts[0].padStart(2, "0");
    const minutes = timeParts[1].padStart(2, "0");
    const seconds = timeParts[2] ? timeParts[2].padStart(2, "0") : "00";
    return `${hours}:${minutes}:${seconds}`;
  }
  return null;
};

export const uploadResultsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read the Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const db = await connectToDatabase();

    // Get user details for entryby
    const [userResult] = await db.execute(
      "SELECT id, fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }
    const userId = userResult[0].id;

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      try {
        // Map Excel columns to database fields
        const resultData = {
          registrationId: row["Registration ID"] || null,
          bibno: row["Bib No"] || row["BibNo"] || row["Bib Number"],
          name: row["Name"],
          startime: formatTime(row["Start Time"]),
          finishtime: formatTime(row["Finish Time"]),
          raceTime: formatTime(row["Race Time"]),
          cP1: row["CP1"] || null,
          cP1Time: formatTime(row["CP1 Time"]),
          cP2: row["CP2"] || null,
          cP2Time: formatTime(row["CP2 Time"]),
          cP3: row["CP3"] || null,
          cP3Time: formatTime(row["CP3 Time"]),
          cP4: row["CP4"] || null,
          cP4Time: formatTime(row["CP4 Time"]),
          cP5: row["CP5"] || null,
          cP5Time: formatTime(row["CP5 Time"]),
          age: row["Age"] || null,
          gender: row["Gender"],
          participatein: row["Participate In"] || null,
          categoryId: row["Category ID"] || null,
          city: row["City"] || null,
          rfid1: row["RFID 1"] || null,
          rfid2: row["RFID 2"] || null,
          eventId: row["Event ID"],
          CStartTime: formatTime(row["CStart Time"]),
          CRaceTime: formatTime(row["CRace Time"]),
          imageid: row["Image ID"] || null,
        };

        // Basic validation
        if (
          !resultData.bibno ||
          !resultData.name ||
          !resultData.gender ||
          !resultData.eventId
        ) {
          errors.push(
            `Row ${
              i + 2
            }: Missing required fields (Bib No, Name, Gender, Event ID)`
          );
          errorCount++;
          continue;
        }

        // Validate gender
        if (!["Male", "Female", "Others"].includes(resultData.gender)) {
          errors.push(`Row ${i + 2}: Invalid gender '${resultData.gender}'`);
          errorCount++;
          continue;
        }

        // Check if bib number already exists
        const [existingBib] = await db.execute(
          "SELECT * FROM resultmaster WHERE bibno = ?",
          [resultData.bibno]
        );

        if (existingBib.length > 0) {
          errors.push(
            `Row ${i + 2}: Bib number '${resultData.bibno}' already exists`
          );
          errorCount++;
          continue;
        }

        // Insert data
        await db.execute(
          `INSERT INTO resultmaster 
          (registrationId, bibno, name, startime, finishtime, raceTime, cP1, cP1Time, cP2, cP2Time, 
          cP3, cP3Time, cP4, cP4Time, cP5, cP5Time, age, gender, participatein, categoryId, city, 
          rfid1, rfid2, entrydate, entryby, eventId, isactive, CStartTime, CRaceTime, imageid)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 1, ?, ?, ?)`,
          [
            resultData.registrationId,
            resultData.bibno,
            resultData.name,
            resultData.startime,
            resultData.finishtime,
            resultData.raceTime,
            resultData.cP1,
            resultData.cP1Time,
            resultData.cP2,
            resultData.cP2Time,
            resultData.cP3,
            resultData.cP3Time,
            resultData.cP4,
            resultData.cP4Time,
            resultData.cP5,
            resultData.cP5Time,
            resultData.age,
            resultData.gender,
            resultData.participatein,
            resultData.categoryId,
            resultData.city,
            resultData.rfid1,
            resultData.rfid2,
            userId,
            resultData.eventId,
            resultData.CStartTime,
            resultData.CRaceTime,
            resultData.imageid,
          ]
        );

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error.message);
        errors.push(`Row ${i + 2}: ${error.message}`);
        errorCount++;
      }
    }

    res.status(200).json({
      message: "Excel upload completed",
      totalRows: jsonData.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Send only first 10 errors to avoid large response
    });
  } catch (error) {
    console.error("Error uploading Excel:", error.message);
    res.status(500).json({
      message: "Error processing Excel file",
      error: error.message,
    });
  }
};

export const addResult = async (req, res) => {
  const {
    registrationId,
    bibno,
    name,
    startime,
    finishtime,
    raceTime,
    cP1,
    cP1Time,
    cP2,
    cP2Time,
    cP3,
    cP3Time,
    cP4,
    cP4Time,
    cP5,
    cP5Time,
    age,
    gender,
    participatein,
    categoryId,
    city,
    rfid1,
    rfid2,
    eventId,
    CStartTime,
    CRaceTime,
    imageid,
  } = req.body;

  // Validation
  if (!bibno || bibno.length < 1) {
    return res.status(400).json({ message: "Bib number is required." });
  }
  if (!name || name.length < 3) {
    return res.status(400).json({ message: "Name is required." });
  }
  if (!["Male", "Female", "Others"].includes(gender)) {
    return res.status(400).json({ message: "Invalid gender." });
  }
  if (raceTime && !/^\d{2}:\d{2}:\d{2}$/.test(raceTime)) {
    return res
      .status(400)
      .json({ message: "Race time must be in HH:MM:SS format." });
  }
  if (startime && !/^\d{2}:\d{2}:\d{2}$/.test(startime)) {
    return res
      .status(400)
      .json({ message: "Start time must be in HH:MM:SS format." });
  }
  if (finishtime && !/^\d{2}:\d{2}:\d{2}$/.test(finishtime)) {
    return res
      .status(400)
      .json({ message: "Finish time must be in HH:MM:SS format." });
  }
  if (!eventId || isNaN(eventId)) {
    return res.status(400).json({ message: "Event ID is required." });
  }

  try {
    const db = await connectToDatabase();

    // Check if bib number already exists
    const [existingBib] = await db.execute(
      "SELECT * FROM resultmaster WHERE bibno = ?",
      [bibno]
    );
    if (existingBib.length > 0) {
      return res.status(400).json({ message: "Bib number already exists." });
    }

    // Fetch user details for entryby
    const [userResult] = await db.execute(
      "SELECT id, fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }
    const userId = userResult[0].id;
    const userFullName = userResult[0].fullname;

    // Insert into resultmaster
    const [result] = await db.execute(
      `INSERT INTO resultmaster 
      (registrationId, bibno, name, startime, finishtime, raceTime, cP1, cP1Time, cP2, cP2Time, 
      cP3, cP3Time, cP4, cP4Time, cP5, cP5Time, age, gender, participatein, categoryId, city, 
      rfid1, rfid2, entrydate, entryby, eventId, isactive, CStartTime, CRaceTime, imageid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, 1, ?, ?, ?)`,
      [
        registrationId || null,
        bibno,
        name,
        startime || null,
        finishtime || null,
        raceTime || null,
        cP1 || null,
        cP1Time || null,
        cP2 || null,
        cP2Time || null,
        cP3 || null,
        cP3Time || null,
        cP4 || null,
        cP4Time || null,
        cP5 || null,
        cP5Time || null,
        age || null,
        gender,
        participatein || null,
        categoryId || null,
        city || null,
        rfid1 || null,
        rfid2 || null,
        userId,
        eventId,
        CStartTime || null,
        CRaceTime || null,
        imageid || null,
      ]
    );

    res.status(201).json({
      message: "Result added successfully",
      resultId: result.insertId,
    });
  } catch (error) {
    console.error("Error adding result:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getAllResults = async (req, res) => {
  const { year, gender, eventId } = req.query;
  try {
    const db = await connectToDatabase();
    let query = `
      SELECT rm.*, em.event_name 
      FROM resultmaster rm
      LEFT JOIN event_master em ON rm.eventId = em.event_id
      WHERE rm.isactive = 1
    `;
    const params = [];

    if (year) {
      query += " AND YEAR(rm.entrydate) = ?";
      params.push(year);
    }
    if (gender) {
      query += " AND rm.gender = ?";
      params.push(gender);
    }
    if (eventId) {
      query += " AND rm.eventId = ?";
      params.push(eventId);
    }

    const [results] = await db.execute(query, params);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching results:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const getResultById = async (req, res) => {
  const { resultId } = req.params;
  const parsedResultId = parseInt(resultId, 10);

  if (isNaN(parsedResultId)) {
    return res
      .status(400)
      .json({ message: "Invalid resultId. It must be a number." });
  }

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `
      SELECT rm.*, em.event_name 
      FROM resultmaster rm
      LEFT JOIN event_master em ON rm.eventId = em.event_id
      WHERE rm.resultId = ? AND rm.isactive = 1
      `,
      [parsedResultId]
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Result not found or has been deleted." });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error("Error fetching result:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const updateResult = async (req, res) => {
  const { resultId } = req.params;
  console.log("Raw resultId from params:", resultId); // Debug log
  const parsedResultId = parseInt(resultId, 10);

  if (isNaN(parsedResultId)) {
    return res
      .status(400)
      .json({ message: "Invalid resultId. It must be a number." });
  }

  const {
    registrationId,
    bibno,
    name,
    startime,
    finishtime,
    raceTime,
    cP1,
    cP1Time,
    cP2,
    cP2Time,
    cP3,
    cP3Time,
    cP4,
    cP4Time,
    cP5,
    cP5Time,
    age,
    gender,
    participatein,
    categoryId,
    city,
    rfid1,
    rfid2,
    eventId,
    CStartTime,
    CRaceTime,
    imageid,
  } = req.body;

  try {
    const db = await connectToDatabase();
    const [existingResult] = await db.execute(
      "SELECT * FROM resultmaster WHERE resultId = ? AND isactive = 1",
      [parsedResultId]
    );
    if (existingResult.length === 0) {
      return res
        .status(404)
        .json({ message: "Result not found or has been deleted." });
    }
    const entryYear = new Date(existingResult[0].entrydate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (entryYear !== currentYear) {
      return res
        .status(403)
        .json({ message: "Cannot edit past year results." });
    }

    // Validation
    if (!bibno || bibno.length < 1) {
      return res.status(400).json({ message: "Bib number is required." });
    }
    if (!name || name.length < 3) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!["Male", "Female", "Others"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender." });
    }
    if (raceTime && !/^\d{2}:\d{2}:\d{2}$/.test(raceTime)) {
      return res
        .status(400)
        .json({ message: "Race time must be in HH:MM:SS format." });
    }
    if (startime && !/^\d{2}:\d{2}:\d{2}$/.test(startime)) {
      return res
        .status(400)
        .json({ message: "Start time must be in HH:MM:SS format." });
    }
    if (finishtime && !/^\d{2}:\d{2}:\d{2}$/.test(finishtime)) {
      return res
        .status(400)
        .json({ message: "Finish time must be in HH:MM:SS format." });
    }
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ message: "Event ID is required." });
    }

    const [userResult] = await db.execute(
      "SELECT id, fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }
    const userId = userResult[0].id;

    const [result] = await db.execute(
      `UPDATE resultmaster 
      SET registrationId = ?, bibno = ?, name = ?, startime = ?, finishtime = ?, raceTime = ?, 
      cP1 = ?, cP1Time = ?, cP2 = ?, cP2Time = ?, cP3 = ?, cP3Time = ?, cP4 = ?, cP4Time = ?, 
      cP5 = ?, cP5Time = ?, age = ?, gender = ?, participatein = ?, categoryId = ?, city = ?, 
      rfid1 = ?, rfid2 = ?, eventId = ?, CStartTime = ?, CRaceTime = ?, imageid = ?
      WHERE resultId = ? AND isactive = 1`,
      [
        registrationId || null,
        bibno,
        name,
        startime || null,
        finishtime || null,
        raceTime || null,
        cP1 || null,
        cP1Time || null,
        cP2 || null,
        cP2Time || null,
        cP3 || null,
        cP3Time || null,
        cP4 || null,
        cP4Time || null,
        cP5 || null,
        cP5Time || null,
        age || null,
        gender,
        participatein || null,
        categoryId || null,
        city || null,
        rfid1 || null,
        rfid2 || null,
        eventId,
        CStartTime || null,
        CRaceTime || null,
        imageid || null,
        parsedResultId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Result not found or has been deleted." });
    }

    res.status(200).json({ message: "Result updated successfully" });
  } catch (error) {
    console.error("Error updating result:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};

export const deleteResult = async (req, res) => {
  const { resultId } = req.params;
  const parsedResultId = parseInt(resultId, 10);

  if (isNaN(parsedResultId)) {
    return res
      .status(400)
      .json({ message: "Invalid resultId. It must be a number." });
  }

  try {
    const db = await connectToDatabase();
    const [existingResult] = await db.execute(
      "SELECT * FROM resultmaster WHERE resultId = ?",
      [parsedResultId]
    );
    if (existingResult.length === 0) {
      return res.status(404).json({ message: "Result not found." });
    }

    const entryYear = new Date(existingResult[0].entrydate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (entryYear !== currentYear) {
      return res
        .status(403)
        .json({ message: "Cannot delete past year results." });
    }

    const [result] = await db.execute(
      "DELETE FROM resultmaster WHERE resultId = ?",
      [parsedResultId]
    );

    console.log("<|USER: log: result of DELETE query:", result);

    res.status(200).json({ message: "Result deleted successfully" });
  } catch (error) {
    console.error("Error deleting result:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};
