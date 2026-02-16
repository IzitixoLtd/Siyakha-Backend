/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      return res.status(401).json({ success: false, message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (user?.isActive) { req.user = user; req.userId = user._id; }
      } catch {}
    }
    next();
  } catch { next(); }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });
    
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(decoded.userId);
    if (!user?.isActive) return res.status(401).json({ success: false, message: 'User not found' });
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

module.exports = { authenticate, optionalAuth, verifyRefreshToken };
