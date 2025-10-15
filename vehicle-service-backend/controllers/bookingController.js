// controllers/bookingController.js

const db = require("../config/db");
const { isTenDigitPhone } = require("../utils/validators");

/**
 * Get current date in Sri Lankan timezone (UTC+5:30)
 */
const getSriLankanDate = () => {
  const now = new Date();
  // Get date parts in Sri Lankan timezone
  const sriLankaDateString = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // en-CA gives us YYYY-MM-DD format
  return sriLankaDateString;
};

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

  // Validate phone format: exactly 10 digits
  if (!isTenDigitPhone(String(phone))) {
    return res
      .status(400)
      .json({ message: "Phone number must be exactly 10 digits." });
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
  const today = getSriLankanDate(); // Get today's date in Sri Lankan timezone

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

  // If phone is being updated, validate 10 digits
  if (Object.prototype.hasOwnProperty.call(fieldsToUpdate, "phone")) {
    if (!isTenDigitPhone(String(fieldsToUpdate.phone || ""))) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits." });
    }
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
 * Get all bookings with detailed assignment information.
 */
const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      "SELECT * FROM booking ORDER BY bookingDate DESC"
    );

    // Enhance each booking with detailed assignment information
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const enhancedBooking = { ...booking };

        // Parse assigned mechanics and get detailed information
        if (booking.assignedMechanics) {
          try {
            const mechanicIds = JSON.parse(booking.assignedMechanics);
            if (Array.isArray(mechanicIds) && mechanicIds.length > 0) {
              const placeholders = mechanicIds.map(() => "?").join(",");
              const [mechanics] = await db.query(
                `SELECT m.mechanicId, m.mechanicCode, s.name as mechanicName, m.specialization, m.experienceYears, m.hourlyRate, m.availability
                 FROM mechanic m 
                 JOIN staff s ON m.staffId = s.staffId 
                 WHERE m.mechanicId IN (${placeholders})`,
                mechanicIds
              );
              enhancedBooking.assignedMechanicsDetails = mechanics;
            }
          } catch (error) {
            console.error("Error parsing assigned mechanics:", error);
            enhancedBooking.assignedMechanicsDetails = [];
          }
        } else {
          enhancedBooking.assignedMechanicsDetails = [];
        }

        // Parse assigned spare parts and get detailed information
        if (booking.assignedSpareParts) {
          try {
            const spareParts = JSON.parse(booking.assignedSpareParts);
            if (Array.isArray(spareParts) && spareParts.length > 0) {
              const partIds = spareParts.map((sp) => sp.partId);
              const placeholders = partIds.map(() => "?").join(",");
              const [parts] = await db.query(
                `SELECT partId, partName, partCode, category, unitPrice 
                 FROM spareparts 
                 WHERE partId IN (${placeholders})`,
                partIds
              );

              // Combine with quantities from assignment
              enhancedBooking.assignedSparePartsDetails = parts.map((part) => {
                const assignedPart = spareParts.find(
                  (sp) => sp.partId === part.partId
                );
                return {
                  ...part,
                  assignedQuantity: assignedPart ? assignedPart.quantity : 1,
                  totalPrice:
                    part.unitPrice * (assignedPart ? assignedPart.quantity : 1),
                };
              });
            }
          } catch (error) {
            console.error("Error parsing assigned spare parts:", error);
            enhancedBooking.assignedSparePartsDetails = [];
          }
        } else {
          enhancedBooking.assignedSparePartsDetails = [];
        }

        // Parse service types if it's a JSON string
        if (booking.serviceTypes && typeof booking.serviceTypes === "string") {
          try {
            enhancedBooking.serviceTypes = JSON.parse(booking.serviceTypes);
          } catch (error) {
            // If parsing fails, treat as comma-separated string
            enhancedBooking.serviceTypes = booking.serviceTypes
              .split(",")
              .map((s) => s.trim());
          }
        }

        return enhancedBooking;
      })
    );

    res.status(200).json(enhancedBookings);
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
    const today = getSriLankanDate(); // Get today's date in Sri Lankan timezone
    const DAILY_BOOKING_LIMIT = 8;

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
    const [todayBookings] = await db.query(
      "SELECT COUNT(*) as count FROM booking WHERE DATE(bookingDate) = ?",
      [today]
    );
    const [activeBookings] = await db.query(
      "SELECT COUNT(*) as count FROM booking WHERE status IN ('pending', 'confirmed', 'arrived', 'in_progress')"
    );

    res.json({
      total: totalBookings[0].total,
      pending: pendingBookings[0].pending,
      completed: completedBookings[0].completed,
      cancelled: cancelledBookings[0].cancelled,
      todayBookings: todayBookings[0].count,
      activeBookings: activeBookings[0].count,
      dailyBookingLimit: DAILY_BOOKING_LIMIT,
      remainingSlots: Math.max(0, DAILY_BOOKING_LIMIT - todayBookings[0].count),
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
  const today = getSriLankanDate(); // Get today's date in Sri Lankan timezone

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
    "verified",
    "completed",
    "cancelled",
  ];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "A valid status is required." });
  }

  try {
    // Load current booking status to enforce transitions
    const [existing] = await db.query(
      "SELECT status FROM booking WHERE bookingId = ?",
      [bookingId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }
    const currentStatus = existing[0].status;

    // Prevent skipping verification: only allow completed if currently verified
    if (status === "completed" && currentStatus !== "verified") {
      return res.status(400).json({
        message:
          "Booking can only be marked 'completed' after it has been 'verified'. Use the invoice finalize endpoint.",
        currentStatus,
      });
    }

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

    // If status changed to 'arrived', ensure a single jobcard exists (create once)
    if (status === "arrived") {
      try {
        // Check if a jobcard already exists for this booking
        const [existingJobcard] = await db.query(
          "SELECT jobcardId FROM jobcard WHERE bookingId = ? LIMIT 1",
          [bookingId]
        );

        if (existingJobcard.length === 0) {
          // Get booking details for jobcard creation
          const [bookingDetails] = await db.query(
            "SELECT serviceTypes FROM booking WHERE bookingId = ?",
            [bookingId]
          );

          const serviceTypes = bookingDetails[0]?.serviceTypes || "[]";

          // Create jobcard with status 'open'
          await db.query(
            `INSERT INTO jobcard (bookingId, status, serviceDetails) 
             VALUES (?, 'open', ?)`,
            [bookingId, serviceTypes]
          );

          console.log(`✅ Jobcard created on arrival for booking ${bookingId}`);
        } else {
          console.log(
            `ℹ️ Jobcard already exists for booking ${bookingId}, skipping creation`
          );
        }
      } catch (jobcardError) {
        // Log the error but don't fail the status update
        console.error("Error ensuring jobcard on arrival:", jobcardError);
        // Continue with the response even if jobcard creation fails
      }
    }

    // If status changed to 'in_progress', update jobcard status as well
    if (status === "in_progress") {
      try {
        // Find and update the jobcard for this booking
        const [existingJobcard] = await db.query(
          "SELECT jobcardId FROM jobcard WHERE bookingId = ?",
          [bookingId]
        );

        if (existingJobcard.length > 0) {
          await db.query(
            "UPDATE jobcard SET status = 'in_progress' WHERE bookingId = ?",
            [bookingId]
          );
          console.log(
            `✅ Jobcard status updated to 'in_progress' for booking ${bookingId}`
          );
        } else {
          console.log(
            `⚠️ No jobcard found for booking ${bookingId}. Creating one now...`
          );

          // Get booking details
          const [bookingDetails] = await db.query(
            "SELECT serviceTypes FROM booking WHERE bookingId = ?",
            [bookingId]
          );

          if (bookingDetails.length > 0) {
            const serviceTypes = bookingDetails[0]?.serviceTypes || "[]";

            // Get an available mechanic
            const [availableMechanics] = await db.query(
              "SELECT mechanicId FROM mechanic WHERE isActive = true ORDER BY mechanicId LIMIT 1"
            );

            if (availableMechanics.length > 0) {
              const defaultMechanicId = availableMechanics[0].mechanicId;

              // Create jobcard with status 'in_progress'
              await db.query(
                `INSERT INTO jobcard (bookingId, status, serviceDetails) 
                 VALUES (?, 'in_progress', ?)`,
                [bookingId, serviceTypes]
              );

              console.log(
                `✅ Jobcard created with 'in_progress' status for booking ${bookingId}`
              );
            }
          }
        }
      } catch (jobcardError) {
        // Log the error but don't fail the status update
        console.error("Error updating jobcard status:", jobcardError);
        // Continue with the response even if jobcard update fails
      }
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
 * Update kilometersRun for a booking (e.g., captured by receptionist at check-in)
 */
const updateKilometersRun = async (req, res) => {
  const { bookingId } = req.params;
  let { kilometersRun } = req.body;

  if (kilometersRun === undefined || kilometersRun === null) {
    return res.status(400).json({ message: "kilometersRun is required" });
  }

  kilometersRun = Number(kilometersRun);
  if (!Number.isInteger(kilometersRun) || kilometersRun < 0) {
    return res
      .status(400)
      .json({ message: "kilometersRun must be a non-negative integer" });
  }

  try {
    const [result] = await db.query(
      "UPDATE booking SET kilometersRun = ? WHERE bookingId = ?",
      [kilometersRun, bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Kilometers updated", kilometersRun });
  } catch (error) {
    console.error("Error updating kilometersRun:", error);
    res.status(500).json({ message: "Server error updating kilometersRun" });
  }
};

/**
 * Get today's bookings for receptionist dashboard
 */
const getTodayBookings = async (req, res) => {
  try {
    // Get today's date in Sri Lankan timezone
    const today = getSriLankanDate();

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
    // Get today's date in Sri Lankan timezone
    const today = getSriLankanDate();

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

    // Update mechanics availability to 'Busy' (valid enum value)
    await db.query(
      `UPDATE mechanic SET availability = 'Busy' WHERE mechanicId IN (${placeholders})`,
      mechanicIds
    );

    // Check if jobcard already exists for this booking (created when booking arrived)
    const [existingJobcard] = await db.query(
      "SELECT jobcardId, status FROM jobcard WHERE bookingId = ? LIMIT 1",
      [bookingId]
    );

    let jobcardId;

    if (existingJobcard.length > 0) {
      // Update existing jobcard with the first selected mechanic and change status
      jobcardId = existingJobcard[0].jobcardId;

      await db.query(
        `UPDATE jobcard 
         SET assignedMechanicIds = ?, 
             status = 'in_progress' 
         WHERE jobcardId = ?`,
        [JSON.stringify(mechanicIds), jobcardId]
      );

      console.log(
        `✅ Updated existing jobcard ${jobcardId} for booking ${bookingId}`
      );
    } else {
      // Create new jobcard if none exists
      const [bookingDetails] = await db.query(
        "SELECT serviceTypes FROM booking WHERE bookingId = ?",
        [bookingId]
      );

      const serviceTypes = bookingDetails[0]?.serviceTypes || "[]";

      const [jobcardResult] = await db.query(
        `INSERT INTO jobcard (bookingId, status, serviceDetails, assignedMechanicIds) 
         VALUES (?, 'in_progress', ?, ?)`,
        [bookingId, serviceTypes, JSON.stringify(mechanicIds)]
      );

      jobcardId = jobcardResult.insertId;
      console.log(
        `✅ Created new jobcard ${jobcardId} for booking ${bookingId}`
      );
    }

    // Clear existing mechanic assignments for this jobcard
    await db.query("DELETE FROM jobcardMechanic WHERE jobcardId = ?", [
      jobcardId,
    ]);

    // Assign all selected mechanics to the jobcard using jobcardMechanic table
    for (const mechanicId of mechanicIds) {
      await db.query(
        `INSERT INTO jobcardMechanic (jobcardId, mechanicId) 
         VALUES (?, ?)`,
        [jobcardId, mechanicId]
      );
    }

    console.log(
      `✅ Assigned ${mechanicIds.length} mechanic(s) to jobcard ${jobcardId}`
    );

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

    console.log(`\n🔧 Assigning spare parts to booking ${bookingId}`);
    console.log("Spare parts to assign:", spareParts);

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

    // Validate spare parts and get unit prices
    const sparePartIds = spareParts.map((sp) => sp.partId);
    const placeholders = sparePartIds.map(() => "?").join(",");
    const [existingParts] = await db.query(
      `SELECT partId, partName, stockQuantity, unitPrice FROM spareparts WHERE partId IN (${placeholders}) AND isActive = true`,
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

    // Check if jobcard exists for this booking (auto-created when booking arrived)
    const [existingJobcard] = await db.query(
      "SELECT jobcardId FROM jobcard WHERE bookingId = ? LIMIT 1",
      [bookingId]
    );

    let jobcardId;
    if (existingJobcard.length > 0) {
      jobcardId = existingJobcard[0].jobcardId;
      console.log(`✅ Found existing jobcard: ${jobcardId}`);
    } else {
      // Create a jobcard if it doesn't exist
      console.log(
        "⚠️ No jobcard found, this should not happen for arrived bookings"
      );
      return res.status(400).json({
        message:
          "Jobcard not found for this booking. Please ensure the booking has arrived status.",
      });
    }

    // Clear existing spare part assignments for this jobcard
    await db.query("DELETE FROM jobcardSparePart WHERE jobcardId = ?", [
      jobcardId,
    ]);
    console.log("🗑️ Cleared existing spare part assignments");

    // Store ALL selected spare parts in jobcardSparePart table
    let totalSparePartsCost = 0;
    for (const sparePart of spareParts) {
      const existingPart = existingParts.find(
        (ep) => ep.partId === sparePart.partId
      );
      const unitPrice = existingPart.unitPrice;
      const quantity = sparePart.quantity || 1;
      const totalPrice = unitPrice * quantity;
      totalSparePartsCost += totalPrice;

      await db.query(
        `INSERT INTO jobcardSparePart (jobcardId, partId, quantity, unitPrice, totalPrice) 
         VALUES (?, ?, ?, ?, ?)`,
        [jobcardId, sparePart.partId, quantity, unitPrice, totalPrice]
      );
      console.log(
        `✅ Stored spare part ${sparePart.partId} (Qty: ${quantity}) in jobcardSparePart table`
      );
    }

    // Update booking with assigned spare parts (for backward compatibility)
    const sparePartsJson = JSON.stringify(spareParts);
    await db.query(
      "UPDATE booking SET assignedSpareParts = ? WHERE bookingId = ?",
      [sparePartsJson, bookingId]
    );
    console.log("✅ Updated booking.assignedSpareParts");

    // Also store assigned spare parts on the jobcard record for quick access
    await db.query(
      "UPDATE jobcard SET assignedSparePartIds = ? WHERE jobcardId = ?",
      [sparePartsJson, jobcardId]
    );
    console.log("✅ Updated jobcard.assignedSparePartIds");

    // Update stock quantities
    for (const sparePart of spareParts) {
      await db.query(
        "UPDATE spareparts SET stockQuantity = stockQuantity - ? WHERE partId = ?",
        [sparePart.quantity, sparePart.partId]
      );
    }
    console.log("✅ Updated spare parts stock quantities");

    console.log(
      `\n🎉 Successfully assigned ${spareParts.length} spare part(s) to jobcard ${jobcardId}`
    );
    console.log(
      `💰 Total spare parts cost: Rs. ${totalSparePartsCost.toFixed(2)}`
    );

    res.status(200).json({
      message: "Spare parts assigned successfully and stored in jobcard.",
      assignedSpareParts: spareParts,
      bookingId: bookingId,
      jobcardId: jobcardId,
      totalCost: totalSparePartsCost,
    });
  } catch (error) {
    console.error("Error assigning spare parts to booking:", error);
    res.status(500).json({
      message: "Server error during spare parts assignment.",
      error: error.message,
    });
  }
};

/**
 * Submit jobcard for a booking: finalize assignments so mechanics see it on their dashboards.
 * - Ensures a jobcard exists and is set to in_progress
 * - Writes jobcardMechanic rows for assigned mechanics
 * - Writes jobcardSparePart rows if not already created
 * - Updates quick-access JSON fields on jobcard
 * - Sets booking status to in_progress and mechanics availability to Busy
 */
const submitJobcard = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Load booking and parse assignments
    const [bookings] = await db.query(
      "SELECT bookingId, serviceTypes, assignedMechanics, assignedSpareParts, status FROM booking WHERE bookingId = ?",
      [bookingId]
    );
    if (bookings.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }
    const booking = bookings[0];

    let mechanicIds = [];
    if (booking.assignedMechanics) {
      try {
        mechanicIds = JSON.parse(booking.assignedMechanics) || [];
      } catch (_) {
        // ignore parse error
      }
    }
    if (!Array.isArray(mechanicIds) || mechanicIds.length === 0) {
      return res.status(400).json({
        message:
          "Please assign at least one mechanic before submitting the jobcard.",
      });
    }

    let spareParts = [];
    if (booking.assignedSpareParts) {
      try {
        spareParts = JSON.parse(booking.assignedSpareParts) || [];
      } catch (_) {
        // ignore parse error
      }
    }

    const serviceDetails = booking.serviceTypes || "[]";

    // Ensure jobcard exists
    const [existingJobcard] = await db.query(
      "SELECT jobcardId FROM jobcard WHERE bookingId = ? LIMIT 1",
      [bookingId]
    );

    let jobcardId;
    if (existingJobcard.length > 0) {
      jobcardId = existingJobcard[0].jobcardId;
      await db.query(
        "UPDATE jobcard SET status = 'in_progress', assignedMechanicIds = ?, assignedSparePartIds = ?, serviceDetails = ? WHERE jobcardId = ?",
        [
          JSON.stringify(mechanicIds),
          JSON.stringify(spareParts),
          serviceDetails,
          jobcardId,
        ]
      );
    } else {
      const [result] = await db.query(
        "INSERT INTO jobcard (bookingId, status, serviceDetails, assignedMechanicIds, assignedSparePartIds) VALUES (?, 'in_progress', ?, ?, ?)",
        [
          bookingId,
          serviceDetails,
          JSON.stringify(mechanicIds),
          JSON.stringify(spareParts),
        ]
      );
      jobcardId = result.insertId;
    }

    // Sync jobcardMechanic mappings
    await db.query("DELETE FROM jobcardMechanic WHERE jobcardId = ?", [
      jobcardId,
    ]);
    for (const mechanicId of mechanicIds) {
      await db.query(
        "INSERT INTO jobcardMechanic (jobcardId, mechanicId) VALUES (?, ?)",
        [jobcardId, mechanicId]
      );
    }

    // If no rows exist in jobcardSparePart yet, create them and adjust stock
    const [jspCountRows] = await db.query(
      "SELECT COUNT(*) as cnt FROM jobcardSparePart WHERE jobcardId = ?",
      [jobcardId]
    );
    const hasSparePartsRows = (jspCountRows[0]?.cnt || 0) > 0;
    if (!hasSparePartsRows && spareParts.length > 0) {
      // Load part prices
      const partIds = spareParts.map((sp) => sp.partId);
      const placeholders = partIds.map(() => "?").join(",");
      const [parts] = await db.query(
        `SELECT partId, unitPrice, stockQuantity FROM spareparts WHERE partId IN (${placeholders})`,
        partIds
      );
      // Insert rows and decrement stock
      for (const sp of spareParts) {
        const part = parts.find((p) => p.partId === sp.partId);
        if (!part) continue;
        const qty = sp.quantity || 1;
        const total = parseFloat(part.unitPrice) * qty;
        await db.query(
          "INSERT INTO jobcardSparePart (jobcardId, partId, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?)",
          [jobcardId, sp.partId, qty, part.unitPrice, total]
        );
        await db.query(
          "UPDATE spareparts SET stockQuantity = stockQuantity - ? WHERE partId = ?",
          [qty, sp.partId]
        );
      }
    }

    // Update booking status and mechanic availability
    await db.query(
      "UPDATE booking SET status = 'in_progress' WHERE bookingId = ?",
      [bookingId]
    );
    const mechPlaceholders = mechanicIds.map(() => "?").join(",");
    await db.query(
      `UPDATE mechanic SET availability = 'Busy' WHERE mechanicId IN (${mechPlaceholders})`,
      mechanicIds
    );

    return res.status(200).json({
      message: "Jobcard submitted successfully and assigned to mechanics.",
      bookingId,
      jobcardId,
      assignedMechanics: mechanicIds,
    });
  } catch (error) {
    console.error("Error submitting jobcard:", error);
    return res.status(500).json({
      message: "Server error while submitting jobcard.",
      error: error.message,
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
  submitJobcard,
  updateKilometersRun,
};
