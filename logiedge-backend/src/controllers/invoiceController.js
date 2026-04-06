const db = require("../config/db");

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const beginTransaction = () =>
  new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const commitTransaction = () =>
  new Promise((resolve, reject) => {
    db.commit((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

const rollbackTransaction = () =>
  new Promise((resolve) => {
    db.rollback(() => resolve());
  });

const generateInvoiceId = () => `INVC${Math.floor(100000 + Math.random() * 900000)}`;

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") return ["true", "yes", "y", "active"].includes(value.toLowerCase());
  return Boolean(value);
};

const normalizeRows = (rows) => rows.map((row) => ({ ...row }));

const loadInvoiceLineItems = async (invoiceId) => {
  const rows = await queryAsync(
    `
      SELECT
        ii.invoice_id,
        ii.item_id,
        ii.quantity,
        ii.price,
        i.name,
        i.status
      FROM invoice_items ii
      LEFT JOIN items i ON i.id = ii.item_id
      WHERE ii.invoice_id = ?
      ORDER BY ii.id ASC
    `,
    [invoiceId]
  );

  return rows.map((row) => ({
    invoice_id: row.invoice_id,
    item_id: row.item_id,
    quantity: row.quantity,
    price: row.price,
    name: row.name,
    status: row.status,
    lineTotal: Number(row.price) * Number(row.quantity),
  }));
};

const loadInvoiceDetailByColumn = async (column, value) => {
  const invoices = await queryAsync(
    `
      SELECT
        i.*,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        c.gst_registered AS customer_gst_registered,
        c.status AS customer_status
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE i.${column} = ?
      LIMIT 1
    `,
    [value]
  );

  if (invoices.length === 0) {
    return null;
  }

  const invoice = invoices[0];
  const lineItems = await loadInvoiceLineItems(invoice.id);

  return {
    ...invoice,
    customer_gst_registered: toBoolean(invoice.customer_gst_registered),
    line_items: lineItems,
  };
};

const attachLineItems = async (invoices) =>
  Promise.all(
    invoices.map(async (invoice) => ({
      ...invoice,
      customer_gst_registered: toBoolean(invoice.customer_gst_registered),
      line_items: await loadInvoiceLineItems(invoice.id),
    }))
  );

exports.createInvoice = async (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const normalizedItems = items.map((item) => ({
    item_id: Number(item.item_id),
    quantity: Number(item.quantity),
  }));

  if (normalizedItems.some((item) => !Number.isInteger(item.item_id) || item.item_id <= 0 || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
    return res.status(400).json({ message: "Each item must include a valid item_id and quantity" });
  }

  try {
    await beginTransaction();

    const customers = await queryAsync("SELECT * FROM customers WHERE id = ? LIMIT 1", [customer_id]);
    if (customers.length === 0) {
      await rollbackTransaction();
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = customers[0];
    if (String(customer.status || "active").toLowerCase() !== "active") {
      await rollbackTransaction();
      return res.status(400).json({ message: "Selected customer is inactive" });
    }

    const productRows = await Promise.all(
      normalizedItems.map(async (item) => {
        const rows = await queryAsync("SELECT * FROM items WHERE id = ? LIMIT 1", [item.item_id]);
        return { request: item, product: rows[0] || null };
      })
    );

    const invalidItem = productRows.find(({ product }) => !product);
    if (invalidItem) {
      await rollbackTransaction();
      return res.status(404).json({ message: `Item ${invalidItem.request.item_id} not found` });
    }

    const inactiveItem = productRows.find(({ product }) => String(product.status || "active").toLowerCase() !== "active");
    if (inactiveItem) {
      await rollbackTransaction();
      return res.status(400).json({ message: `Item ${inactiveItem.request.item_id} is inactive` });
    }

    const lineItems = productRows.map(({ request, product }) => ({
      item_id: request.item_id,
      quantity: request.quantity,
      price: Number(product.price),
      name: product.name,
      lineTotal: Number(product.price) * request.quantity,
    }));

    const total = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const gst = toBoolean(customer.gst_registered) ? 0 : total * 0.18;
    const finalAmount = total + gst;
    const invoiceId = generateInvoiceId();

    const invoiceResult = await queryAsync(
      `
        INSERT INTO invoices (invoice_id, customer_id, total_amount, gst_amount, final_amount)
        VALUES (?, ?, ?, ?, ?)
      `,
      [invoiceId, customer_id, total, gst, finalAmount]
    );

    const invoiceDbId = invoiceResult.insertId;

    for (const lineItem of lineItems) {
      await queryAsync(
        `
          INSERT INTO invoice_items (invoice_id, item_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `,
        [invoiceDbId, lineItem.item_id, lineItem.quantity, lineItem.price]
      );
    }

    await commitTransaction();

    res.status(201).json({
      message: "Invoice created successfully",
      id: invoiceDbId,
      invoiceId,
      customer_id: Number(customer_id),
      total,
      gst,
      finalAmount,
      lineItems,
    });
  } catch (error) {
    await rollbackTransaction();
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Error creating invoice" });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await queryAsync(
      `
        SELECT
          i.*,
          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          c.gst_registered AS customer_gst_registered,
          c.status AS customer_status
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        ORDER BY i.created_at DESC
      `
    );

    res.status(200).json(await attachLineItems(normalizeRows(invoices)));
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ message: "Error fetching invoices" });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const identifier = req.params.id;
    const numericId = Number(identifier);
    const invoice = Number.isFinite(numericId)
      ? await loadInvoiceDetailByColumn("id", numericId)
      : await loadInvoiceDetailByColumn("invoice_id", identifier);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ message: "Error fetching invoice" });
  }
};

exports.getInvoicesByCustomer = async (req, res) => {
  const { customerId } = req.params;

  try {
    const invoices = await queryAsync(
      `
        SELECT
          i.*,
          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          c.gst_registered AS customer_gst_registered,
          c.status AS customer_status
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        WHERE i.customer_id = ?
        ORDER BY i.created_at DESC
      `,
      [customerId]
    );

    res.status(200).json(await attachLineItems(normalizeRows(invoices)));
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ message: "Error fetching invoices" });
  }
};

exports.deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    await beginTransaction();

    const rows = await queryAsync("SELECT * FROM invoices WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) {
      await rollbackTransaction();
      return res.status(404).json({ message: "Invoice not found" });
    }

    await queryAsync("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);
    await queryAsync("DELETE FROM invoices WHERE id = ?", [id]);

    await commitTransaction();
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (err) {
    await rollbackTransaction();
    console.error("Error deleting invoice:", err);
    res.status(500).json({ message: "Error deleting invoice" });
  }
};
