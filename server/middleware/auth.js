const jwt = require('jsonwebtoken');

// Authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-based authorization middleware
// Accepts array of allowed roles: ['Customer', 'Admin', 'Cashier', 'Kitchen', 'Delivery']
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - No user context' });
    }

    // For customers, check role directly
    if (req.user.type === 'Customer') {
      if (allowedRoles.includes('Customer')) {
        return next();
      }
      return res.status(403).json({ error: 'Forbidden - Customer access denied' });
    }

    // For staff, check staffRole (Admin, Cashier, Kitchen, Delivery)
    if (req.user.type === 'Staff') {
      const staffRole = req.user.staffRole;

      // Admin has access to everything
      if (staffRole === 'Admin' || allowedRoles.includes(staffRole)) {
        return next();
      }

      return res.status(403).json({
        error: `Forbidden - ${staffRole} role does not have access`
      });
    }

    return res.status(403).json({ error: 'Forbidden - Invalid user type' });
  };
}

// Convenience aliases
const requireAuth = authenticateToken;
const requireCustomer = requireRole('Customer');
const requireAdmin = requireRole('Admin');
const requireCashier = requireRole('Admin', 'Cashier');
const requireKitchen = requireRole('Admin', 'Kitchen');
const requireDelivery = requireRole('Admin', 'Delivery');
const requireStaff = requireRole('Admin', 'Cashier', 'Kitchen', 'Delivery');

module.exports = {
  authenticateToken,
  requireAuth,
  requireRole,
  requireCustomer,
  requireAdmin,
  requireCashier,
  requireKitchen,
  requireDelivery,
  requireStaff
};

