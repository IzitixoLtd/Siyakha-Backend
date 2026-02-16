/**
 * Siyakha Backend - Main Server Entry Point
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDB } = require('./src/config/database');
const { env } = require('./src/config/env');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimit');

// Initialize Express app
const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compress responses
app.use(compression());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', apiLimiter);

// ===========================================
// ROUTES
// ===========================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Global error handler
app.use(errorHandler);

// ===========================================
// START SERVER
// ===========================================

const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    app.listen(env.port, () => {
      console.log(`

                                               
  SIYAKHA BACKEND SERVER                   
   Environment: ${env.nodeEnv.padEnd(28)}  
   Port: ${env.port.toString().padEnd(35)}║
   API: http://localhost:${env.port}/api${' '.repeat(16)}
                                               

      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

startServer();

module.exports = app;
