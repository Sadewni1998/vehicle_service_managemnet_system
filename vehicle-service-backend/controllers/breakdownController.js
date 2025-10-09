// controllers/breakdownController.js

const db = require("../config/db");

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

  // Basic validation
  if (
    !name ||
    !phone ||
    !vehicleNumber ||
    !emergencyType ||
    !latitude ||
    !longitude
  ) {
    return res
      .status(400)
      .json({
        message:
          "Name, phone, vehicle number, emergency type, and location are required.",
      });
  }

  try {
    // For public requests, we'll use customerId = NULL and store contact info directly
    const sql = `
      INSERT INTO breakdown_request (
        customerId, vehicleId, emergencyType, latitude, longitude, problemDescription, additionalInfo,
        contactName, contactPhone, vehicleNumber, vehicleType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      null, // customerId - NULL for public requests
      null, // vehicleId - NULL for public requests
      emergencyType,
      latitude,
      longitude,
      problemDescription,
      additionalInfo,
      name,
      phone,
      vehicleNumber,
      vehicleType,
    ];

    const [result] = await db.query(sql, values);

    res.status(201).json({
      message: "Breakdown request submitted successfully!",
      requestId: result.insertId,
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
      SELECT *
      FROM breakdown_request 
      ORDER BY createdAt DESC
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
