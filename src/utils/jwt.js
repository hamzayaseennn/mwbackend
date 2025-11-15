const jwt = require('jsonwebtoken');

const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret', { 
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' 
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret', { 
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' 
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret');
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret');
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

