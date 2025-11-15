const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

// Verify JWT token middleware (alias for protect)
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Read token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user (optional: confirm still exists)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, invalid token'
    });
  }
};

// Protect middleware (same as authenticate but with different name for compatibility)
const protect = authenticate;

// Optional: Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  protect,
  authorize
};

