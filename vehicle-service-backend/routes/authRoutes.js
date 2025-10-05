// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");

// Define the registration route
// POST /api/auth/register
router.post("/register", authController.register);

// Define the login route
// POST /api/auth/login
router.post("/login", authController.login);

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
module.exports = router;
