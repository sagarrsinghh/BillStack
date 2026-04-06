const express = require("express");
const router = express.Router();

const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByCustomer,
  deleteInvoice,
} = require("../controllers/invoiceController");

// POST
router.post("/", createInvoice);

// GET
router.get("/", getAllInvoices);
router.get("/customer/:customerId", getInvoicesByCustomer);
router.get("/:id", getInvoiceById);
router.delete("/:id", deleteInvoice);

module.exports = router;
