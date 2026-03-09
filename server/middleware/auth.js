const { verifyAccessToken, isTokenBlacklisted } = require('../utils/jwtUtils');
const { Customer, Staff, Role } = require('../models');

/**
 * Authenticate JWT token and attach user to request
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token missing'
      });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      type: decoded.type, // 'Customer' or 'Staff'
      role: decoded.role, // For staff: 'Admin', 'Cashier', 'Kitchen', 'Delivery'
      email: decoded.email
    };

    req.token = token; // Store token for potential blacklisting

    next();
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

/**
 * Role-based authorization middleware
 * Usage: requireRole('Admin', 'Cashier')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No user context'
      });
    }

    // Customer role check
    if (req.user.type === 'Customer') {
      if (allowedRoles.includes('Customer')) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: 'Forbidden - Customer access denied for this resource'
      });
    }

    // Staff role check
    if (req.user.type === 'Staff') {
      const staffRole = req.user.role;

      // Admin has access to everything
      if (staffRole === 'Admin' || allowedRoles.includes(staffRole)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: `Forbidden - ${staffRole} role does not have access to this resource`
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden - Invalid user type'
    });
  };
}

/**
 * Verify resource ownership for customers
 * Ensures customers can only access their own resources
 */
function verifyOwnership(resourceType) {
  return async (req, res, next) => {
    if (req.user.type !== 'Customer') {
      // Staff can access any resource
      return next();
    }

    const resourceId = req.params.id;

    try {
      let resource;

      switch (resourceType) {
        case 'order': {
          const { Order } = require('../models');
          resource = await Order.findByPk(resourceId);
          if (!resource || resource.CustomerID !== req.user.id) {
            return res.status(403).json({
              success: false,
              error: 'Access denied - You can only access your own orders'
            });
          }
          break;
        }

        case 'customer':
          // Customer can only access their own profile
          if (parseInt(resourceId) !== req.user.id) {
            return res.status(403).json({
              success: false,
              error: 'Access denied - You can only access your own profile'
            });
          }
          break;

        default:
          return res.status(500).json({
            success: false,
            error: 'Invalid resource type for ownership verification'
          });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error verifying resource ownership'
      });
    }
  };
}

/**
 * Convenience middleware exports
 */
const requireAuth = authenticateToken;
const requireCustomer = [authenticateToken, requireRole('Customer')];
const requireAdmin = [authenticateToken, requireRole('Admin')];
const requireCashier = [authenticateToken, requireRole('Admin', 'Cashier')];
const requireKitchen = [authenticateToken, requireRole('Admin', 'Kitchen')];
const requireDelivery = [authenticateToken, requireRole('Admin', 'Delivery')];
const requireStaff = [authenticateToken, requireRole('Admin', 'Cashier', 'Kitchen', 'Delivery')];

module.exports = {
  authenticateToken,
  requireAuth,
  requireRole,
  requireCustomer,
  requireAdmin,
  requireCashier,
  requireKitchen,
  requireDelivery,
  requireStaff,
  verifyOwnership
};
