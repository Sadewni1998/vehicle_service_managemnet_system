// routes/vehicleRoutes.js

const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");

// All vehicle routes require authentication
router.use(ensureAuthenticated);

// @route   GET /api/vehicles
// @desc    Get all vehicles for the authenticated customer
// @access  Protected (Customer only)
router.get("/", vehicleController.getUserVehicles);

// @route   POST /api/vehicles
// @desc    Add a new vehicle for the authenticated customer
// @access  Protected (Customer only)
router.post("/", vehicleController.addUserVehicle);

// @route   GET /api/vehicles/:vehicleId
// @desc    Get a specific vehicle by ID for the authenticated customer
// @access  Protected (Customer only)
router.get("/:vehicleId", vehicleController.getUserVehicleById);

// @route   PUT /api/vehicles/:vehicleId
// @desc    Update an existing vehicle for the authenticated customer
// @access  Protected (Customer only)
router.put("/:vehicleId", vehicleController.updateUserVehicle);

// @route   DELETE /api/vehicles/:vehicleId
// @desc    Delete a vehicle for the authenticated customer
// @access  Protected (Customer only)
router.delete("/:vehicleId", vehicleController.deleteUserVehicle);

module.exports = router;
