// controllers/breakdownController.js

const db = require('../config/db');

/**
 * Creates a new breakdown service request for the logged-in user.
 */
const createBreakdownRequest = async (req, res) => {
  // The customerId is securely taken from the logged-in user's token
  const customerId = req.user.customerId;

  // Get the rest of the details from the request body
  const { 
    vehicleId, 
    emergencyType, 
    latitude, 
    longitude, 
    problemDescription, 
    additionalInfo 
  } = req.body;

  // Basic validation
  if (!vehicleId || !emergencyType || !latitude || !longitude) {
    return res.status(400).json({ message: 'Vehicle, emergency type, and location are required.' });
  }

  try {
    const sql = `
      INSERT INTO breakdown_request (
        customerId, vehicleId, emergencyType, latitude, longitude, problemDescription, additionalInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      customerId, vehicleId, emergencyType, latitude, longitude, problemDescription, additionalInfo
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