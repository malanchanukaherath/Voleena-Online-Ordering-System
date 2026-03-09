const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Customer, Staff, Role, sequelize } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = '30m'; // 30 minutes for session timeout
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Generate JWT Token with 30-minute expiry
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Validate email format
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validate password strength
 */
const isValidPassword = (password) => password && password.length >= 8;

/**
 * Staff Login - Admin, Cashier, Kitchen, Delivery
 */
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
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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
      Password: password,
      AccountStatus: 'ACTIVE',
      IsEmailVerified: false,
      IsPhoneVerified: false,
      IsActive: true,
      PreferredNotification: 'BOTH'
    });

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

    return res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: payload,
      expiresIn: 1800,
      message: 'Registration successful'
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
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // Generate NEW access token with fresh expiry
      const newPayload = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        type: decoded.type,
        roleId: decoded.roleId,
        permissions: decoded.permissions
      };

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
exports.verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, user: decoded });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Request password reset - generates OTP
 */
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, userType } = req.body; // userType: 'Customer' or 'Staff'

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
        message: 'If the email exists, an OTP has been sent'
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in database
    await sequelize.query(
      `INSERT INTO otp_verification (UserType, UserID, OTPCode, Purpose, ExpiresAt) 
       VALUES (?, ?, ?, 'PASSWORD_RESET', ?)`,
      {
        replacements: [userType.toUpperCase(), userId, otpCode, expiresAt],
        type: sequelize.QueryTypes.INSERT
      }
    );

    // TODO: Send OTP via email
    console.log(`Password Reset OTP for ${email}: ${otpCode}`);

    return res.json({
      success: true,
      message: 'OTP sent to your email',
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
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp, userType } = req.body;

    if (!email || !otp || !userType) {
      return res.status(400).json({ error: 'Email, OTP, and user type are required' });
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
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Verify OTP
    const [otpRecord] = await sequelize.query(
      `SELECT * FROM otp_verification 
       WHERE UserType = ? AND UserID = ? AND OTPCode = ? 
       AND Purpose = 'PASSWORD_RESET' AND IsUsed = 0 
       AND ExpiresAt > NOW() 
       ORDER BY CreatedAt DESC LIMIT 1`,
      {
        replacements: [userType.toUpperCase(), userId, otp],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    return res.json({
      success: true,
      resetToken,
      otpId: otpRecord.OTPID,
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
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, userType } = req.body;

    if (!email || !otp || !newPassword || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
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
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Verify OTP
    const [otpRecord] = await sequelize.query(
      `SELECT OTPID FROM otp_verification 
       WHERE UserType = ? AND UserID = ? AND OTPCode = ? 
       AND Purpose = 'PASSWORD_RESET' AND IsUsed = 0 
       AND ExpiresAt > NOW() 
       ORDER BY CreatedAt DESC LIMIT 1`,
      {
        replacements: [userType.toUpperCase(), userId, otp],
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
      `UPDATE otp_verification SET IsUsed = 1, UsedAt = NOW() WHERE OTPID = ?`,
      {
        replacements: [otpRecord.OTPID],
        type: sequelize.QueryTypes.UPDATE
      }
    );

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
