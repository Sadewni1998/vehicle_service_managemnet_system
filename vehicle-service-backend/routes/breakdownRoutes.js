// routes/breakdownRoutes.js

const express = require("express");
const router = express.Router();
const breakdownController = require("../controllers/breakdownController");
const {
  ensureAuthenticated,
  checkRole,
} = require("../middleware/authMiddleware");

// Route to create a new breakdown request (public access - no authentication required)
router.post("/request", breakdownController.createBreakdownRequest);

// Route for a user to see their own breakdown requests (requires authentication)
router.get(
  "/my-requests",
  ensureAuthenticated,
  breakdownController.getMyBreakdownRequests
);

// Staff/Management routes
// Only staff roles are allowed to manage breakdown requests
router.get(
  "/",
  ensureAuthenticated,
  checkRole(["manager", "service_advisor", "receptionist"]),
  breakdownController.getAllBreakdownRequests
);

router.get(
  "/:id",
  ensureAuthenticated,
  checkRole(["manager", "service_advisor", "receptionist"]),
  breakdownController.getBreakdownRequestById
);

router.put(
  "/:id/status",
  ensureAuthenticated,
  checkRole(["manager", "service_advisor", "receptionist"]),
  breakdownController.updateBreakdownRequestStatus
);

router.get(
  "/stats",
  ensureAuthenticated,
  checkRole(["manager", "service_advisor", "receptionist"]),
  breakdownController.getBreakdownStats
);

module.exports = router;
