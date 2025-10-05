// controllers/breakdownController.js

const db = require('../config/db');

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
    additionalInfo 
  } = req.body;

  // Basic validation
  if (!name || !phone || !vehicleNumber || !emergencyType || !latitude || !longitude) {
    return res.status(400).json({ message: 'Name, phone, vehicle number, emergency type, and location are required.' });
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
      vehicleType
    ];

    const [result] = await db.query(sql, values);

    res.status(201).json({ 
      message: 'Breakdown request submitted successfully!',
      requestId: result.insertId 
    });

  } catch (error) {
    console.error('Breakdown request error:', error);
    res.status(500).json({ message: 'Server error while submitting request.' });
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
      data: requests
    });

  } catch (error) {
    console.error('Error fetching breakdown requests:', error);
    res.status(500).json({ message: 'Server error while fetching requests.' });
  }
};

module.exports = {
  createBreakdownRequest,
  getMyBreakdownRequests,
};