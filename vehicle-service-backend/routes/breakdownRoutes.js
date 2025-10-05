// routes/breakdownRoutes.js

const express = require('express');
const router = express.Router();
const breakdownController = require('../controllers/breakdownController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Route to create a new breakdown request (public access - no authentication required)
router.post('/request', breakdownController.createBreakdownRequest);

// Route for a user to see their own breakdown requests (requires authentication)
router.get('/my-requests', ensureAuthenticated, breakdownController.getMyBreakdownRequests);

module.exports = router;