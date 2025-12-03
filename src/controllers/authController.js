const User = require('../models/User');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { hashOTP } = require('../utils/crypto');
const { sendEmail } = require('../utils/emailService');

// Helper to normalize role to frontend format
const normalizeRole = (role) => {
  const roleMap = {
    'admin': 'Admin',
    'staff': 'Supervisor',
    'technician': 'Technician',
    'cashier': 'Cashier',
    'Admin': 'Admin',
    'Supervisor': 'Supervisor',
    'Technician': 'Technician',
    'Cashier': 'Cashier'
  };
  return roleMap[role] || 'Technician';
};

// Helper to get status from isActive
const getStatus = (user) => {
  if (!user.isEmailVerified) return 'pending';
  if (!user.isActive) return 'blocked';
  return 'active';
};

// @desc    Sign up a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Check if this is the first user in the database
    const userCount = await User.countDocuments();
    let userRole = role || 'Technician';

    // If no users exist, make first user admin automatically
    if (userCount === 0) {
      userRole = 'Admin';
      console.log('\n========================================');
      console.log('👑 FIRST USER - AUTOMATICALLY SET AS ADMIN');
      console.log('========================================\n');
    } else {
      // For subsequent users, default to 'Technician' role
      // Only allow 'Supervisor', 'Technician', or 'Cashier' roles for public signup
      // Admin role can only be assigned by existing admins
      const allowedRoles = ['Supervisor', 'Technician', 'Cashier', 'staff', 'technician', 'cashier'];
      if (role && allowedRoles.includes(role)) {
        userRole = normalizeRole(role);
      } else {
        userRole = 'Technician';
      }
    }

    // Generate verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      isEmailVerified: false,
      verificationOTP: hashOTP(otp),
      verificationOTPExpire: Date.now() + 10 * 60 * 1000 // 10 min
    });

    await user.save();

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email - Momentum POS',
        text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #c53032; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Momentum POS</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
              <p style="color: #666; line-height: 1.6;">Hello ${name},</p>
              <p style="color: #666; line-height: 1.6;">Your verification OTP is:</p>
              <div style="background-color: white; border: 2px dashed #c53032; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <h1 style="color: #c53032; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #666; line-height: 1.6;">This OTP expires in 10 minutes.</p>
            </div>
          </div>
        `
      });
      console.log(`\n========================================`);
      console.log(`📧 VERIFICATION OTP FOR ${email.toUpperCase()}`);
      console.log(`========================================`);
      console.log(`OTP: ${otp}`);
      console.log(`User ID: ${user._id}`);
      console.log(`Role: ${user.role}`);
      console.log(`Expires in: 10 minutes`);
      console.log(`========================================\n`);
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        error: 'Email failed, please try again'
      });
    }

    res.status(201).json({
      success: true,
      message: userRole === 'admin' || userRole === 'Admin'
        ? 'Admin user created successfully. Please verify your email to complete setup.'
        : 'User created successfully. Please verify your email.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        status: 'pending' // New users are pending until email verified
      },
      isFirstUser: userCount === 0
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during signup'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user + include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Optional: require email verification
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email first',
        requiresVerification: true,
        userId: user._id
      });
    }

    // Generate tokens
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, role: user.role });

    // Store refresh token in DB
    if (!Array.isArray(user.refreshTokens)) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push({ token: refreshToken });
    await user.save({ validateBeforeSave: false });

    // Send response
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        status: getStatus(user)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate 6-digit OTP & expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = hashOTP(otp);
    user.passwordResetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    // Log OTP immediately for development/debugging
    console.log('\n========================================');
    console.log('🔑 PASSWORD RESET OTP');
    console.log('========================================');
    console.log(`Email: ${email}`);
    console.log(`User: ${user.name}`);
    console.log(`OTP: ${otp}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Expires in: 10 minutes`);
    console.log('========================================\n');

    // Send email
    try {
      await sendEmail({
        to: email,
        subject: 'Reset your password - Momentum POS',
        text: `Your password-reset OTP is ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #c53032; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Momentum POS</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
              <p style="color: #666; line-height: 1.6;">Hello ${user.name},</p>
              <p style="color: #666; line-height: 1.6;">Your password-reset OTP is:</p>
              <div style="background-color: white; border: 2px dashed #c53032; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <h1 style="color: #c53032; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #666; line-height: 1.6;">This OTP expires in 10 minutes.</p>
            </div>
          </div>
        `
      });
    } catch (err) {
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        error: 'Email failed, please try again'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password-reset OTP sent to email',
      userId: user._id
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during forgot-password'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Hash incoming OTP
    const hashedOTP = hashOTP(otp);

    // Find user by ID with matching verification OTP & not expired
    const user = await User.findOne({
      _id: userId,
      verificationOTP: hashedOTP,
      verificationOTPExpire: { $gt: Date.now() }
    }).select('+verificationOTP +verificationOTPExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Mark email verified & clear OTP fields
    user.isEmailVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during email verification'
    });
  }
};

// @desc    Send verification OTP
// @route   POST /api/auth/send-verification-otp
// @access  Public
const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    // Generate verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = hashOTP(otp);
    user.verificationOTPExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    // Send email (check console for the OTP)
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email - Momentum POS',
        text: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #c53032; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Momentum POS</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
              <p style="color: #666; line-height: 1.6;">Hello ${user.name},</p>
              <p style="color: #666; line-height: 1.6;">Your verification OTP is:</p>
              <div style="background-color: white; border: 2px dashed #c53032; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <h1 style="color: #c53032; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #666; line-height: 1.6;">This OTP expires in 10 minutes.</p>
            </div>
          </div>
        `
      });
      console.log(`DEBUG: OTP for ${email} is ${otp}`); // For testing
    } catch (err) {
      user.verificationOTP = undefined;
      user.verificationOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        error: 'Email failed, please try again'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent to email',
      userId: user._id
    });
  } catch (err) {
    console.error('Send verification OTP error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const hashedOTP = hashOTP(otp);

    // Find user with matching password-reset OTP & not expired
    const user = await User.findOne({
      _id: userId,
      passwordResetOTP: hashedOTP,
      passwordResetOTPExpire: { $gt: Date.now() }
    }).select('+passwordResetOTP +passwordResetOTPExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Update password & clear reset fields
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpire = undefined;
    user.refreshTokens = []; // Invalidate all old refresh tokens
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset'
    });
  }
};

// @desc    Delete current authenticated user account
// @route   DELETE /api/auth/delete-me
// @access  Private
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error while deleting account'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        status: getStatus(user)
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching user'
    });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  verifyEmail,
  sendVerificationOTP,
  resetPassword,
  deleteUser,
  getMe
};
