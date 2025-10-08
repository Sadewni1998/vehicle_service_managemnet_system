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
  // Temporarily removing auth for testing - uncomment in production
  // ensureAuthenticated,
  // checkRole(["manager", "receptionist"]),
  invoiceController.generateInvoice
);

module.exports = router;
