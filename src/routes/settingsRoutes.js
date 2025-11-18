const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, updatePassword, connectEmail } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get user settings
router.get('/', getSettings);

// Update user settings
router.put('/', updateSettings);

// Update password
router.put('/password', updatePassword);

// Connect email service
router.post('/email/connect', connectEmail);

module.exports = router;


