const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const csrf = require('csurf');
require('dotenv').config();

const sequelize = require('./config/database');
const { sanitizeInput } = require('./middleware/validation');
const auditLogMiddleware = require('./middleware/auditLog');
const requestIdMiddleware = require('./middleware/requestId');
const rateLimitHeadersMiddleware = require('./middleware/rateLimitHeaders');
const automatedJobs = require('./services/automatedJobs'); // Daily stock creation, order timeout, etc.

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration - CRITICAL: Require explicit FRONTEND_URL
if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === '*') {
  throw new Error('CRITICAL: FRONTEND_URL must be explicitly set in .env (CORS cannot be wildcard)');
}

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
app.use(cors(corsOptions));

// =====================================================
// GENERAL MIDDLEWARE
// =====================================================

// Request ID middleware - add before other middleware for tracing
app.use(requestIdMiddleware);

// Body parsing
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Input sanitization
app.use(sanitizeInput);

// Rate limit headers middleware
app.use(rateLimitHeadersMiddleware);

// Audit logging middleware (logs all state-changing operations)
app.use(auditLogMiddleware);

// =====================================================
// API ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API version 1 routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/customers', require('./routes/customers'));
app.use('/api/v1/staff', require('./routes/staff'));
app.use('/api/v1/menu', require('./routes/menuItems'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/combos', require('./routes/comboPacks'));
app.use('/api/v1/cart', require('./routes/cart'));
app.use('/api/v1/stock', require('./routes/stock'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/delivery', require('./routes/deliveryRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/kitchen', require('./routes/kitchenRoutes'));
app.use('/api/v1/cashier', require('./routes/cashierRoutes'));

// DEPRECATED: Legacy aliases for backward compatibility only
// These routes will be removed in v3.0 (2026-06-01)
// Please migrate to /api/v1/* routes
const deprecationMiddleware = require('./middleware/deprecation');

app.use('/api/auth', deprecationMiddleware('/auth'), require('./routes/authRoutes'));
app.use('/api/customers', deprecationMiddleware('/customers'), require('./routes/customers'));
app.use('/api/staff', deprecationMiddleware('/staff'), require('./routes/staff'));
app.use('/api/menu', deprecationMiddleware('/menu'), require('./routes/menuItems'));
app.use('/api/categories', deprecationMiddleware('/categories'), require('./routes/categories'));
app.use('/api/orders', deprecationMiddleware('/orders'), require('./routes/orders'));
app.use('/api/combos', deprecationMiddleware('/combos'), require('./routes/comboPacks'));
app.use('/api/cart', deprecationMiddleware('/cart'), require('./routes/cart'));
app.use('/api/stock', deprecationMiddleware('/stock'), require('./routes/stock'));
app.use('/api/payments', deprecationMiddleware('/payments'), require('./routes/payments'));
app.use('/api/delivery', deprecationMiddleware('/delivery'), require('./routes/deliveryRoutes'));
app.use('/api/admin', deprecationMiddleware('/admin'), require('./routes/adminRoutes'));
app.use('/api/kitchen', deprecationMiddleware('/kitchen'), require('./routes/kitchenRoutes'));
app.use('/api/cashier', deprecationMiddleware('/cashier'), require('./routes/cashierRoutes'));

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} already exists`
      }))
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// SERVER INITIALIZATION
// =====================================================

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models only when explicitly enabled
    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: false });
      console.log('✅ Models synchronized');
    }

    // Start automated jobs (Daily stock creation @ 12:00 AM, etc.)
    automatedJobs.start();

    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Voleena Foods API Server`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  automatedJobs.stop();
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  automatedJobs.stop();
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
