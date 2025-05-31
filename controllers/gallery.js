import { connectToDatabase } from "../config/database.js";

const validateURL = (url) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/;
  return urlRegex.test(url);
};

const validateGalleryFields = (fields) => {
  const { header_image, heading, description_title, description_text, images } =
    fields;
  if (
    !header_image ||
    !heading ||
    !description_title ||
    !description_text ||
    !images
  ) {
    return "All fields are required.";
  }
  if (!validateURL(header_image)) {
    return "Header image must be a valid URL.";
  }
  if (heading.length < 3 || heading.length > 100) {
    return "Heading must be between 3 and 100 characters.";
  }
  if (description_title.length < 3 || description_title.length > 100) {
    return "Description title must be between 3 and 100 characters.";
  }
  if (description_text.length < 10 || description_text.length > 1000) {
    return "Description text must be between 10 and 1000 characters.";
  }
  if (!Array.isArray(images) || images.length === 0) {
    return "Images must be a non-empty array.";
  }
  for (const image of images) {
    if (!image.src || !validateURL(image.src)) {
      return "Each image must have a valid source URL.";
    }
    if (!image.alt || image.alt.length < 3 || image.alt.length > 255) {
      return "Each image must have an alt text between 3 and 255 characters.";
    }
    if (
      image.caption &&
      (image.caption.length < 3 || image.caption.length > 255)
    ) {
      return "Image captions, if provided, must be between 3 and 255 characters.";
    }
    if (
      image.category &&
      (image.category.length < 3 || image.category.length > 50)
    ) {
      return "Image categories, if provided, must be between 3 and 50 characters.";
    }
  }
  return null;
};

export const getGallery = async (req, res) => {
  try {
    const db = await connectToDatabase();
    const [galleryResult] = await db.execute(
      `SELECT * FROM gallery WHERE is_active = 1 LIMIT 1`
    );

    if (galleryResult.length === 0) {
      return res.status(200).json({});
    }

    const [imagesResult] = await db.execute(
      `SELECT * FROM gallery_images WHERE gallery_id = ? AND is_active = 1`,
      [galleryResult[0].gallery_id]
    );

    res.status(200).json({
      ...galleryResult[0],
      images: imagesResult,
    });
  } catch (error) {
    console.error("Error fetching gallery:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createGallery = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can create galleries." });
  }

  const { header_image, heading, description_title, description_text, images } =
    req.body;

  const validationError = validateGalleryFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  let connection;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const entry_by = req.user.fullname || "unknown";

    const [galleryResult] = await connection.execute(
      `INSERT INTO gallery (header_image, heading, description_title, description_text, entry_by, entry_date, is_active)
       VALUES (?, ?, ?, ?, ?, NOW(), 1)`,
      [header_image, heading, description_title, description_text, entry_by]
    );
    const gallery_id = galleryResult.insertId;

    for (const image of images) {
      await connection.execute(
        `INSERT INTO gallery_images (gallery_id, src, alt, caption, category, entry_by, entry_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)`,
        [
          gallery_id,
          image.src,
          image.alt,
          image.caption || null,
          image.category || null,
          entry_by,
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Gallery created successfully.",
      galleryId: gallery_id,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating gallery:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};

export const updateGallery = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can update galleries." });
  }

  const { galleryId } = req.params;
  const { header_image, heading, description_title, description_text, images } =
    req.body;

  const validationError = validateGalleryFields(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  let connection;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const update_by = req.user.fullname || "unknown";

    const [galleryResult] = await connection.execute(
      `UPDATE gallery 
       SET header_image = ?, heading = ?, description_title = ?, description_text = ?, update_by = ?, updated_date = NOW()
       WHERE gallery_id = ? AND is_active = 1`,
      [
        header_image,
        heading,
        description_title,
        description_text,
        update_by,
        galleryId,
      ]
    );

    if (galleryResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Gallery not found." });
    }

    // Soft delete existing images
    await connection.execute(
      `UPDATE gallery_images SET is_active = 0 WHERE gallery_id = ?`,
      [galleryId]
    );

    // Insert new images
    for (const image of images) {
      await connection.execute(
        `INSERT INTO gallery_images (gallery_id, src, alt, caption, category, entry_by, entry_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)`,
        [
          galleryId,
          image.src,
          image.alt,
          image.caption || null,
          image.category || null,
          update_by,
        ]
      );
    }

    await connection.commit();

    res.status(200).json({ message: "Gallery updated successfully." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating gallery:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteGallery = async (req, res) => {
  if (req.user.isAdmin !== 1) {
    return res
      .status(403)
      .json({ message: "Only admins can delete galleries." });
  }

  const { galleryId } = req.params;

  try {
    const db = await connectToDatabase();
    const [result] = await db.execute(
      `UPDATE gallery SET is_active = 0 WHERE gallery_id = ?`,
      [galleryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Gallery not found." });
    }

    // Soft delete associated images
    await db.execute(
      `UPDATE gallery_images SET is_active = 0 WHERE gallery_id = ?`,
      [galleryId]
    );

    res.status(200).json({ message: "Gallery deleted successfully." });
  } catch (error) {
    console.error("Error deleting gallery:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
