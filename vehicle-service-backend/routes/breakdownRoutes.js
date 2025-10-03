// routes/breakdownRoutes.js

const express = require('express');
const router = express.Router();
const breakdownController = require('../controllers/breakdownController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Route to create a new breakdown request
// A user MUST be logged in to access this, so we use the 'protect' middleware
router.post('/request', ensureAuthenticated, breakdownController.createBreakdownRequest);

// Route for a user to see their own breakdown requests
router.get('/my-requests', ensureAuthenticated, breakdownController.getMyBreakdownRequests);

module.exports = router;