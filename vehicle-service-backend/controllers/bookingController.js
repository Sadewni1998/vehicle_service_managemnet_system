// controllers/bookingController.js

const db = require("../config/db");

/**
 * Creates a new service booking.
 */
const createBooking = async (req, res) => {
  // Get customerId from authenticated user
  const customerId = req.user.customerId;
  
  // Destructure all fields from the request body
  const {
    name,
    phone,
    vehicleNumber,
    engineNumber,
    vehicleType,
    fuelType,
    vehicleBrand,
    vehicleBrandModel,
    manufacturedYear,
    transmissionType,
    oilType,
    oilFilterType,
    kilometersRun,
    bookingDate,
    serviceTypes,
    specialRequests,
    promoCode,
  } = req.body;

  // Basic validation
  if (!name || !phone || !vehicleNumber || !bookingDate) {
    return res.status(400).json({
      message: "Name, phone, vehicle number, and booking date are required.",
    });
  }

  // Check daily booking limit (10 bookings per day)
  const DAILY_BOOKING_LIMIT = 10;
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  try {
    // Check how many bookings exist for today
    const [countResult] = await db.query(
      "SELECT COUNT(*) as count FROM booking WHERE DATE(bookingDate) = ?",
      [today]
    );
    
    const todayBookings = countResult[0].count;
    
    if (todayBookings >= DAILY_BOOKING_LIMIT) {
      return res.status(429).json({
        message: `Sorry, we have reached our daily booking limit of ${DAILY_BOOKING_LIMIT} bookings. Please try again tomorrow.`,
        limitReached: true,
        currentCount: todayBookings,
        limit: DAILY_BOOKING_LIMIT
      });
    }
    const sql = `
      INSERT INTO booking (
        name, phone, vehicleNumber, engineNumber, vehicleType, fuelType,
        vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType,
        oilType, oilFilterType, kilometersRun, bookingDate, serviceTypes,
        specialRequests, promoCode, customerId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // The 'serviceTypes' array from the frontend is converted to a JSON string for storage.
    const values = [
      name,
      phone,
      vehicleNumber,
      engineNumber,
      vehicleType,
      fuelType,
      vehicleBrand,
      vehicleBrandModel,
      manufacturedYear,
      transmissionType,
      oilType,
      oilFilterType,
      kilometersRun,
      bookingDate,
      JSON.stringify(serviceTypes || []),
      specialRequests,
      promoCode,
      customerId,
      'pending' // Default status
    ];

    const [result] = await db.query(sql, values);

    res.status(201).json({
      message: "Booking created successfully!",
      bookingId: result.insertId,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server error during booking creation." });
  }
};

/**
 * Updates an existing service booking.
 */
const updateBooking = async (req, res) => {
  const { bookingId } = req.params; // Get the bookingId from the URL (e.g., /api/bookings/12)
  const fieldsToUpdate = req.body;

  // If serviceTypes is being updated, it must be stringified
  if (fieldsToUpdate.serviceTypes) {
    fieldsToUpdate.serviceTypes = JSON.stringify(fieldsToUpdate.serviceTypes);
  }

  try {
    const sql = "UPDATE booking SET ? WHERE bookingId = ?";

    const [result] = await db.query(sql, [fieldsToUpdate, bookingId]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or no new data to update." });
    }

    res.status(200).json({ message: "Booking updated successfully!" });
  } catch (error) {
    console.error("Booking update error:", error);
    res.status(500).json({ message: "Server error during booking update." });
  }
};

// I'm also including these helper functions which you will find very useful

/**
 * Get all bookings.
 */
const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      "SELECT * FROM booking ORDER BY bookingDate DESC"
    );
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error while fetching bookings." });
  }
};

/**
 * Get a single booking by its ID.
 */
const getBookingById = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM booking WHERE bookingId = ?", [
      bookingId,
    ]);
    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error while fetching booking." });
  }
};

/**
 * Gets all bookings for the currently logged-in user and returns a structured response.
 */
const getUserBookings = async (req, res) => {
  // The 'protect' middleware gives us the logged-in user's details
  const customerId = req.user.customerId;

  try {
    // Fetch the bookings from the database
    const sql =
      "SELECT * FROM booking WHERE customerId = ? ORDER BY bookingDate DESC";
    const [bookings] = await db.query(sql, [customerId]);

    // Send a structured, user-friendly response
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings.",
    });
  }
};

/**
 * Update booking status
 */
const updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE booking SET status = ? WHERE bookingId = ?",
      [status, bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking status updated successfully" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete a booking
 */
const deleteBooking = async (req, res) => {
  const { bookingId } = req.params;
  const customerId = req.user.customerId;

  try {
    const [result] = await db.query(
      "DELETE FROM booking WHERE bookingId = ? AND customerId = ?",
      [bookingId, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get booking statistics
 */
const getBookingStats = async (req, res) => {
  try {
    const [totalBookings] = await db.query("SELECT COUNT(*) as total FROM booking");
    const [pendingBookings] = await db.query("SELECT COUNT(*) as pending FROM booking WHERE status = 'pending'");
    const [completedBookings] = await db.query("SELECT COUNT(*) as completed FROM booking WHERE status = 'completed'");
    const [cancelledBookings] = await db.query("SELECT COUNT(*) as cancelled FROM booking WHERE status = 'cancelled'");

    res.json({
      total: totalBookings[0].total,
      pending: pendingBookings[0].pending,
      completed: completedBookings[0].completed,
      cancelled: cancelledBookings[0].cancelled
    });
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check daily booking availability
 */
const checkBookingAvailability = async (req, res) => {
  const DAILY_BOOKING_LIMIT = 10;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [countResult] = await db.query(
      "SELECT COUNT(*) as count FROM booking WHERE DATE(bookingDate) = ?",
      [today]
    );
    
    const todayBookings = countResult[0].count;
    const isAvailable = todayBookings < DAILY_BOOKING_LIMIT;
    const remainingSlots = Math.max(0, DAILY_BOOKING_LIMIT - todayBookings);

    res.json({
      isAvailable,
      currentCount: todayBookings,
      limit: DAILY_BOOKING_LIMIT,
      remainingSlots,
      message: isAvailable 
        ? `${remainingSlots} booking slots remaining for today`
        : `Daily booking limit of ${DAILY_BOOKING_LIMIT} reached. Please try again tomorrow.`
    });
  } catch (error) {
    console.error("Error checking booking availability:", error);
    res.status(500).json({ message: "Server error checking booking availability" });
  }
};

module.exports = {
  createBooking,
  updateBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
  checkBookingAvailability,
};
