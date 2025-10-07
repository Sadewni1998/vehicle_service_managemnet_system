const db = require("../config/db");

/**
 * Get all vehicles for a specific customer
 */
const getCustomerVehicles = async (req, res) => {
  const customerId = req.user.customerId;

  try {
    const [vehicles] = await db.query(
      "SELECT * FROM vehicle WHERE customerId = ? ORDER BY createdAt DESC",
      [customerId]
    );

    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching customer vehicles:", error);
    res.status(500).json({ message: "Server error while fetching vehicles." });
  }
};

/**
 * Add a new vehicle for a customer
 */
const addVehicle = async (req, res) => {
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

  // Validate required fields
  if (!vehicleNumber) {
    return res.status(400).json({ message: "Vehicle number is required." });
  }

  try {
    // Check if vehicle number already exists for this customer
    const [existingVehicle] = await db.query(
      "SELECT vehicleId FROM vehicle WHERE vehicleNumber = ? AND customerId = ?",
      [vehicleNumber?.toUpperCase(), customerId]
    );

    if (existingVehicle.length > 0) {
      return res.status(400).json({
        message: "Vehicle with this number already exists in your account.",
      });
    }

    // Check if vehicle number exists for other customers (optional - might want to allow)
    const [otherCustomerVehicle] = await db.query(
      "SELECT vehicleId FROM vehicle WHERE vehicleNumber = ? AND customerId != ?",
      [vehicleNumber?.toUpperCase(), customerId]
    );

    if (otherCustomerVehicle.length > 0) {
      return res.status(400).json({
        message:
          "Vehicle with this number is already registered to another customer.",
      });
    }

    const sql = `
      INSERT INTO vehicle (
        customerId, vehicleNumber, brand, model, type, 
        manufactureYear, fuelType, transmission, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      customerId,
      vehicleNumber?.toUpperCase(),
      brand ? brand.toUpperCase() : "Unknown",
      model ? model.toUpperCase() : "Unknown",
      type ? type.toUpperCase() : "Unknown",
      manufactureYear || new Date().getFullYear(),
      fuelType ? fuelType.toUpperCase() : "Unknown",
      transmission ? transmission.toUpperCase() : "Unknown",
    ];

    const [result] = await db.query(sql, values);

    // Fetch the created vehicle to return complete data
    const [newVehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Vehicle added successfully!",
      vehicle: newVehicle[0],
    });
  } catch (error) {
    console.error("Vehicle creation error:", error);
    res.status(500).json({ message: "Server error during vehicle creation." });
  }
};

/**
 * Update vehicle information
 */
const updateVehicle = async (req, res) => {
  const customerId = req.user.customerId;
  const { vehicleId } = req.params;
  const {
    vehicleNumber,
    brand,
    model,
    type,
    manufactureYear,
    fuelType,
    transmission,
  } = req.body;

  try {
    // Check if vehicle belongs to the customer
    const [vehicle] = await db.query(
      "SELECT vehicleId FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    if (vehicle.length === 0) {
      return res
        .status(404)
        .json({ message: "Vehicle not found or doesn't belong to you." });
    }

    // Check if new vehicle number conflicts with existing vehicles (excluding current one)
    if (vehicleNumber) {
      const [existingVehicle] = await db.query(
        "SELECT vehicleId FROM vehicle WHERE vehicleNumber = ? AND vehicleId != ? AND customerId = ?",
        [vehicleNumber, vehicleId, customerId]
      );

      if (existingVehicle.length > 0) {
        return res.status(400).json({
          message: "Vehicle with this number already exists in your account.",
        });
      }
    }

    const sql = `
      UPDATE vehicle SET 
        vehicleNumber = COALESCE(?, vehicleNumber),
        brand = COALESCE(?, brand),
        model = COALESCE(?, model),
        type = COALESCE(?, type),
        manufactureYear = COALESCE(?, manufactureYear),
        fuelType = COALESCE(?, fuelType),
        transmission = COALESCE(?, transmission)
      WHERE vehicleId = ? AND customerId = ?
    `;

    const values = [
      vehicleNumber?.toUpperCase(),
      brand ? brand.toUpperCase() : brand,
      model ? model.toUpperCase() : model,
      type ? type.toUpperCase() : type,
      manufactureYear,
      fuelType ? fuelType.toUpperCase() : fuelType,
      transmission ? transmission.toUpperCase() : transmission,
      vehicleId,
      customerId,
    ];

    await db.query(sql, values);

    // Fetch updated vehicle
    const [updatedVehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ?",
      [vehicleId]
    );

    res.status(200).json({
      message: "Vehicle updated successfully!",
      vehicle: updatedVehicle[0],
    });
  } catch (error) {
    console.error("Vehicle update error:", error);
    res.status(500).json({ message: "Server error during vehicle update." });
  }
};

/**
 * Delete a vehicle
 */
const deleteVehicle = async (req, res) => {
  const customerId = req.user.customerId;
  const { vehicleId } = req.params;

  try {
    // Check if vehicle belongs to the customer
    const [vehicle] = await db.query(
      "SELECT vehicleId FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    if (vehicle.length === 0) {
      return res
        .status(404)
        .json({ message: "Vehicle not found or doesn't belong to you." });
    }

    // Check if vehicle has any bookings
    const [bookings] = await db.query(
      "SELECT COUNT(*) as count FROM booking WHERE vehicleId = ?",
      [vehicleId]
    );

    if (bookings[0].count > 0) {
      return res.status(400).json({
        message: `Cannot delete vehicle. It has ${bookings[0].count} associated booking(s). Please cancel or complete all bookings first.`,
      });
    }

    await db.query(
      "DELETE FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    res.status(200).json({ message: "Vehicle deleted successfully!" });
  } catch (error) {
    console.error("Vehicle deletion error:", error);
    res.status(500).json({ message: "Server error during vehicle deletion." });
  }
};

/**
 * Get vehicle by ID (for the customer who owns it)
 */
const getVehicleById = async (req, res) => {
  const customerId = req.user.customerId;
  const { vehicleId } = req.params;

  try {
    const [vehicle] = await db.query(
      "SELECT * FROM vehicle WHERE vehicleId = ? AND customerId = ?",
      [vehicleId, customerId]
    );

    if (vehicle.length === 0) {
      return res
        .status(404)
        .json({ message: "Vehicle not found or doesn't belong to you." });
    }

    res.status(200).json(vehicle[0]);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Server error while fetching vehicle." });
  }
};

module.exports = {
  getCustomerVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
};
