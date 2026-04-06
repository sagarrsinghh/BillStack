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

let connection = null;
let connectPromise = null;
let schemaEnsured = false;

const logConnectionError = (err) => {
  console.error("DB connection failed:", {
    message: err.message,
    code: err.code,
    host: connectionConfig.host,
    port: connectionConfig.port,
    database: connectionConfig.database,
  });
};

const handleConnectionError = (err) => {
  if (!err) {
    return;
  }

  console.error("MySQL connection error:", err.message);

  if (err.fatal) {
    connection = null;
    connectPromise = null;
  }
};

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
  if (schemaEnsured) {
    return;
  }

  schemaEnsured = true;

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

const connect = async () => {
  if (connection) {
    return connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise((resolve, reject) => {
    const nextConnection = mysql.createConnection(connectionConfig);

    nextConnection.connect((err) => {
      if (err) {
        logConnectionError(err);
        connectPromise = null;
        return reject(err);
      }

      connection = nextConnection;
      connectPromise = null;

      connection.on("error", handleConnectionError);

      console.log("MySQL Connected");
      ensureMasterStatusColumns();
      resolve(connection);
    });
  });

  return connectPromise;
};

const withReconnect = async (operation) => {
  try {
    await connect();
    return await operation(connection);
  } catch (err) {
    if (err && err.fatal) {
      connection = null;
      connectPromise = null;
      await connect();
      return operation(connection);
    }

    throw err;
  }
};

connect().catch(() => {});

module.exports = {
  query(sql, params, callback) {
    const values = Array.isArray(params) ? params : [];
    const done = typeof params === "function" ? params : callback;

    withReconnect(
      (activeConnection) =>
        new Promise((resolve, reject) => {
          activeConnection.query(sql, values, (err, result) => {
            if (err) {
              return reject(err);
            }

            resolve(result);
          });
        })
    )
      .then((result) => done?.(null, result))
      .catch((err) => done?.(err));
  },

  beginTransaction(callback) {
    withReconnect(
      (activeConnection) =>
        new Promise((resolve, reject) => {
          activeConnection.beginTransaction((err) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        })
    )
      .then(() => callback?.(null))
      .catch((err) => callback?.(err));
  },

  commit(callback) {
    withReconnect(
      (activeConnection) =>
        new Promise((resolve, reject) => {
          activeConnection.commit((err) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        })
    )
      .then(() => callback?.(null))
      .catch((err) => callback?.(err));
  },

  rollback(callback) {
    if (!connection) {
      callback?.();
      return;
    }

    connection.rollback(() => callback?.());
  },
};
