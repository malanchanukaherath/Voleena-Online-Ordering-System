const { Sequelize } = require('sequelize');
require('dotenv').config();
const crypto = require('crypto');

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Validate JWT secret strength
if (process.env.JWT_SECRET === 'change-me' || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long and not the default value');
}

// Validate JWT_SECRET has sufficient entropy (at least 20% non-alphanumeric)
const specialChars = process.env.JWT_SECRET.match(/[^a-zA-Z0-9]/g) || [];
if (specialChars.length < Math.floor(process.env.JWT_SECRET.length * 0.15)) {
  throw new Error('JWT_SECRET must contain special characters for sufficient entropy');
}

// Validate refresh token secret is different from access token secret
if (process.env.JWT_REFRESH_SECRET === process.env.JWT_SECRET) {
  throw new Error('JWT_REFRESH_SECRET must be different from JWT_SECRET');
}

// Validate FRONTEND_URL is set (prevent CORS open wildcard)
if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === '*') {
  throw new Error('FRONTEND_URL must be explicitly set. CORS wildcard not allowed in production.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 30,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000
    },
    connectTimeout: 5000,
    timezone: process.env.TZ || 'Asia/Colombo',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true
    }
  }
);

// Export sequelize instance
// Connection will be tested when server starts
module.exports = sequelize;
