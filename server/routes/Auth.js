// CODEMAP: BACKEND_ROUTE_AUTH
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Customer, Staff, Role } = require('../models');

// Helper: Validate email format
// Simple: This checks whether valid email is true.
// Frontend connection: Frontend pages call these API endpoints for this feature flow.
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Helper: Validate password strength
// Simple: This checks whether valid password is true.
// Frontend connection: Frontend pages call these API endpoints for this feature flow.
const isValidPassword = (password) => {
  return password && password.length >= 8;
};

// Simple: This gets the jwt secret.
// Frontend connection: Frontend pages call these API endpoints for this feature flow.
const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

/**
 * POST /auth/login
 * Authenticate user (Customer or Staff) and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Try customer first - check AccountStatus instead of IsActive
    const customer = await Customer.findOne({
      where: { Email: normalizedEmail, AccountStatus: 'ACTIVE' }
    });

    if (customer) {
      // ONLY use bcrypt comparison - NO plaintext fallback
      const passwordMatches = await bcrypt.compare(password, customer.Password);

      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload = {
        id: customer.CustomerID,
        name: customer.Name,
        email: customer.Email,
        role: 'Customer',
        type: 'Customer',
      };

      const token = jwt.sign(
        payload,
        getJwtSecret(),
        { expiresIn: '24h' }
      );

      return res.json({ token, user: payload });
    }

    // Try staff with role information
    const staff = await Staff.findOne({
      where: { Email: normalizedEmail, IsActive: true },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['RoleID', 'RoleName']
      }]
    });

    if (!staff) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ONLY use bcrypt comparison - NO plaintext fallback
    const staffPasswordMatches = await bcrypt.compare(password, staff.Password);

    if (!staffPasswordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const roleName = staff.role ? staff.role.RoleName : 'Staff';

    const payload = {
      id: staff.StaffID,
      name: staff.Name,
      email: staff.Email,
      role: roleName === 'Admin' ? 'Admin' : 'Staff',
      staffRole: roleName,
      roleId: staff.RoleID,
      type: 'Staff',
    };

    const token = jwt.sign(
      payload,
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    return res.json({ token, user: payload });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /auth/register
 * Register new customer account
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email exists in either table
    const existingCustomer = await Customer.findOne({ where: { Email: normalizedEmail } });
    const existingStaff = await Staff.findOne({ where: { Email: normalizedEmail } });

    if (existingCustomer || existingStaff) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Validate phone number
    if (!/^[+]?[0-9]{9,15}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Create customer
    const customer = await Customer.create({
      Name: name.trim(),
      Email: normalizedEmail,
      Phone: phone.trim(),
      Password: password
    });

    const payload = {
      id: customer.CustomerID,
      name: customer.Name,
      email: customer.Email,
      role: 'Customer',
      type: 'Customer',
    };

    const token = jwt.sign(
      payload,
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    return res.status(201).json({ token, user: payload });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: error.errors.map(e => e.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already registered' });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /auth/me
 * Verify JWT token and return user data
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return res.json({ user: decoded });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
