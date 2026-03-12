const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockCustomer = {
  findOne: jest.fn(),
  create: jest.fn()
};

const mockStaff = {
  findOne: jest.fn()
};

const mockRole = {};

const mockTokenBlacklist = {
  create: jest.fn()
};

const mockSequelize = {
  Sequelize: { Op: { or: Symbol('or') } },
  query: jest.fn(),
  QueryTypes: {
    UPDATE: 'UPDATE',
    INSERT: 'INSERT',
    SELECT: 'SELECT'
  }
};

jest.mock('../models', () => ({
  Customer: mockCustomer,
  Staff: mockStaff,
  Role: mockRole,
  TokenBlacklist: mockTokenBlacklist,
  sequelize: mockSequelize
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

jest.mock('../services/verificationEmailService', () => ({
  sendEmailVerificationLink: jest.fn().mockResolvedValue({ provider: 'console' })
}));

jest.mock('../middleware/rateLimiter', () => {
  const passThrough = (req, res, next) => next();
  return {
    authLimiter: passThrough,
    otpLimiter: passThrough,
    passwordResetLimiter: passThrough,
    verifyEmailLimiter: passThrough
  };
});

jest.mock('../utils/jwtUtils', () => ({
  verifyAccessToken: jest.fn((token) => require('jsonwebtoken').verify(token, process.env.JWT_SECRET)),
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
  hashToken: jest.fn((token) => `hash:${token}`)
}));

const bcrypt = require('bcryptjs');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/authRoutes');

const app = createTestApp('/api/v1/auth', router);

function makeAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' });
}

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers a customer and requests email verification', async () => {
    mockCustomer.findOne.mockResolvedValueOnce(null);
    mockStaff.findOne.mockResolvedValueOnce(null);
    mockCustomer.create.mockResolvedValue({
      CustomerID: 11,
      Name: 'Jane Customer',
      Email: 'jane@example.com',
      Phone: '+94771234567'
    });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Customer',
        email: 'jane@example.com',
        phone: '+94771234567',
        password: 'Secret123'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.requiresEmailVerification).toBe(true);
    expect(mockCustomer.create).toHaveBeenCalled();
  });

  test('blocks unverified customer logins', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 5,
      Name: 'Unverified',
      Email: 'user@example.com',
      Phone: '+94770000000',
      Password: 'stored-hash',
      IsEmailVerified: false
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: 'user@example.com', password: 'Secret123' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  test('returns access and refresh tokens for a verified customer login', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 7,
      Name: 'Verified User',
      Email: 'verified@example.com',
      Phone: '+94771111111',
      Password: 'stored-hash',
      IsEmailVerified: true
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: 'verified@example.com', password: 'Secret123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
    expect(response.body.user.type).toBe('Customer');
  });

  test('requires both access and refresh tokens when refreshing a session', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/required/i);
  });

  test('rejects logout without a bearer token', async () => {
    const response = await request(app).post('/api/v1/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authorization token missing');
  });

  test('blacklists the current access token on logout', async () => {
    const token = makeAccessToken({
      id: 99,
      email: 'admin@example.com',
      role: 'Admin',
      type: 'Staff'
    });

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockTokenBlacklist.create).toHaveBeenCalled();
  });

  test('verifies a valid access token', async () => {
    const token = makeAccessToken({
      id: 12,
      email: 'staff@example.com',
      role: 'Admin',
      type: 'Staff'
    });

    const response = await request(app)
      .get('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('staff@example.com');
  });

  test('rejects malformed email verification tokens', async () => {
    const response = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'bad-token' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_VERIFICATION_TOKEN');
  });
});