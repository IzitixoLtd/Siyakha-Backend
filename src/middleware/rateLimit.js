/**
 * Rate Limiting Middleware
 */

const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => env.nodeEnv === 'development'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  skip: () => env.nodeEnv === 'development'
});

const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Please slow down.' },
  skip: () => env.nodeEnv === 'development'
});

module.exports = { apiLimiter, authLimiter, aiChatLimiter };
