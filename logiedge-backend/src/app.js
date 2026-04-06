
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("./config/db");

const express = require("express");
const cors = require("cors");

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOriginPatterns = [
  /^http:\/\/localhost:(3000|5173)$/,
  /^https:\/\/front-end-app-[a-z0-9]+\.onrender\.com$/,
];

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  if (corsOrigins.includes(origin)) {
    return true;
  }

  return defaultAllowedOriginPatterns.some((pattern) => pattern.test(origin));
};

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json());

const customerRoutes = require("./routes/customerRoutes");
const itemRoutes = require("./routes/itemRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

app.get("/", (req, res) => {
  res.send("API Running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "logiedge-backend" });
});

app.use("/api/customers", customerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
