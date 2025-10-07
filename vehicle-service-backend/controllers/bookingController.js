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
    vehicleType,
    fuelType,
    vehicleBrand,
    vehicleBrandModel,
    manufacturedYear,
    transmissionType,
    bookingDate,
    timeSlot,
    serviceTypes,
    specialRequests,
  } = req.body;

  // Basic validation
  if (!name || !phone || !vehicleNumber || !bookingDate || !timeSlot) {
    return res.status(400).json({
      message:
        "Name, phone, vehicle number, booking date, and time slot are required.",
    });
  }

  // Check if the selected time slot is available for the booking date
  try {
    const [timeSlotResult] = await db.query(
      "SELECT bookingId FROM booking WHERE bookingDate = ? AND timeSlot = ?",
      [bookingDate, timeSlot]
    );

    if (timeSlotResult.length > 0) {
      return res.status(409).json({
        message: `The selected time slot "${timeSlot}" is already booked for ${bookingDate}. Please choose a different time slot.`,
        conflict: true,
        timeSlot: timeSlot,
        bookingDate: bookingDate,
      });
    }
  } catch (error) {
    console.error("Time slot availability check error:", error);
    return res
      .status(500)
      .json({ message: "Server error checking time slot availability." });
  }

  // Check daily booking limit (8 bookings per day)
  const DAILY_BOOKING_LIMIT = 8;
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

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
        limit: DAILY_BOOKING_LIMIT,
      });
    }
    const sql = `
      INSERT INTO booking (
        name, phone, vehicleNumber, vehicleType, fuelType,
        vehicleBrand, vehicleBrandModel, manufacturedYear, transmissionType,
        bookingDate, timeSlot, serviceTypes,
        specialRequests, customerId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // The 'serviceTypes' array from the frontend is converted to a JSON string for storage.
    const values = [
      name,
      phone,
      vehicleNumber,
      vehicleType,
      fuelType,
      vehicleBrand,
      vehicleBrandModel,
      manufacturedYear,
      transmissionType,
      bookingDate,
      timeSlot,
      JSON.stringify(serviceTypes || []),
      specialRequests,
      customerId,
      "pending", // Default status
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
    const [totalBookings] = await db.query(
      "SELECT COUNT(*) as total FROM booking"
    );
    const [pendingBookings] = await db.query(
      "SELECT COUNT(*) as pending FROM booking WHERE status = 'pending'"
    );
    const [completedBookings] = await db.query(
      "SELECT COUNT(*) as completed FROM booking WHERE status = 'completed'"
    );
    const [cancelledBookings] = await db.query(
      "SELECT COUNT(*) as cancelled FROM booking WHERE status = 'cancelled'"
    );

    res.json({
      total: totalBookings[0].total,
      pending: pendingBookings[0].pending,
      completed: completedBookings[0].completed,
      cancelled: cancelledBookings[0].cancelled,
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
  const DAILY_BOOKING_LIMIT = 8;
  const today = new Date().toISOString().split("T")[0];

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
        : `Daily booking limit of ${DAILY_BOOKING_LIMIT} reached. Please try again tomorrow.`,
    });
  } catch (error) {
    console.error("Error checking booking availability:", error);
    res
      .status(500)
      .json({ message: "Server error checking booking availability" });
  }
};

/**
 * Get available time slots for a specific date
 */
const getAvailableTimeSlots = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date parameter is required" });
  }

  // Define all available time slots
  const allTimeSlots = [
    "07:30 AM - 09:00 AM",
    "09:00 AM - 10:30 AM",
    "10:30 AM - 12:00 PM",
    "12:30 PM - 02:00 PM",
    "02:00 PM - 03:30 PM",
    "03:30 PM - 05:00 PM",
    "05:00 PM - 06:30 PM",
    "06:30 PM - 07:30 PM",
  ];

  try {
    // Get booked time slots for the specified date
    const [bookedSlots] = await db.query(
      "SELECT timeSlot FROM booking WHERE bookingDate = ?",
      [date]
    );

    const bookedTimeSlots = bookedSlots.map((slot) => slot.timeSlot);
    const availableTimeSlots = allTimeSlots.filter(
      (slot) => !bookedTimeSlots.includes(slot)
    );

    res.json({
      date: date,
      availableTimeSlots: availableTimeSlots,
      bookedTimeSlots: bookedTimeSlots,
      totalSlots: allTimeSlots.length,
      availableCount: availableTimeSlots.length,
      bookedCount: bookedTimeSlots.length,
    });
  } catch (error) {
    console.error("Error fetching available time slots:", error);
    res
      .status(500)
      .json({ message: "Server error fetching available time slots" });
  }
};

/**
 * Updates the status of a booking (e.g., to 'Confirmed' or 'Rejected').
 * This is a protected action for staff like receptionists.
 */
const updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  // Validate the status
  const allowedStatuses = [
    "pending",
    "arrived",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
  ];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "A valid status is required." });
  }

  try {
    let sql, values;

    // If status is 'arrived', also set the arrivedTime
    if (status === "arrived") {
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      sql =
        "UPDATE booking SET status = ?, arrivedTime = ? WHERE bookingId = ?";
      values = [status, currentTime, bookingId];
    } else {
      sql = "UPDATE booking SET status = ? WHERE bookingId = ?";
      values = [status, bookingId];
    }

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.status(200).json({ message: `Booking status updated to ${status}` });
  } catch (error) {
    console.error("Booking status update error:", error);
    res
      .status(500)
      .json({ message: "Server error during booking status update." });
  }
};

/**
 * Get today's bookings for receptionist dashboard
 */
const getTodayBookings = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const [bookings] = await db.query(
      "SELECT * FROM booking WHERE DATE(bookingDate) = ? ORDER BY timeSlot ASC",
      [today]
    );

    // Transform the data to match the frontend format
    const transformedBookings = bookings.map((booking) => ({
      id: booking.bookingId,
      timeSlot: booking.timeSlot,
      vehicleNumber: booking.vehicleNumber,
      customer: booking.name,
      status: booking.status.toLowerCase(), // Convert to lowercase for consistency
      arrivedTime: booking.arrivedTime
        ? booking.arrivedTime.substring(0, 5)
        : null, // Format as HH:MM
      phone: booking.phone,
      vehicleType: booking.vehicleType,
      serviceTypes: booking.serviceTypes
        ? JSON.parse(booking.serviceTypes)
        : [],
      specialRequests: booking.specialRequests,
    }));

    res.status(200).json(transformedBookings);
  } catch (error) {
    console.error("Error fetching today's bookings:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching today's bookings." });
  }
};

/**
 * Get arrived bookings for service advisor dashboard
 */
const getArrivedBookings = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const [bookings] = await db.query(
      "SELECT * FROM booking WHERE DATE(bookingDate) = ? AND status = 'arrived' ORDER BY arrivedTime ASC",
      [today]
    );

    // Transform the data to match the frontend format
    const transformedBookings = bookings.map((booking) => ({
      id: booking.bookingId,
      timeSlot: booking.timeSlot,
      vehicleNumber: booking.vehicleNumber,
      customer: booking.name,
      status: booking.status.toLowerCase(),
      arrivedTime: booking.arrivedTime
        ? booking.arrivedTime.substring(0, 5)
        : null,
      phone: booking.phone,
      vehicleType: booking.vehicleType,
      vehicleBrand: booking.vehicleBrand,
      vehicleBrandModel: booking.vehicleBrandModel,
      manufacturedYear: booking.manufacturedYear,
      fuelType: booking.fuelType,
      transmissionType: booking.transmissionType,
      serviceTypes: booking.serviceTypes
        ? JSON.parse(booking.serviceTypes)
        : [],
      specialRequests: booking.specialRequests,
    }));

    res.status(200).json(transformedBookings);
  } catch (error) {
    console.error("Error fetching arrived bookings:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching arrived bookings." });
  }
};

/**
 * Assign mechanics to a booking
 */
const assignMechanicsToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { mechanicIds } = req.body;

    if (
      !mechanicIds ||
      !Array.isArray(mechanicIds) ||
      mechanicIds.length === 0
    ) {
      return res.status(400).json({
        message: "Mechanic IDs array is required and cannot be empty.",
      });
    }

    // Check if booking exists
    const [booking] = await db.query(
      "SELECT * FROM booking WHERE bookingId = ?",
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Validate that all mechanics exist and are available
    const placeholders = mechanicIds.map(() => "?").join(",");
    const [mechanics] = await db.query(
      `SELECT mechanicId, availability FROM mechanic WHERE mechanicId IN (${placeholders}) AND isActive = true`,
      mechanicIds
    );

    if (mechanics.length !== mechanicIds.length) {
      return res.status(400).json({
        message: "One or more mechanics not found or inactive.",
      });
    }

    // Check if all mechanics are available
    const unavailableMechanics = mechanics.filter(
      (m) => m.availability !== "Available"
    );
    if (unavailableMechanics.length > 0) {
      return res.status(400).json({
        message: "One or more mechanics are not available.",
        unavailableMechanics: unavailableMechanics.map((m) => m.mechanicId),
      });
    }

    // Update booking with assigned mechanics
    const mechanicsJson = JSON.stringify(mechanicIds);
    await db.query(
      "UPDATE booking SET assignedMechanics = ?, status = 'in_progress' WHERE bookingId = ?",
      [mechanicsJson, bookingId]
    );

    // Update mechanics availability to 'Not Available'
    await db.query(
      `UPDATE mechanic SET availability = 'Not Available' WHERE mechanicId IN (${placeholders})`,
      mechanicIds
    );

    // Create a single jobcard for the booking
    const [bookingDetails] = await db.query(
      "SELECT serviceTypes FROM booking WHERE bookingId = ?",
      [bookingId]
    );

    const serviceTypes = bookingDetails[0]?.serviceTypes || "[]";

    // Create jobcard entry (using first mechanic as primary, but we'll assign all mechanics to it)
    const [jobcardResult] = await db.query(
      `INSERT INTO jobcard (mechanicId, bookingId, partCode, status, serviceDetails) 
       VALUES (?, ?, ?, 'open', ?)`,
      [mechanicIds[0], bookingId, "GENERAL_SERVICE", serviceTypes]
    );

    const jobcardId = jobcardResult.insertId;

    // Assign all mechanics to the jobcard using jobcardMechanic table
    for (const mechanicId of mechanicIds) {
      await db.query(
        `INSERT INTO jobcardMechanic (jobcardId, mechanicId) 
         VALUES (?, ?)`,
        [jobcardId, mechanicId]
      );
    }

    res.status(200).json({
      message: "Mechanics assigned successfully.",
      assignedMechanics: mechanicIds,
      bookingId: bookingId,
    });
  } catch (error) {
    console.error("Error assigning mechanics to booking:", error);
    res.status(500).json({
      message: "Server error during mechanic assignment.",
    });
  }
};

/**
 * Assign spare parts to a booking
 */
const assignSparePartsToBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { spareParts } = req.body;

    if (!spareParts || !Array.isArray(spareParts) || spareParts.length === 0) {
      return res.status(400).json({
        message: "Spare parts array is required and cannot be empty.",
      });
    }

    // Check if booking exists
    const [booking] = await db.query(
      "SELECT * FROM booking WHERE bookingId = ?",
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    // Validate spare parts
    const sparePartIds = spareParts.map((sp) => sp.partId);
    const placeholders = sparePartIds.map(() => "?").join(",");
    const [existingParts] = await db.query(
      `SELECT partId, partName, stockQuantity FROM spareparts WHERE partId IN (${placeholders}) AND isActive = true`,
      sparePartIds
    );

    if (existingParts.length !== sparePartIds.length) {
      return res.status(400).json({
        message: "One or more spare parts not found or inactive.",
      });
    }

    // Check stock availability
    const insufficientStock = [];
    for (const sparePart of spareParts) {
      const existingPart = existingParts.find(
        (ep) => ep.partId === sparePart.partId
      );
      if (existingPart && existingPart.stockQuantity < sparePart.quantity) {
        insufficientStock.push({
          partId: sparePart.partId,
          partName: existingPart.partName,
          requested: sparePart.quantity,
          available: existingPart.stockQuantity,
        });
      }
    }

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        message: "Insufficient stock for one or more spare parts.",
        insufficientStock,
      });
    }

    // Update booking with assigned spare parts
    const sparePartsJson = JSON.stringify(spareParts);
    await db.query(
      "UPDATE booking SET assignedSpareParts = ? WHERE bookingId = ?",
      [sparePartsJson, bookingId]
    );

    // Update stock quantities
    for (const sparePart of spareParts) {
      await db.query(
        "UPDATE spareparts SET stockQuantity = stockQuantity - ? WHERE partId = ?",
        [sparePart.quantity, sparePart.partId]
      );
    }

    res.status(200).json({
      message: "Spare parts assigned successfully.",
      assignedSpareParts: spareParts,
      bookingId: bookingId,
    });
  } catch (error) {
    console.error("Error assigning spare parts to booking:", error);
    res.status(500).json({
      message: "Server error during spare parts assignment.",
    });
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
  getAvailableTimeSlots,
  getTodayBookings,
  getArrivedBookings,
  assignMechanicsToBooking,
  assignSparePartsToBooking,
};
