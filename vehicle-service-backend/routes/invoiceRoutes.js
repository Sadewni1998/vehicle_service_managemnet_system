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

// Route to finalize an invoice and mark booking as completed (after verification)
// POST /api/invoices/:bookingId/finalize
router.post(
  "/:bookingId/finalize",
  ensureAuthenticated,
  checkRole(["manager"]),
  invoiceController.finalizeInvoice
);

module.exports = router;
