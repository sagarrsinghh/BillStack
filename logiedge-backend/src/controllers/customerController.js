const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") return ["true", "yes", "y", "active"].includes(value.toLowerCase());
  return Boolean(value);
};

const normalizeStatus = (status) => {
  const value = String(status || "active").toLowerCase();
  return value === "inactive" ? "inactive" : "active";
};

exports.createCustomer = async (req, res) => {
  const { name, email, phone, gst_registered, status = "active" } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const result = await queryAsync(
      `
        INSERT INTO customers (name, email, phone, gst_registered, status)
        VALUES (?, ?, ?, ?, ?)
      `,
      [String(name).trim(), email || null, phone || null, toBoolean(gst_registered), normalizeStatus(status)]
    );

    const created = await queryAsync("SELECT * FROM customers WHERE id = ?", [result.insertId]);

    res.status(201).json({
      message: "Customer created successfully",
      customerId: result.insertId,
      customer: created[0] || null,
    });
  } catch (err) {
    console.error("Error creating customer:", err);
    res.status(500).json({ message: "Error creating customer" });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await queryAsync("SELECT * FROM customers ORDER BY name ASC");
    res.status(200).json(customers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Error fetching customers" });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const rows = await queryAsync("SELECT * FROM customers WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching customer:", err);
    res.status(500).json({ message: "Error fetching customer" });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, gst_registered, status } = req.body;

  try {
    const existingRows = await queryAsync("SELECT * FROM customers WHERE id = ?", [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const existing = existingRows[0];
    const nextName = name !== undefined ? String(name).trim() : existing.name;
    const nextEmail = email !== undefined ? email : existing.email;
    const nextPhone = phone !== undefined ? phone : existing.phone;
    const nextGst = gst_registered !== undefined ? toBoolean(gst_registered) : toBoolean(existing.gst_registered);
    const nextStatus = status !== undefined ? normalizeStatus(status) : normalizeStatus(existing.status);

    if (!nextName) {
      return res.status(400).json({ message: "Name is required" });
    }

    await queryAsync(
      `
        UPDATE customers
        SET name = ?, email = ?, phone = ?, gst_registered = ?, status = ?
        WHERE id = ?
      `,
      [nextName, nextEmail || null, nextPhone || null, nextGst, nextStatus, id]
    );

    const updated = await queryAsync("SELECT * FROM customers WHERE id = ?", [id]);
    res.status(200).json({
      message: "Customer updated successfully",
      customer: updated[0] || null,
    });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ message: "Error updating customer" });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;

  try {
    const existingRows = await queryAsync("SELECT * FROM customers WHERE id = ?", [id]);

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await queryAsync("UPDATE customers SET status = 'inactive' WHERE id = ?", [id]);

    res.status(200).json({
      message: "Customer deactivated successfully",
    });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ message: "Error deleting customer" });
  }
};
