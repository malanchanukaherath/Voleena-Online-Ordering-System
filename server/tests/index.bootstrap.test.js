const express = require('express');
const request = require('supertest');

// Simple: This handles mock create router logic.
function mockCreateRouter() {
  const router = express.Router();
  router.get('/__ping', (req, res) => {
    res.status(200).json({ ok: true });
  });
  return router;
}

jest.mock('../config/database', () => ({
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../middleware/validation', () => ({
  sanitizeInput: (req, res, next) => next()
}));

jest.mock('../middleware/auditLog', () => (req, res, next) => next());
jest.mock('../middleware/requestId', () => (req, res, next) => next());
jest.mock('../middleware/rateLimitHeaders', () => (req, res, next) => next());
jest.mock('../middleware/deprecation', () => () => (req, res, next) => next());
jest.mock('../services/automatedJobs', () => ({
  start: jest.fn(),
  stop: jest.fn()
}));

jest.mock('../routes/authRoutes', () => mockCreateRouter());
jest.mock('../routes/customers', () => mockCreateRouter());
jest.mock('../routes/staff', () => mockCreateRouter());
jest.mock('../routes/menuItems', () => mockCreateRouter());
jest.mock('../routes/categories', () => mockCreateRouter());
jest.mock('../routes/orders', () => mockCreateRouter());
jest.mock('../routes/comboPacks', () => mockCreateRouter());
jest.mock('../routes/cart', () => mockCreateRouter());
jest.mock('../routes/stock', () => mockCreateRouter());
jest.mock('../routes/payments', () => mockCreateRouter());
jest.mock('../routes/feedback', () => mockCreateRouter());
jest.mock('../routes/deliveryRoutes', () => mockCreateRouter());
jest.mock('../routes/adminRoutes', () => mockCreateRouter());
jest.mock('../routes/kitchenRoutes', () => mockCreateRouter());
jest.mock('../routes/cashierRoutes', () => mockCreateRouter());
jest.mock('../routes/uploadRoutes', () => mockCreateRouter());

describe('server bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.NODE_ENV = 'test';
    process.env.DB_SYNC = 'false';
  });

  test('exports a reusable app factory and health endpoint', async () => {
    const serverModule = require('../index');

    expect(typeof serverModule.createApp).toBe('function');
    expect(typeof serverModule.startServer).toBe('function');
    expect(serverModule.app).toBeDefined();

    const app = serverModule.createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
