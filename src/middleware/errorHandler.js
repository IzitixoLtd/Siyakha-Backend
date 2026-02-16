/**
 * Error Handler Middleware
 */

const { env } = require('../config/env');

class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // Mongoose errors
  if (err.name === 'CastError') { statusCode = 400; message = 'Invalid ID format'; }
  if (err.code === 11000) { statusCode = 409; message = 'Duplicate entry'; }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
  }

  if (env.nodeEnv === 'development') console.error('Error:', err);

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(env.nodeEnv === 'development' && { stack: err.stack })
  });
};

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, errorHandler, asyncHandler };
