const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockCustomer = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
};

const mockStaff = {
  findOne: jest.fn(),
  update: jest.fn()
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
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock('../services/verificationEmailService', () => ({
  sendEmailVerificationLink: jest.fn().mockResolvedValue({ provider: 'console' })
}));

const mockSendOTPSMS = jest.fn().mockResolvedValue({ success: true, messageId: 'sms-mock-id' });
const mockSendOTPEmail = jest.fn().mockResolvedValue({ success: true, messageId: 'email-mock-id' });

jest.mock('../services/smsService', () => ({
  sendOTPSMS: (...args) => mockSendOTPSMS(...args)
}));

jest.mock('../services/emailService', () => ({
  sendOTPEmail: (...args) => mockSendOTPEmail(...args)
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
  verifyRefreshToken: jest.fn((token) => require('jsonwebtoken').verify(token, process.env.JWT_REFRESH_SECRET)),
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
    mockSendOTPSMS.mockResolvedValue({ success: true, messageId: 'sms-mock-id' });
    mockSendOTPEmail.mockResolvedValue({ success: true, messageId: 'email-mock-id' });
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

  test('uses jwt fallback signing when token utilities are unavailable', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 17,
      Name: 'Fallback User',
      Email: 'fallback@example.com',
      Phone: '+94772222222',
      Password: 'stored-hash',
      IsEmailVerified: true
    });
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/v1/auth/customer/login')
      .send({ email: 'fallback@example.com', password: 'Secret123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();

    const decodedAccess = jwt.verify(response.body.token, process.env.JWT_SECRET);
    const decodedRefresh = jwt.verify(response.body.refreshToken, process.env.JWT_REFRESH_SECRET);

    expect(decodedAccess.email).toBe('fallback@example.com');
    expect(decodedRefresh.email).toBe('fallback@example.com');
    expect(decodedAccess.type).toBe('Customer');
    expect(decodedRefresh.type).toBe('Customer');
  });

  test('requires both access and refresh tokens when refreshing a session', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/required/i);
  });

  test('refreshes session tokens when valid refresh token is provided', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 21,
      Name: 'Refresh User',
      Email: 'refresh@example.com',
      Phone: '+94773333333',
      AccountStatus: 'ACTIVE',
      IsActive: true,
      IsEmailVerified: true
    });
    const expiredSoonAccessToken = jwt.sign(
      { id: 21, email: 'refresh@example.com', role: 'Customer', type: 'Customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    );
    const validRefreshToken = jwt.sign(
      { id: 21, email: 'refresh@example.com', role: 'Customer', type: 'Customer' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${expiredSoonAccessToken}`)
      .send({ refreshToken: validRefreshToken });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();

    const decodedAccess = jwt.verify(response.body.token, process.env.JWT_SECRET);
    const decodedRefresh = jwt.verify(response.body.refreshToken, process.env.JWT_REFRESH_SECRET);

    expect(decodedAccess.email).toBe('refresh@example.com');
    expect(decodedRefresh.email).toBe('refresh@example.com');
    expect(mockCustomer.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        CustomerID: 21,
        AccountStatus: 'ACTIVE',
        IsActive: true
      })
    }));
  });

  test('rejects refresh when the current customer is no longer active', async () => {
    mockCustomer.findOne.mockResolvedValue(null);
    const accessToken = jwt.sign(
      { id: 21, email: 'refresh@example.com', role: 'Customer', type: 'Customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1m' }
    );
    const refreshToken = jwt.sign(
      { id: 21, email: 'refresh@example.com', role: 'Customer', type: 'Customer' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid refresh token/i);
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

  test('handles password reset request for existing customer account', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 31,
      Email: 'reset@example.com',
      Phone: '+94771234567',
      Name: 'Reset User'
    });
    mockSequelize.query.mockResolvedValueOnce([{}, 1]);

    const response = await request(app)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'reset@example.com', userType: 'Customer' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/OTP sent/i);
    expect(response.body._dev_otp).toBeUndefined();

    const [insertSql, insertOptions] = mockSequelize.query.mock.calls[0];
    expect(insertSql).toContain('otp_hash');
    expect(insertSql).toContain('user_type');
    expect(insertSql).not.toContain('OTPCode');
    expect(insertOptions.replacements[2]).toMatch(/^[a-f0-9]{64}$/);
    expect(insertOptions.replacements[2]).not.toContain('reset@example.com');
    expect(mockSendOTPSMS).toHaveBeenCalledWith('+94771234567', expect.any(String), 'PASSWORD_RESET');
    expect(mockSendOTPEmail).toHaveBeenCalledWith('reset@example.com', expect.any(String), 'PASSWORD_RESET');
  });

  test('verifies reset OTP and returns reset token payload', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 41,
      Email: 'otp@example.com'
    });
    mockSequelize.query.mockResolvedValueOnce([
      { otp_id: 77 }
    ]);

    const response = await request(app)
      .post('/api/v1/auth/password-reset/verify-otp')
      .send({ email: 'otp@example.com', otp: '123456', userType: 'Customer' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.otpId).toBe(77);
    expect(response.body.resetToken).toMatch(/^[a-f0-9]{64}$/i);

    const [selectSql, selectOptions] = mockSequelize.query.mock.calls[0];
    expect(selectSql).toContain('otp_id');
    expect(selectSql).toContain('otp_hash');
    expect(selectSql).toContain('is_used');
    expect(selectSql).not.toContain('OTPCode');
    expect(selectOptions.replacements[2]).toMatch(/^[a-f0-9]{64}$/);
  });

  test('resets customer password with valid OTP', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 52,
      Email: 'update@example.com'
    });
    mockSequelize.query
      .mockResolvedValueOnce([{ otp_id: 88 }])
      .mockResolvedValueOnce([{}, 1]);
    bcrypt.hash.mockResolvedValue('hashed-password-value');
    mockCustomer.update.mockResolvedValue([1]);

    const response = await request(app)
      .post('/api/v1/auth/password-reset/reset')
      .send({
        email: 'update@example.com',
        otp: '654321',
        newPassword: 'NewSecret123',
        userType: 'Customer'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/Password reset successfully/i);
    expect(mockCustomer.update).toHaveBeenCalledWith(
      { Password: 'hashed-password-value' },
      { where: { CustomerID: 52 }, individualHooks: false }
    );

    const [selectSql, selectOptions] = mockSequelize.query.mock.calls[0];
    const [updateSql, updateOptions] = mockSequelize.query.mock.calls[1];
    expect(selectSql).toContain('otp_hash');
    expect(selectSql).not.toContain('OTPCode');
    expect(selectOptions.replacements[2]).toMatch(/^[a-f0-9]{64}$/);
    expect(updateSql).toContain('is_used');
    expect(updateSql).toContain('used_at');
    expect(updateSql).toContain('otp_id');
    expect(updateOptions.replacements).toEqual([88]);
  });

  test('accepts valid reset token and marks it used', async () => {
    const resetToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 53,
      Email: 'token-reset@example.com'
    });

    mockSequelize.query
      .mockResolvedValueOnce([{ reset_id: 19 }])
      .mockResolvedValueOnce([{ otp_id: 92 }])
      .mockResolvedValueOnce([{}, 1])
      .mockResolvedValueOnce([{}, 1]);

    bcrypt.hash.mockResolvedValue('hashed-password-value');
    mockCustomer.update.mockResolvedValue([1]);

    const response = await request(app)
      .post('/api/v1/auth/password-reset/reset')
      .send({
        email: 'token-reset@example.com',
        otp: '654321',
        newPassword: 'NewSecret123',
        userType: 'Customer',
        resetToken
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const [tokenSelectSql, tokenSelectOptions] = mockSequelize.query.mock.calls[0];
    const [tokenUpdateSql, tokenUpdateOptions] = mockSequelize.query.mock.calls[3];

    expect(tokenSelectSql).toContain('FROM password_reset');
    expect(tokenSelectOptions.replacements[2]).toBe(resetToken);
    expect(tokenUpdateSql).toContain('UPDATE password_reset');
    expect(tokenUpdateOptions.replacements).toEqual([19]);
  });
});
