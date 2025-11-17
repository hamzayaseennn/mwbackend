const Settings = require('../models/Settings');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user settings (create default if doesn't exist)
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await Settings.findOne({ user: userId });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = new Settings({ user: userId });
      await settings.save();
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Find or create settings
    let settings = await Settings.findOne({ user: userId });

    if (!settings) {
      settings = new Settings({ user: userId });
    }

    // Update workshop settings
    if (updates.workshop) {
      settings.workshop = { ...settings.workshop, ...updates.workshop };
    }

    // Update tax settings
    if (updates.tax) {
      settings.tax = { ...settings.tax, ...updates.tax };
    }

    // Update notification settings
    if (updates.notifications) {
      settings.notifications = { ...settings.notifications, ...updates.notifications };
    }

    // Update email settings
    if (updates.email) {
      settings.email = { ...settings.email, ...updates.email };
    }

    // Update security settings
    if (updates.security) {
      settings.security = { ...settings.security, ...updates.security };
    }

    // Update advanced settings
    if (updates.advanced) {
      settings.advanced = { ...settings.advanced, ...updates.advanced };
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
};

// Connect email service (placeholder - implement actual OAuth/SMTP later)
exports.connectEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider, credentials } = req.body; // provider: 'smtp', 'google', 'outlook'

    let settings = await Settings.findOne({ user: userId });
    if (!settings) {
      settings = new Settings({ user: userId });
    }

    // Update email configuration based on provider
    if (provider === 'smtp') {
      settings.email.smtpConfigured = true;
      // Store SMTP credentials (should be encrypted in production)
      settings.email.smtpConfig = credentials;
    } else if (provider === 'google') {
      settings.email.googleConfigured = true;
      settings.email.googleConfig = credentials;
    } else if (provider === 'outlook') {
      settings.email.outlookConfigured = true;
      settings.email.outlookConfig = credentials;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: `${provider} email service connected successfully`,
      data: {
        smtpConfigured: settings.email.smtpConfigured,
        googleConfigured: settings.email.googleConfigured,
        outlookConfigured: settings.email.outlookConfigured
      }
    });
  } catch (error) {
    console.error('Error connecting email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect email service',
      error: error.message
    });
  }
};

