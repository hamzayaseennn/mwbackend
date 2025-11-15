const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  verifyEmail,
  sendVerificationOTP,
  resetPassword,
  deleteUser,
  getMe
} = require('../controllers/authController');
const { signupRules, loginRules, forgotRules } = require('../validators/authValidator');
const { resetPasswordRules } = require('../validators/resetValidator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

/**
 * Auth routes
 */
router.delete('/delete-me', protect, deleteUser);

// Signup route
router.post('/signup', validate(signupRules), signup);

// Login route
router.post('/login', validate(loginRules), login);

// Forgot password route
router.post('/forgot-password', validate(forgotRules), forgotPassword);

// Send verification OTP route
router.post('/send-verification-otp', validate([body('email').isEmail().normalizeEmail()]), sendVerificationOTP);

// Verify email route - now requires userId and otp
router.post('/verify-email', validate([
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
]), verifyEmail);

// Reset password route
router.post('/reset-password', validate(resetPasswordRules), resetPassword);

// Get current user route
router.get('/me', protect, getMe);

module.exports = router;
