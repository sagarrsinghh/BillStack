const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const normalizeStatus = (status) => {
  const value = String(status || "active").toLowerCase();
  return value === "inactive" ? "inactive" : "active";
};

exports.createItem = async (req, res) => {
  const { name, price, status = "active" } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: "Price must be a valid number" });
  }

  try {
    const result = await queryAsync(
      `
        INSERT INTO items (name, price, status)
        VALUES (?, ?, ?)
      `,
      [String(name).trim(), numericPrice, normalizeStatus(status)]
    );

    const created = await queryAsync("SELECT * FROM items WHERE id = ?", [result.insertId]);

    res.status(201).json({
      message: "Item created successfully",
      itemId: result.insertId,
      item: created[0] || null,
    });
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ message: "Error creating item" });
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await queryAsync("SELECT * FROM items ORDER BY name ASC");
    res.status(200).json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Error fetching items" });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const rows = await queryAsync("SELECT * FROM items WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Error fetching item" });
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, price, status } = req.body;

  try {
    const existingRows = await queryAsync("SELECT * FROM items WHERE id = ?", [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const existing = existingRows[0];
    const nextName = name !== undefined ? String(name).trim() : existing.name;
    const nextPrice = price !== undefined ? Number(price) : Number(existing.price);
    const nextStatus = status !== undefined ? normalizeStatus(status) : normalizeStatus(existing.status);

    if (!nextName) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }

    await queryAsync(
      `
        UPDATE items
        SET name = ?, price = ?, status = ?
        WHERE id = ?
      `,
      [nextName, nextPrice, nextStatus, id]
    );

    const updated = await queryAsync("SELECT * FROM items WHERE id = ?", [id]);
    res.status(200).json({
      message: "Item updated successfully",
      item: updated[0] || null,
    });
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ message: "Error updating item" });
  }
};

exports.deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const existingRows = await queryAsync("SELECT * FROM items WHERE id = ?", [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    await queryAsync("UPDATE items SET status = 'inactive' WHERE id = ?", [id]);

    res.status(200).json({
      message: "Item deactivated successfully",
    });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ message: "Error deleting item" });
  }
};
