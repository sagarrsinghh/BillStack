const mysql = require("mysql2");

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["true", "1", "yes", "y"].includes(value.toLowerCase());
};

const buildSslConfig = () => {
  if (!parseBoolean(process.env.DB_SSL)) {
    return undefined;
  }

  if (parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED)) {
    return { rejectUnauthorized: true };
  }

  return { rejectUnauthorized: false };
};

const connectionConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: buildSslConfig(),
};

const connection = mysql.createConnection(connectionConfig);

connection.connect((err) => {
  if (err) {
    console.error("DB connection failed:", {
      message: err.message,
      code: err.code,
      host: connectionConfig.host,
      port: connectionConfig.port,
      database: connectionConfig.database,
    });
  } else {
    console.log("MySQL Connected");
    ensureMasterStatusColumns();
  }
});

const ensureColumn = (table, column, definition, callback) => {
  connection.query(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [process.env.DB_NAME, table, column],
    (err, result) => {
      if (err) {
        console.error(`Failed to inspect ${table}.${column}:`, err);
        return callback?.(err);
      }

      if (result[0].count > 0) {
        return callback?.();
      }

      connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add ${table}.${column}:`, alterErr);
          return callback?.(alterErr);
        }

        console.log(`Added missing column ${table}.${column}`);
        callback?.();
      });
    }
  );
};

const ensureMasterStatusColumns = () => {
  ensureColumn(
    "customers",
    "status",
    "VARCHAR(12) NOT NULL DEFAULT 'active' AFTER gst_registered"
  );
  ensureColumn(
    "items",
    "status",
    "VARCHAR(12) NOT NULL DEFAULT 'active' AFTER price"
  );
};

module.exports = connection;
