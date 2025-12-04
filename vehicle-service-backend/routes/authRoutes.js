// routes/authRoutes.js
// Updated to include customer stats endpoint

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  ensureAuthenticated,
  checkRole,
} = require("../middleware/authMiddleware");

// Define the registration route
// POST /api/auth/register
router.post("/register", authController.register);

// Define the login route
// POST /api/auth/login
router.post("/login", authController.login);

// Define the forgot password route
// POST /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword);

// Protected routes
router.get("/profile", ensureAuthenticated, authController.getProfile);
router.put("/profile", ensureAuthenticated, authController.updateProfile);
router.put(
  "/change-password",
  ensureAuthenticated,
  authController.changePassword
);

// Add the new route for Google Sign-In
// @route   POST /api/auth/google
// @desc    Authenticate user with Google
// @access  Public
router.post("/google", authController.googleSignIn);

// @route   GET /api/auth/stats
// @desc    Get customer statistics
// @access  Public (or Protected if needed)
router.get("/stats", authController.getCustomerStats);

// @route   GET /api/auth/customers
// @desc    Get all customers
// @access  Protected (Manager only)
router.get(
  "/customers",
  ensureAuthenticated,
  checkRole(["manager"]),
  authController.getAllCustomers
);

module.exports = router;
