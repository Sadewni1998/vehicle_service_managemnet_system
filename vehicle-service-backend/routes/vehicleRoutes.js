const express = require("express");
const router = express.Router();
const {
  getCustomerVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
} = require("../controllers/vehicleController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");

// All vehicle routes require authentication
router.use(ensureAuthenticated);

// Get all vehicles for the authenticated customer
router.get("/", getCustomerVehicles);

// Add a new vehicle
router.post("/", addVehicle);

// Get a specific vehicle by ID
router.get("/:vehicleId", getVehicleById);

// Update a vehicle
router.put("/:vehicleId", updateVehicle);

// Delete a vehicle
router.delete("/:vehicleId", deleteVehicle);

module.exports = router;
