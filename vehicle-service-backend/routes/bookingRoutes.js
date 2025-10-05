// routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");
const { protect, checkRole } = require('../middleware/authMiddleware');
// Public routes (no authentication required)
// Route to get available time slots for a specific date
// GET /api/bookings/time-slots?date=2024-01-15
router.get("/time-slots", bookingController.getAvailableTimeSlots);

// Route to check daily booking availability
// GET /api/bookings/availability
router.get("/availability", bookingController.checkBookingAvailability);

// Apply authentication middleware to all other booking routes
router.use(ensureAuthenticated);

// Route to create a new booking
// POST /api/bookings
router.post("/", bookingController.createBooking);

// Route to get user's bookings
// GET /api/bookings/user
router.get("/user", bookingController.getUserBookings);

// Route to get all bookings (admin)
// GET /api/bookings
router.get("/", bookingController.getAllBookings);

// Route to get a single booking by its ID
// GET /api/bookings/12
router.get("/:bookingId", bookingController.getBookingById);

// Route to update an existing booking by its ID
// PUT /api/bookings/12
router.put("/:bookingId", bookingController.updateBooking);

// Route to update booking status
// PUT /api/bookings/12/status
router.put("/:bookingId/status", bookingController.updateBookingStatus);

// Route to delete a booking
// DELETE /api/bookings/12
router.delete("/:bookingId", bookingController.deleteBooking);

// Route to get booking statistics
// GET /api/bookings/stats
router.get("/stats", bookingController.getBookingStats);

// Route to get today's bookings for receptionist dashboard
// GET /api/bookings/today
router.get("/today", bookingController.getTodayBookings);

// === Public Route ===
router.post('/', bookingController.createBooking);

// === Customer-Only Route ===
router.get('/mybookings', ensureAuthenticated, bookingController.getUserBookings);

// === Staff-Only Routes (Receptionist, Manager, etc.) ===

// Get all bookings (for the dashboard)
router.get(
  '/', // This now becomes a protected route
  ensureAuthenticated,
  checkRole(['receptionist', 'manager']),
  bookingController.getAllBookings
);

// Accept or Reject a booking
router.patch( // Using PATCH is conventional for updating a single field
  '/:bookingId/status',
  ensureAuthenticated,
  checkRole(['receptionist', 'manager']),
  bookingController.updateBookingStatus
);

// Get a single booking by ID (can be for staff too)
router.get('/:bookingId', ensureAuthenticated, bookingController.getBookingById);

module.exports = router;
