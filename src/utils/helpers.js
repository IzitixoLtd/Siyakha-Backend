/**
 * Utility Helpers
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

const generateAccessToken = (userId) => jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
const generateRefreshToken = (userId) => jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });
const generateTokens = (userId) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
  expiresIn: env.jwtExpiresIn
});

const parsePagination = (query, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaults.limit || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const getDateRange = (period) => {
  const now = new Date();
  let startDate;
  switch (period) {
    case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
    case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
    case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
    case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
    default: startDate = new Date(0);
  }
  return { startDate, endDate: new Date() };
};

module.exports = { generateTokens, generateAccessToken, generateRefreshToken, parsePagination, getDateRange };
