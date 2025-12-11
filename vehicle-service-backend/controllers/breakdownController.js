// controllers/breakdownController.js

const db = require("../config/db");
const { isTenDigitPhone } = require("../utils/validators");
const jwt = require("jsonwebtoken");

/**
 * Creates a new breakdown service request (public access - no authentication required).
 */
const createBreakdownRequest = async (req, res) => {
  // Get the details from the request body
  const {
    name,
    phone,
    vehicleNumber,
    vehicleType,
    emergencyType,
    latitude,
    longitude,
    problemDescription,
    additionalInfo,
  } = req.body;

  // Try to detect authenticated customer from Authorization header (optional)
  let customerId = null;
  let contactName = name;
  let contactPhone = phone;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.customerId) {
        customerId = decoded.customerId;
        // If contact details not provided, fetch from DB
        if (!contactName || !contactPhone) {
          const [rows] = await db.query(
            "SELECT name, phone FROM customer WHERE customerId = ?",
            [customerId]
          );
          if (rows && rows[0]) {
            contactName = contactName || rows[0].name;
            contactPhone = contactPhone || rows[0].phone;
          }
        }
      }
    }
  } catch (e) {
    // If token invalid, proceed as public request
    customerId = null;
  }

  // Basic validation (allow name/phone omission for authenticated customers if profile has them)
  if (!vehicleNumber || !emergencyType || !latitude || !longitude) {
    return res.status(400).json({
      message: "Vehicle number, emergency type, and location are required.",
    });
  }

  // Ensure we have contact details either from body or from user profile (if logged in)
  if (!contactName || !contactPhone) {
    return res.status(400).json({
      message:
        "Contact name and phone are required (or must be available on your profile).",
    });
  }

  // Validate phone if provided
  if (!isTenDigitPhone(String(contactPhone))) {
    return res
      .status(400)
      .json({ message: "Phone number must be exactly 10 digits." });
  }

  try {
    // If authenticated, try to link to user's vehicle by vehicle number (case-insensitive)
    let vehicleId = null;
    if (customerId) {
      const upperVehicleNumber = String(vehicleNumber).toUpperCase();
      const [vehRows] = await db.query(
        "SELECT vehicleId FROM vehicle WHERE customerId = ? AND UPPER(vehicleNumber) = ?",
        [customerId, upperVehicleNumber]
      );
      if (vehRows && vehRows[0]) {
        vehicleId = vehRows[0].vehicleId;
      }
    }

    // Calculate price (Simple logic: Base fee + distance based if available, for now fixed base fee)
    // In a real app, you might calculate distance between service center and user location
    // Use price from request if available (calculated on frontend), otherwise default to 5000
    const price = req.body.price || 5000.0;

    // Insert request; for public requests, customerId/vehicleId remain NULL and store contact info directly
    const sql = `
      INSERT INTO breakdown_request (
        customerId, vehicleId, emergencyType, latitude, longitude, problemDescription, additionalInfo,
        contactName, contactPhone, vehicleNumber, vehicleType, price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      customerId, // customerId - may be NULL for public requests
      vehicleId, // vehicleId - may be NULL
      emergencyType,
      latitude,
      longitude,
      problemDescription,
      additionalInfo,
      contactName,
      contactPhone,
      String(vehicleNumber || "").toUpperCase(),
      vehicleType,
      price,
    ];

    const [result] = await db.query(sql, values);

    res.status(201).json({
      message: "Breakdown request submitted successfully!",
      requestId: result.insertId,
      linkedToCustomer: !!customerId,
    });
  } catch (error) {
    console.error("Breakdown request error:", error);
    res.status(500).json({ message: "Server error while submitting request." });
  }
};

/**
 * Gets all breakdown requests for the currently logged-in user.
 */
const getMyBreakdownRequests = async (req, res) => {
  const customerId = req.user.customerId;

  try {
    const sql = `
      SELECT * FROM breakdown_request 
      WHERE customerId = ? 
      ORDER BY createdAt DESC
    `;
    const [requests] = await db.query(sql, [customerId]);

    res.status(200).json({
      success: true,
      message: `Found ${requests.length} breakdown request(s).`,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching breakdown requests:", error);
    res.status(500).json({ message: "Server error while fetching requests." });
  }
};

module.exports = {
  createBreakdownRequest,
  getMyBreakdownRequests,
};

/**
 * ADMIN/STAFF ENDPOINTS
 * The below handlers are intended for staff users (manager, service_advisor, receptionist)
 * to manage breakdown requests from the management dashboard.
 */

/**
 * Returns all breakdown requests.
 */
const getAllBreakdownRequests = async (req, res) => {
  try {
    const sql = `
      SELECT 
        br.*,
        c.name as linkedCustomerName,
        c.phone as linkedCustomerPhone,
        v.vehicleNumber as linkedVehicleNumber,
        v.type as linkedVehicleType
      FROM breakdown_request br
      LEFT JOIN customer c ON br.customerId = c.customerId
      LEFT JOIN vehicle v ON br.vehicleId = v.vehicleId
      ORDER BY br.createdAt DESC
    `;
    const [rows] = await db.query(sql);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching all breakdown requests:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching breakdown requests." });
  }
};

/**
 * Returns a single breakdown request by ID.
 */
const getBreakdownRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM breakdown_request WHERE requestId = ?",
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Breakdown request not found." });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching breakdown request:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching breakdown request." });
  }
};

/**
 * Updates the status of a breakdown request.
 */
const updateBreakdownRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "Pending",
    "Approved",
    "In Progress",
    "Completed",
    "Cancelled",
  ];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const [result] = await db.query(
      "UPDATE breakdown_request SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE requestId = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Breakdown request not found." });
    }

    // Return the updated record
    const [rows] = await db.query(
      "SELECT * FROM breakdown_request WHERE requestId = ?",
      [id]
    );
    res
      .status(200)
      .json({ message: "Status updated successfully.", data: rows[0] });
  } catch (error) {
    console.error("Error updating breakdown request status:", error);
    res.status(500).json({ message: "Server error while updating status." });
  }
};

/**
 * Returns aggregated stats for breakdown requests (counts, today, by status).
 */
const getBreakdownStats = async (req, res) => {
  try {
    const [[totalRow]] = await db.query(
      "SELECT COUNT(*) AS total FROM breakdown_request"
    );
    const [byStatusRows] = await db.query(
      "SELECT status, COUNT(*) AS count FROM breakdown_request GROUP BY status"
    );
    const [[todayRow]] = await db.query(
      "SELECT COUNT(*) AS today FROM breakdown_request WHERE DATE(createdAt) = CURDATE()"
    );

    const byStatus = byStatusRows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    res.status(200).json({
      total: totalRow.total || 0,
      today: todayRow.today || 0,
      byStatus,
    });
  } catch (error) {
    console.error("Error fetching breakdown stats:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching breakdown stats." });
  }
};

// Export new handlers
module.exports.getAllBreakdownRequests = getAllBreakdownRequests;
module.exports.getBreakdownRequestById = getBreakdownRequestById;
module.exports.updateBreakdownRequestStatus = updateBreakdownRequestStatus;
module.exports.getBreakdownStats = getBreakdownStats;
