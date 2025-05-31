import { connectToDatabase } from "../config/database.js";

export const createCategory = async (req, res) => {
  const {
    category_name,
    category_description,
    from_age,
    to_age,
    is_active,
    event_id,
  } = req.body;

  console.log("Request Body:", req.body);

  if (
    !category_name ||
    !event_id ||
    typeof from_age !== "number" ||
    typeof to_age !== "number"
  ) {
    return res
      .status(400)
      .json({ message: "Required fields are missing or invalid." });
  }

  try {
    const db = await connectToDatabase();

    // Validate event_id
    const [events] = await db.execute(
      "SELECT event_id FROM event_master WHERE event_id = ?",
      [event_id]
    );
    if (events.length === 0) {
      return res.status(400).json({ message: "Invalid event ID." });
    }

    // Validate and fetch entry_by
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized user." });
    }
    const [users] = await db.execute(
      "SELECT fullname FROM usermaster WHERE id = ?",
      [req.user.id]
    );
    const entry_by = users[0]?.fullname || "Unknown";

    // Insert category
    const [result] = await db.execute(
      "INSERT INTO category_master (category_name, category_description, from_age, to_age, is_active, entry_by, entry_date, event_id) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)",
      [
        category_name,
        category_description || "No description provided", // Default value for category_description
        from_age,
        to_age,
        is_active === undefined ? 1 : is_active, // Default value for is_active
        entry_by,
        event_id,
      ]
    );

    res.status(201).json({
      message: "Category created successfully",
      categoryId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating category:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [categories] = await db.execute("SELECT * FROM category_master");
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCategoriesByEventType = async (req, res) => {
  const { eventType } = req.params;

  try {
    const db = await connectToDatabase();
    const [categories] = await db.execute(
      `SELECT cm.* 
       FROM category_master cm
       JOIN event_master em ON cm.event_id = em.event_id
       WHERE em.event_type = ?`,
      [eventType]
    );

    if (categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this event type." });
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories by event type:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCategoriesByEventId = async (req, res) => {
  const { eventId } = req.params;

  try {
    const db = await connectToDatabase();
    const [categories] = await db.execute(
      `SELECT cm.* 
       FROM category_master cm
       WHERE cm.event_id = ?`,
      [eventId]
    );

    if (categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this event." });
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories by event ID:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getEventTypes = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [eventTypes] = await db.execute(
      "SELECT DISTINCT event_type FROM event_master"
    );
    res.status(200).json(eventTypes);
  } catch (error) {
    console.error("Error fetching event types:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getEventsByEventType = async (req, res) => {
  const { eventType } = req.params;
  try {
    const db = await connectToDatabase();
    const [events] = await db.execute(
      "SELECT event_id, event_name FROM event_master WHERE event_type = ?",
      [eventType]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: "No events found for this type" });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCategory = async (req, res) => {
  const { categoryId } = req.params;
  const {
    category_name,
    category_description,
    from_age,
    to_age,
    is_active,
    event_id,
  } = req.body;

  const update_by = req.user.fullname; // Middleware se user ka fullname lo

  try {
    const db = await connectToDatabase();
    const [existingCategory] = await db.execute(
      "SELECT * FROM category_master WHERE category_id = ?",
      [categoryId]
    );

    if (existingCategory.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    const [result] = await db.execute(
      "UPDATE category_master SET category_name = ?, category_description = ?, from_age = ?, to_age = ?, is_active = ?, update_by = ?, event_id = ? WHERE category_id = ?",
      [
        category_name,
        category_description,
        from_age,
        to_age,
        is_active,
        update_by, // Using req.user.fullname
        event_id,
        categoryId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({ message: "Category updated successfully." });
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCategoryById = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const db = await connectToDatabase();
    const [category] = await db.execute(
      "SELECT * FROM category_master WHERE category_id = ?",
      [categoryId]
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json(category[0]);
  } catch (error) {
    console.error("Error fetching category details:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const db = await connectToDatabase();

    const [result] = await db.execute(
      "DELETE FROM category_master WHERE category_id = ?",
      [categoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
