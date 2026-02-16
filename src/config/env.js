/**
 * Environment Configuration
 */

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/siyakha',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  }
};

module.exports = { env };
