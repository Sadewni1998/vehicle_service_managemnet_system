// routes/invoiceRoutes.js

const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const {
  ensureAuthenticated,
  checkRole,
} = require("../middleware/authMiddleware");

// Route to generate PDF invoice for a booking
// GET /api/invoices/:bookingId/generate
router.get(
  "/:bookingId/generate",
  ensureAuthenticated,
  checkRole(["manager"]),
  invoiceController.generateInvoice
);

// Route to get customer invoices
// GET /api/invoices/customer
router.get(
  "/customer",
  ensureAuthenticated,
  checkRole(["customer"]),
  invoiceController.getCustomerInvoices
);

// Route to download existing invoice PDF for customers
// GET /api/invoices/:bookingId/download
router.get(
  "/:bookingId/download",
  ensureAuthenticated,
  checkRole(["customer"]),
  invoiceController.downloadCustomerInvoice
);

// Route to finalize an invoice and mark booking as completed (after verification)
// POST /api/invoices/:bookingId/finalize
router.post(
  "/:bookingId/finalize",
  ensureAuthenticated,
  checkRole(["manager"]),
  invoiceController.finalizeInvoice
);

module.exports = router;
