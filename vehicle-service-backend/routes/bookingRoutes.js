// routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");

// Apply authentication middleware to all booking routes
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

module.exports = router;
