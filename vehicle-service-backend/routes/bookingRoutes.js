// routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const {
  ensureAuthenticated,
  checkRole,
} = require("../middleware/authMiddleware");

// === Public Routes (no authentication required) ===
// Route to get available time slots for a specific date
// GET /api/bookings/time-slots?date=2024-01-15
router.get("/time-slots", bookingController.getAvailableTimeSlots);

// Route to check daily booking availability
// GET /api/bookings/availability
router.get("/availability", bookingController.checkBookingAvailability);

// Route to create a new booking (authenticated customers only)
// POST /api/bookings
router.post("/", ensureAuthenticated, bookingController.createBooking);

// === Staff-Only Routes (Receptionist, Manager, etc.) ===
// Get all bookings (for the dashboard)
// GET /api/bookings
router.get(
  "/",
  ensureAuthenticated,
  checkRole(["receptionist", "manager"]),
  bookingController.getAllBookings
);

// Route to get today's bookings for receptionist dashboard
// GET /api/bookings/today
// Temporarily made public for testing - should be protected in production
router.get(
  "/today",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.getTodayBookings
);

// Route to get arrived bookings for service advisor
// GET /api/bookings/arrived
// Temporarily made public for testing - should be protected in production
router.get(
  "/arrived",
  ensureAuthenticated,
  checkRole(["service_advisor", "manager"]),
  bookingController.getArrivedBookings
);

// Route to assign mechanics to a booking
// PUT /api/bookings/:bookingId/assign-mechanics
// Temporarily made public for testing - should be protected in production
router.put(
  "/:bookingId/assign-mechanics",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.assignMechanicsToBooking
);

// Route to assign spare parts to a booking
// PUT /api/bookings/:bookingId/assign-spare-parts
// Temporarily made public for testing - should be protected in production
router.put(
  "/:bookingId/assign-spare-parts",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.assignSparePartsToBooking
);

// Route to submit/finalize a jobcard so it appears on assigned mechanics' dashboards
// PUT /api/bookings/:bookingId/submit-jobcard
// Temporarily made public for testing - should be protected in production
router.put(
  "/:bookingId/submit-jobcard",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.submitJobcard
);

// Route to get booking statistics
// GET /api/bookings/stats
// Temporarily made public for testing - should be protected in production
router.get(
  "/stats",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.getBookingStats
);

// === Customer-Only Routes ===
// Route to get user's bookings
// GET /api/bookings/user
router.get("/user", ensureAuthenticated, bookingController.getUserBookings);

// Route to get a single booking by its ID (customer can view their own)
// GET /api/bookings/12
router.get(
  "/:bookingId",
  ensureAuthenticated,
  bookingController.getBookingById
);

// Route to update an existing booking by its ID (customer can update their own)
// PUT /api/bookings/12
router.put("/:bookingId", ensureAuthenticated, bookingController.updateBooking);

// Route to delete a booking (customer can delete their own)
// DELETE /api/bookings/12
router.delete(
  "/:bookingId",
  ensureAuthenticated,
  bookingController.deleteBooking
);

// Route to update booking status (staff only)
// PUT /api/bookings/12/status
// Temporarily made public for testing - should be protected in production
router.put(
  "/:bookingId/status",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.updateBookingStatus
);

// Route to update kilometers run for a booking (Receptionist enters at check-in)
// PUT /api/bookings/:bookingId/kilometers
router.put(
  "/:bookingId/kilometers",
  ensureAuthenticated,
  checkRole(["receptionist", "manager", "service_advisor"]),
  bookingController.updateKilometersRun
);

module.exports = router;
