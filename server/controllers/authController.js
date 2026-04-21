// CODEMAP: BACKEND_CONTROLLER_AUTHCONTROLLER
// PURPOSE: Handles incoming requests, processes logic, and returns responses.
// SEARCH_HINT: Look here for request handling logic and data processing.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Customer, Staff, Role, sequelize } = require('../models');
const { sendEmailVerificationLink } = require('../services/verificationEmailService');
const { sendOTPSMS } = require('../services/smsService');
const { sendOTPEmail } = require('../services/emailService');
const {
  generateAccessToken,
  generateRefreshToken: generateRefreshJwt,
  verifyAccessToken,
  verifyRefreshToken
} = require('../utils/jwtUtils');

const accessTokenFallbackSecret = process.env.JWT_SECRET;
const refreshTokenFallbackSecret = process.env.JWT_REFRESH_SECRET;

const EMAIL_VERIFICATION_TTL_MINUTES = parseInt(process.env.EMAIL_VERIFICATION_TTL_MINUTES || '30', 10);
const EMAIL_RESEND_COOLDOWN_SECONDS = parseInt(process.env.EMAIL_RESEND_COOLDOWN_SECONDS || '60', 10);
const VERIFICATION_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const EMAIL_CHANGE_TOKEN_SECRET = process.env.EMAIL_CHANGE_TOKEN_SECRET || accessTokenFallbackSecret;
const EMAIL_CHANGE_TOKEN_PURPOSE = 'CUSTOMER_EMAIL_CHANGE';
const PASSWORD_RESET_TOKEN_TTL_MINUTES = parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '15', 10);
const PASSWORD_RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

/**
 * Generate JWT Token with 30-minute expiry
 */
// Simple: This creates the token.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const generateToken = (payload) => {
  if (typeof generateAccessToken === 'function') {
    return generateAccessToken(payload);
  }
  return jwt.sign(payload, accessTokenFallbackSecret, {
    expiresIn: process.env.JWT_EXPIRE || '30m'
  });
};

// Simple: This creates the refresh token.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const generateRefreshToken = (payload) => {
  if (typeof generateRefreshJwt === 'function') {
    return generateRefreshJwt(payload);
  }
  return jwt.sign(payload, refreshTokenFallbackSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Simple: This handles hash verification token logic.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const hashVerificationToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Simple: This handles hash otp code logic.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const hashOtpCode = (otpCode) => {
  return crypto.createHash('sha256').update(String(otpCode).trim()).digest('hex');
};

// Simple: This creates the email verification token.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Simple: This creates the email verification url.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const buildEmailVerificationUrl = (token) => {
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return `${frontendBase}/verify-email?token=${encodeURIComponent(token)}`;
};

// Simple: This creates the email verification token.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const createEmailVerificationToken = async (customerId, invalidateExisting = true) => {
  if (invalidateExisting) {
    await sequelize.query(
      `UPDATE email_verification_token
       SET used_at = NOW()
       WHERE customer_id = ? AND used_at IS NULL`,
      {
        replacements: [customerId],
        type: sequelize.QueryTypes.UPDATE
      }
    );
  }

  const token = generateEmailVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

  await sequelize.query(
    `INSERT INTO email_verification_token (customer_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    {
      replacements: [customerId, tokenHash, expiresAt],
      type: sequelize.QueryTypes.INSERT
    }
  );

  return {
    token,
    tokenHash
  };
};

// Simple: This updates the email verification token used.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const markEmailVerificationTokenUsed = async (tokenHash) => {
  await sequelize.query(
    `UPDATE email_verification_token
     SET used_at = NOW()
     WHERE token_hash = ? AND used_at IS NULL`,
    {
      replacements: [tokenHash],
      type: sequelize.QueryTypes.UPDATE
    }
  );
};

// Simple: This handles issue verification email logic.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const issueVerificationEmail = async (customer, options = {}) => {
  const { enforceCooldown = false } = options;

  if (enforceCooldown) {
    const [latestToken] = await sequelize.query(
      `SELECT created_at
       FROM email_verification_token
       WHERE customer_id = ? AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      {
        replacements: [customer.CustomerID],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (latestToken) {
      const ageInSeconds = Math.floor((Date.now() - new Date(latestToken.created_at).getTime()) / 1000);
      const retryAfterSeconds = Math.max(EMAIL_RESEND_COOLDOWN_SECONDS - ageInSeconds, 0);

      if (retryAfterSeconds > 0) {
        return {
          sent: false,
          skipped: true,
          retryAfterSeconds
        };
      }
    }
  }

  const { token, tokenHash } = await createEmailVerificationToken(customer.CustomerID);
  const verificationUrl = buildEmailVerificationUrl(token);

  try {
    const delivery = await sendEmailVerificationLink(customer.Email, customer.Name, verificationUrl);

    return {
      sent: true,
      delivery
    };
  } catch (error) {
    await markEmailVerificationTokenUsed(tokenHash);
    throw error;
  }
};

/**
 * Validate email format
 */
// Simple: This checks whether valid email is true.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validate password strength
 */
// Simple: This checks whether valid password is true.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const isValidPassword = (password) => password && password.length >= 8;

// Simple: This checks whether successful delivery result is true.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const isSuccessfulDeliveryResult = (deliveryResult) => {
  return Boolean(deliveryResult && deliveryResult.success === true && deliveryResult.skipped !== true);
};

// Simple: This checks if the registration email token is correct.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const verifyRegistrationEmailToken = async (rawToken, res) => {
  const transaction = await sequelize.transaction();

  try {
    const tokenHash = hashVerificationToken(rawToken);

    const [record] = await sequelize.query(
      `SELECT
         evt.email_verification_token_id,
         evt.customer_id,
         evt.expires_at,
         evt.used_at,
         c.is_email_verified
       FROM email_verification_token evt
       INNER JOIN customer c ON c.customer_id = evt.customer_id
       WHERE evt.token_hash = ?
       ORDER BY evt.created_at DESC
       LIMIT 1
       FOR UPDATE`,
      {
        replacements: [tokenHash],
        type: sequelize.QueryTypes.SELECT,
        transaction
      }
    );

    if (!record) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid verification link',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    if (record.used_at) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Verification link was already used',
        code: 'VERIFICATION_TOKEN_USED'
      });
    }

    if (new Date(record.expires_at) <= new Date()) {
      await sequelize.query(
        `UPDATE email_verification_token
         SET used_at = NOW()
         WHERE email_verification_token_id = ?`,
        {
          replacements: [record.email_verification_token_id],
          type: sequelize.QueryTypes.UPDATE,
          transaction
        }
      );

      await transaction.commit();
      return res.status(400).json({
        error: 'Verification link expired. Request a new verification email.',
        code: 'VERIFICATION_TOKEN_EXPIRED'
      });
    }

    if (!record.is_email_verified) {
      await sequelize.query(
        `UPDATE customer
         SET is_email_verified = 1
         WHERE customer_id = ?`,
        {
          replacements: [record.customer_id],
          type: sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
    }

    await sequelize.query(
      `UPDATE email_verification_token
       SET used_at = NOW()
       WHERE email_verification_token_id = ?`,
      {
        replacements: [record.email_verification_token_id],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
};

// Simple: This checks if the customer email change token is correct.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const verifyCustomerEmailChangeToken = async (rawToken, res) => {
  let decoded;

  try {
    decoded = jwt.verify(rawToken, EMAIL_CHANGE_TOKEN_SECRET);
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Email change link expired. Request a new email change from your profile settings.',
        code: 'EMAIL_CHANGE_TOKEN_EXPIRED'
      });
    }

    return res.status(400).json({
      error: 'Invalid verification link',
      code: 'INVALID_VERIFICATION_TOKEN'
    });
  }

  const tokenPurpose = decoded?.purpose;
  const customerId = Number(decoded?.customerId);
  const currentEmail = String(decoded?.currentEmail || '').trim().toLowerCase();
  const newEmail = String(decoded?.newEmail || '').trim().toLowerCase();

  if (tokenPurpose !== EMAIL_CHANGE_TOKEN_PURPOSE || !Number.isInteger(customerId) || !newEmail || !isValidEmail(newEmail)) {
    return res.status(400).json({
      error: 'Invalid verification link',
      code: 'INVALID_VERIFICATION_TOKEN'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const customer = await Customer.findByPk(customerId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!customer || customer.AccountStatus !== 'ACTIVE' || !customer.IsActive) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid verification link',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    const currentDbEmail = String(customer.Email || '').trim().toLowerCase();

    if (currentDbEmail !== currentEmail) {
      if (currentDbEmail === newEmail) {
        await transaction.rollback();
        return res.json({
          success: true,
          message: 'Email is already updated and verified. You can continue using your account.'
        });
      }

      await transaction.rollback();
      return res.status(400).json({
        error: 'This email change link is no longer valid. Request a new email change from profile settings.',
        code: 'EMAIL_CHANGE_TOKEN_STALE'
      });
    }

    const duplicateCustomer = await Customer.findOne({
      where: {
        Email: newEmail,
        CustomerID: { [sequelize.Sequelize.Op.ne]: customer.CustomerID }
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (duplicateCustomer) {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Email is already used by another customer',
        code: 'EMAIL_CHANGE_CONFLICT'
      });
    }

    customer.Email = newEmail;
    customer.IsEmailVerified = true;
    await customer.save({ transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Email address updated and verified successfully. You can continue using your account.'
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Email change verification error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
};

// Simple: This checks whether password reset table missing error is true.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const isPasswordResetTableMissingError = (error) => {
  const mysqlCode = error?.original?.code || error?.parent?.code;
  const message = [error?.message, error?.original?.sqlMessage, error?.parent?.sqlMessage]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return mysqlCode === 'ER_NO_SUCH_TABLE' && message.includes('password_reset')
    || (message.includes('no such table') && message.includes('password_reset'))
    || (message.includes("doesn't exist") && message.includes('password_reset'));
};

// Simple: This creates the refresh payload from current user.
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
const buildRefreshPayloadFromCurrentUser = async (decoded) => {
  if (decoded.type === 'Customer') {
    const customer = await Customer.findOne({
      where: {
        CustomerID: decoded.id,
        AccountStatus: 'ACTIVE',
        IsActive: true
      }
    });

    if (!customer || !customer.IsEmailVerified) {
      throw new Error('USER_NOT_ACTIVE');
    }

    return {
      id: customer.CustomerID,
      name: customer.Name,
      email: customer.Email,
      phone: customer.Phone,
      role: 'Customer',
      type: 'Customer'
    };
  }

  if (decoded.type === 'Staff') {
    const staff = await Staff.findOne({
      where: {
        StaffID: decoded.id,
        IsActive: true
      },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['RoleID', 'RoleName', 'Description']
      }]
    });

    if (!staff) {
      throw new Error('USER_NOT_ACTIVE');
    }

    return {
      id: staff.StaffID,
      name: staff.Name,
      email: staff.Email,
      role: staff.role ? staff.role.RoleName : 'Staff',
      roleId: staff.RoleID,
      type: 'Staff',
      permissions: {}
    };
  }

  throw new Error('USER_NOT_ACTIVE');
};

/**
 * Staff Login - Admin, Cashier, Kitchen, Delivery
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find staff with role
    const staff = await Staff.findOne({
      where: { Email: normalizedEmail, IsActive: true },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['RoleID', 'RoleName', 'Description']
      }]
    });

    if (!staff) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(password, staff.Password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const roleName = staff.role ? staff.role.RoleName : 'Staff';

    // Create JWT payload
    const payload = {
      id: staff.StaffID,
      name: staff.Name,
      email: staff.Email,
      role: roleName,
      roleId: staff.RoleID,
      type: 'Staff',
      permissions: {}
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: payload,
      expiresIn: 1800 // 30 minutes in seconds
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Customer Login
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const customer = await Customer.findOne({
      where: { Email: normalizedEmail, AccountStatus: 'ACTIVE' }
    });

    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, customer.Password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!customer.IsEmailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    const payload = {
      id: customer.CustomerID,
      name: customer.Name,
      email: customer.Email,
      phone: customer.Phone,
      role: 'Customer',
      type: 'Customer'
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.json({
      success: true,
      token,
      refreshToken,
      user: payload,
      expiresIn: 1800
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Customer Register
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, profileImageUrl, ProfileImageURL } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\s/g, '');

    if (!/^[+]?[0-9]{9,15}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const [existingCustomer, existingStaff] = await Promise.all([
      Customer.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [{ Email: normalizedEmail }, { Phone: normalizedPhone }]
        }
      }),
      Staff.findOne({ where: { Email: normalizedEmail } })
    ]);

    if (existingStaff) {
      return res.status(409).json({ error: 'This email is already used by a staff account' });
    }

    if (existingCustomer) {
      return res.status(409).json({ error: 'Customer with this email or phone already exists' });
    }

    const customer = await Customer.create({
      Name: name.trim(),
      Email: normalizedEmail,
      Phone: normalizedPhone,
      ProfileImageURL: profileImageUrl || ProfileImageURL || null,
      Password: password,
      AccountStatus: 'ACTIVE',
      IsEmailVerified: false,
      IsPhoneVerified: false,
      IsActive: true,
      PreferredNotification: 'BOTH'
    });

    let emailSent = true;

    try {
      await issueVerificationEmail(customer);
    } catch (emailError) {
      emailSent = false;
      console.error('Email verification send failed:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      requiresEmailVerification: true,
      emailSent,
      message: emailSent
        ? 'Registration successful. Please verify your email before logging in.'
        : 'Registration successful. Verification email could not be sent. Please request a new verification email from login.'
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Refresh Token - extends session by another 30 minutes AND issues new refresh token
 * CRITICAL: Implements token rotation to prevent token sliding attacks
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const refreshTokenHeader = req.headers['x-refresh-token'] || '';

    // Get access token from Authorization header
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Get refresh token from header or body
    const refreshToken = refreshTokenHeader || req.body?.refreshToken;

    if (!accessToken || !refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token and refresh token are required'
      });
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Generate new tokens only after checking the current user and role state.
      const newPayload = await buildRefreshPayloadFromCurrentUser(decoded);

      const newAccessToken = generateToken(newPayload);

      // CRITICAL: Generate NEW refresh token (token rotation)
      const newRefreshToken = generateRefreshToken(newPayload);

      return res.json({
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: newPayload,
        expiresIn: 1800 // 30 minutes
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired. Please login again'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

/**
 * Logout - Server-side token blacklisting
 * CRITICAL: Blacklists the token to prevent reuse after logout
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Blacklist the token
    const { TokenBlacklist } = require('../models');
    const { hashToken } = require('../utils/jwtUtils');

    const tokenHash = hashToken(token);
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await TokenBlacklist.create({
      token_hash: tokenHash,
      user_type: decoded.type,
      user_id: decoded.id,
      expires_at: expiresAt,
      reason: 'LOGOUT'
    });

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Verify current token and return user info
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyAccessToken(token);
    return res.json({ success: true, user: decoded });
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Verify email using one-time verification token
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.verifyEmail = async (req, res) => {
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
  const rawToken = (req.body?.token || '').trim();

  if (!rawToken) {
    return res.status(400).json({
      error: 'Invalid verification link',
      code: 'INVALID_VERIFICATION_TOKEN'
    });
  }

  if (VERIFICATION_TOKEN_PATTERN.test(rawToken)) {
    return verifyRegistrationEmailToken(rawToken, res);
  }

  return verifyCustomerEmailChangeToken(rawToken, res);
};

/**
 * Resend email verification link
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.resendEmailVerification = async (req, res) => {
  try {
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
    const email = (req.body?.email || '').trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const genericSuccess = {
      success: true,
      message: 'If your account exists and is not verified, a verification email has been sent.'
    };

    const customer = await Customer.findOne({ where: { Email: email, AccountStatus: 'ACTIVE' } });

    if (!customer) {
      return res.json(genericSuccess);
    }

    if (customer.IsEmailVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified. Please log in.'
      });
    }

    const issueResult = await issueVerificationEmail(customer, { enforceCooldown: true });

    if (issueResult.skipped) {
      return res.status(429).json({
        success: false,
        code: 'VERIFICATION_EMAIL_COOLDOWN',
        error: 'A verification email was sent recently. Please wait before requesting another.',
        retryAfterSeconds: issueResult.retryAfterSeconds
      });
    }

    return res.json(genericSuccess);
  } catch (error) {
    console.error('Resend email verification error:', error);
    return res.status(500).json({ error: 'Unable to resend verification email' });
  }
};

/**
 * Request password reset - generates OTP
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, userType } = req.body; // userType: 'Customer' or 'Staff'
    const genericMessage = 'If the email exists, an OTP has been sent to your registered contact methods.';

    if (!email || !userType) {
      return res.status(400).json({ error: 'Email and user type are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    let user;
    let userId;

    if (userType === 'Customer') {
      user = await Customer.findOne({ where: { Email: normalizedEmail } });
      userId = user?.CustomerID;
    } else if (userType === 'Staff') {
      user = await Staff.findOne({ where: { Email: normalizedEmail } });
      userId = user?.StaffID;
    }

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtpCode(otpCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in database
    await sequelize.query(
      `INSERT INTO otp_verification (user_type, user_id, otp_hash, purpose, expires_at)
       VALUES (?, ?, ?, 'PASSWORD_RESET', ?)`,
      {
        replacements: [userType.toUpperCase(), userId, otpHash, expiresAt],
        type: sequelize.QueryTypes.INSERT
      }
    );

    const deliveryTasks = [];

    if (user?.Phone) {
      deliveryTasks.push({
        channel: 'SMS',
        task: sendOTPSMS(user.Phone, otpCode, 'PASSWORD_RESET', {
          recipientId: userId,
          recipientType: userType.toUpperCase()
        })
      });
    }

    if (user?.Email) {
      deliveryTasks.push({
        channel: 'EMAIL',
        task: sendOTPEmail(user.Email, otpCode, 'PASSWORD_RESET')
      });
    }

    if (deliveryTasks.length > 0) {
      const deliveryResults = await Promise.allSettled(deliveryTasks.map((entry) => entry.task));
      const successfulChannels = [];
      const skippedChannels = [];
      const failedDeliveries = [];

      deliveryResults.forEach((result, index) => {
        const channel = deliveryTasks[index]?.channel || 'UNKNOWN';

        if (result.status === 'rejected') {
          failedDeliveries.push({
            channel,
            reason: result.reason?.message || result.reason
          });
          return;
        }

        if (isSuccessfulDeliveryResult(result.value)) {
          successfulChannels.push(channel);
          return;
        }

        skippedChannels.push(channel);
      });

      if (failedDeliveries.length > 0) {
        console.error('Password reset OTP delivery had failures:', failedDeliveries);
      }

      if (skippedChannels.length > 0) {
        console.warn('Password reset OTP delivery skipped channels:', skippedChannels);
      }

      if (successfulChannels.length === 0) {
        console.error('Password reset OTP was generated but no delivery channel reported success for:', normalizedEmail);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Password Reset OTP generated for ${email}`);
    }

    return res.json({
      success: true,
      message: genericMessage,
      // For development only - remove in production
      _dev_otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ error: 'Password reset request failed' });
  }
};

/**
 * Verify OTP for password reset
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    if (!email || !otp || !userType) {
      return res.status(400).json({ error: 'Email, OTP, and user type are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpHash = hashOtpCode(otp);

    // Find user
    let user;
    let userId;

    if (userType === 'Customer') {
      user = await Customer.findOne({ where: { Email: normalizedEmail } });
      userId = user?.CustomerID;
    } else if (userType === 'Staff') {
      user = await Staff.findOne({ where: { Email: normalizedEmail } });
      userId = user?.StaffID;
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Verify OTP
    const [otpRecord] = await sequelize.query(
      `SELECT otp_id FROM otp_verification
       WHERE user_type = ? AND user_id = ? AND otp_hash = ?
       AND purpose = 'PASSWORD_RESET' AND is_used = 0
       AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      {
        replacements: [userType.toUpperCase(), userId, otpHash],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Non-breaking persistence: save one-time reset token when password_reset table exists.
    // Older environments without this table continue to work with OTP-only flow.
    try {
      const tokenExpiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

      await sequelize.query(
        `UPDATE password_reset
         SET is_used = 1, used_at = NOW()
         WHERE user_type = ? AND user_id = ? AND is_used = 0`,
        {
          replacements: [userType.toUpperCase(), userId],
          type: sequelize.QueryTypes.UPDATE
        }
      );

      await sequelize.query(
        `INSERT INTO password_reset (user_type, user_id, reset_token, expires_at)
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [userType.toUpperCase(), userId, resetToken, tokenExpiresAt],
          type: sequelize.QueryTypes.INSERT
        }
      );
    } catch (tokenStoreError) {
      if (!isPasswordResetTableMissingError(tokenStoreError)) {
        throw tokenStoreError;
      }
    }

    return res.json({
      success: true,
      resetToken,
      otpId: otpRecord.otp_id,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
};

/**
 * Reset password with OTP
 */
// Frontend connection: Login, Register, VerifyEmail, ForgotPassword, and ResetPassword pages (customer and staff sign-in flows).
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, userType, resetToken } = req.body;

    if (!email || !otp || !newPassword || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpHash = hashOtpCode(otp);

    // Find user
    let user;
    let userId;

    if (userType === 'Customer') {
      user = await Customer.findOne({ where: { Email: normalizedEmail } });
      userId = user?.CustomerID;
    } else if (userType === 'Staff') {
      user = await Staff.findOne({ where: { Email: normalizedEmail } });
      userId = user?.StaffID;
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    let resetRecord = null;
    if (resetToken !== undefined && resetToken !== null && String(resetToken).trim() !== '') {
      const normalizedResetToken = String(resetToken).trim();

      if (!PASSWORD_RESET_TOKEN_PATTERN.test(normalizedResetToken)) {
        return res.status(400).json({ error: 'Invalid reset token format' });
      }

      try {
        [resetRecord] = await sequelize.query(
          `SELECT reset_id
           FROM password_reset
           WHERE user_type = ? AND user_id = ? AND reset_token = ?
             AND is_used = 0
             AND expires_at > NOW()
           ORDER BY created_at DESC
           LIMIT 1`,
          {
            replacements: [userType.toUpperCase(), userId, normalizedResetToken],
            type: sequelize.QueryTypes.SELECT
          }
        );
      } catch (tokenReadError) {
        if (!isPasswordResetTableMissingError(tokenReadError)) {
          throw tokenReadError;
        }
      }

      if (!resetRecord) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
    }

    // Verify OTP
    const [otpRecord] = await sequelize.query(
      `SELECT otp_id FROM otp_verification
       WHERE user_type = ? AND user_id = ? AND otp_hash = ?
       AND purpose = 'PASSWORD_RESET' AND is_used = 0
       AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      {
        replacements: [userType.toUpperCase(), userId, otpHash],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    if (userType === 'Customer') {
      await Customer.update(
        { Password: hashedPassword },
        { where: { CustomerID: userId }, individualHooks: false }
      );
    } else if (userType === 'Staff') {
      await Staff.update(
        { Password: hashedPassword },
        { where: { StaffID: userId }, individualHooks: false }
      );
    }

    // Mark OTP as used
    await sequelize.query(
      `UPDATE otp_verification SET is_used = 1, used_at = NOW() WHERE otp_id = ?`,
      {
        replacements: [otpRecord.otp_id],
        type: sequelize.QueryTypes.UPDATE
      }
    );

    if (resetRecord) {
      await sequelize.query(
        `UPDATE password_reset SET is_used = 1, used_at = NOW() WHERE reset_id = ?`,
        {
          replacements: [resetRecord.reset_id],
          type: sequelize.QueryTypes.UPDATE
        }
      );
    }

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Password reset failed' });
  }
};

module.exports = exports;
