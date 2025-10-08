// routes/staffRoutes.js

const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");

// @route   POST /api/staff/register
// @desc    Create a new staff member
// @access  Protected (should be admin-only in the future)
router.post("/register", staffController.registerStaff);

// @route   POST /api/staff/login
// @desc    Log in a staff member
// @access  Public
router.post("/login", staffController.loginStaff);

// @route   GET /api/staff/stats
// @desc    Get staff statistics
// @access  Temporarily public for testing - should be protected in production
router.get("/stats", staffController.getStaffStats);

module.exports = router;