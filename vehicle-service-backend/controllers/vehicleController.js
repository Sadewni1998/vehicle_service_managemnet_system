// controllers/vehicleController.js

const db = require("../config/db");

/**
 * Get all vehicles for the authenticated customer
 */
const getUserVehicles = async (req, res) => {
  try {
    const customerId = req.user.customerId;

    const [vehicles] = await db.query(
      "SELECT * FROM vehicle WHERE customerId = ? ORDER BY createdAt DESC",
      [customerId]
    );

    res.json({
      success: true,
      message: `Found ${vehicles.length} vehicle(s).`,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error fetching user vehicles:", error);
    res.status(500).json({ message: "Server error while fetching vehicles." });
  }
};

/**
 * Add a new vehicle for the authenticated customer
 */
const addUserVehicle = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const {
      vehicleNumber,
      brand,
      model,
      type,
      manufactureYear,
      fuelType,
      transmission,
    } = req.body;

    // Convert vehicle number to uppercase
    const upperCaseVehicleNumber = vehicleNumber?.toUpperCase();

    // Validate required fields
    const requiredFields = [
      "vehicleNumber",
      "brand",
      "model",
      "type",
      "manufactureYear",
      "fuelType",
      "transmission",
    ];
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field] === "") {
        return res.status(400).json({
          message: `${field} is required.`,
        });
      }
    }

    // Validate vehicle number format
    if (!/^[A-Z0-9\-]+$/i.test(vehicleNumber)) {
      return res.status(400).json({
        message: "Invalid vehicle number format.",
      });
    }

    // Validate manufacture year
    const currentYear = new Date().getFullYear();
    const year = parseInt(manufactureYear);
    if (year < 1990 || year > currentYear) {
      return res.status(400).json({
        message: `Manufacture year must be between 1990 and ${currentYear}.`,
      });
    }

    // Check if vehicle number already exists
    const [existingVehicle] = await db.query(
      "SELECT vehicleNumber FROM vehicle WHERE vehicleNumber = ?",
      [upperCaseVehicleNumber]
    );

    if (existingVehicle.length > 0) {
      return res.status(409).json({
        message: `Vehicle number ${upperCaseVehicleNumber} is already registered.`,
      });
    }

    // Insert the new vehicle
    const vehicleSql = `
      INSERT INTO vehicle (customerId, vehicleNumber, brand, model, type, manufactureYear, fuelType, transmission) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(vehicleSql, [
      customerId,
      upperCaseVehicleNumber,
      brand,
      model,
      type,
      manufactureYear,
      fuelType,
      transmission,
    ]);

    // Get the newly created vehicle
    const [newVehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully!",
      data: newVehicle[0],
    });
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(500).json({ message: "Server error while adding vehicle." });
  }
};

/**
 * Update an existing vehicle for the authenticated customer
 */
const updateUserVehicle = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const vehicleId = req.params.vehicleId;
    const {
      vehicleNumber,
      brand,
      model,
      type,
      manufactureYear,
      fuelType,
      transmission,
    } = req.body;

    // Convert vehicle number to uppercase
    const upperCaseVehicleNumber = vehicleNumber?.toUpperCase();

    // Check if vehicle belongs to the user
    const [existingVehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    if (existingVehicle.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found or does not belong to you.",
      });
    }

    // Validate required fields
    const requiredFields = [
      "vehicleNumber",
      "brand",
      "model",
      "type",
      "manufactureYear",
      "fuelType",
      "transmission",
    ];
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field] === "") {
        return res.status(400).json({
          message: `${field} is required.`,
        });
      }
    }

    // Check if vehicle number already exists for another vehicle
    const [duplicateVehicle] = await db.query(
      "SELECT vehicleNumber FROM vehicle WHERE vehicleNumber = ? AND vehicleId != ?",
      [upperCaseVehicleNumber, vehicleId]
    );

    if (duplicateVehicle.length > 0) {
      return res.status(409).json({
        message: `Vehicle number ${upperCaseVehicleNumber} is already registered to another vehicle.`,
      });
    }

    // Update the vehicle
    const updateSql = `
      UPDATE vehicle 
      SET vehicleNumber = ?, brand = ?, model = ?, type = ?, manufactureYear = ?, fuelType = ?, transmission = ?
      WHERE vehicleId = ? AND customerId = ?
    `;
    await db.query(updateSql, [
      upperCaseVehicleNumber,
      brand,
      model,
      type,
      manufactureYear,
      fuelType,
      transmission,
      vehicleId,
      customerId,
    ]);

    // Get the updated vehicle
    const [updatedVehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ?",
      [vehicleId]
    );

    res.json({
      success: true,
      message: "Vehicle updated successfully!",
      data: updatedVehicle[0],
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Server error while updating vehicle." });
  }
};

/**
 * Delete a vehicle for the authenticated customer
 */
const deleteUserVehicle = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const vehicleId = req.params.vehicleId;

    // Check if vehicle belongs to the user
    const [existingVehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    if (existingVehicle.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found or does not belong to you.",
      });
    }

    // Check if this is the user's only vehicle
    const [userVehicles] = await db.query(
      "SELECT COUNT(*) as count FROM vehicle WHERE customerId = ?",
      [customerId]
    );

    if (userVehicles[0].count <= 1) {
      return res.status(400).json({
        message:
          "You cannot delete your only vehicle. At least one vehicle is required.",
      });
    }

    // Delete the vehicle
    await db.query(
      "DELETE FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    res.json({
      success: true,
      message: "Vehicle deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Server error while deleting vehicle." });
  }
};

/**
 * Get a specific vehicle by ID for the authenticated customer
 */
const getUserVehicleById = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const vehicleId = req.params.vehicleId;

    const [vehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    if (vehicle.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found or does not belong to you.",
      });
    }

    res.json({
      success: true,
      data: vehicle[0],
    });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Server error while fetching vehicle." });
  }
};

module.exports = {
  getUserVehicles,
  addUserVehicle,
  updateUserVehicle,
  deleteUserVehicle,
  getUserVehicleById,
};
