// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

/**
 * Middleware to ensure the user is authenticated.
 */
const ensureAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user information to the request object
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

/**
 * Middleware to check if the user has one of the required roles.
 * This MUST run *after* the 'protect' middleware.
 */
const checkRole = (roles) => (req, res, next) => {
  // The 'protect' middleware should have already attached the user/staff object to req
  const user = req.user || req.staff; // Check for customer or staff

  if (!user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!roles.includes(user.role)) {
    return res.status(403).json({ message: 'Forbidden: You do not have permission for this action.' });
  }
  
  next(); // If role is allowed, proceed
};

module.exports = { ensureAuthenticated, checkRole };
