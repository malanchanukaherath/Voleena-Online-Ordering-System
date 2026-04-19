const state = {
  mode: 'allow',
  user: {
    id: 1,
    type: 'Staff',
    role: 'Admin',
    email: 'admin@voleena.test'
  },
  token: 'test-token'
};

// Code Review: Function cloneUser in server\tests\helpers\mockAuth.js. Used in: server/tests/helpers/mockAuth.js.
function cloneUser() {
  return { ...state.user };
}

// Code Review: Function authenticateToken in server\tests\helpers\mockAuth.js. Used in: server/middleware/auth.js, server/routes/authRoutes.js, server/routes/orders.js.
function authenticateToken(req, res, next) {
  if (state.mode === 'unauthorized') {
    return res.status(401).json({ success: false, error: 'Authorization token missing' });
  }

  req.user = cloneUser();
  req.token = state.token;
  return next();
}

// Code Review: Function requireRole in server\tests\helpers\mockAuth.js. Used in: server/middleware/auth.js, server/routes/categories.js, server/routes/comboPacks.js.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized - No user context' });
    }

    if (state.mode === 'forbidden') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (req.user.type === 'Customer') {
      if (allowedRoles.includes('Customer')) {
        return next();
      }
      return res.status(403).json({ success: false, error: 'Forbidden - Customer access denied for this resource' });
    }

    if (req.user.type === 'Staff') {
      if (req.user.role === 'Admin' || allowedRoles.includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ success: false, error: `Forbidden - ${req.user.role} role does not have access to this resource` });
    }

    return res.status(403).json({ success: false, error: 'Forbidden - Invalid user type' });
  };
}

// Code Review: Function resetAuthState in server\tests\helpers\mockAuth.js. Used in: server/tests/cashier.routes.test.js, server/tests/categories.routes.test.js, server/tests/customers.routes.test.js.
function resetAuthState() {
  state.mode = 'allow';
  state.user = {
    id: 1,
    type: 'Staff',
    role: 'Admin',
    email: 'admin@voleena.test'
  };
  state.token = 'test-token';
}

// Code Review: Function setAuthMode in server\tests\helpers\mockAuth.js. Used in: server/tests/cashier.routes.test.js, server/tests/categories.routes.test.js, server/tests/customers.routes.test.js.
function setAuthMode(mode) {
  state.mode = mode;
}

// Code Review: Function setAuthUser in server\tests\helpers\mockAuth.js. Used in: server/tests/cashier.routes.test.js, server/tests/categories.routes.test.js, server/tests/customers.routes.test.js.
function setAuthUser(user) {
  state.user = { ...state.user, ...user };
}

module.exports = {
  state,
  resetAuthState,
  setAuthMode,
  setAuthUser,
  authenticateToken,
  requireAuth: authenticateToken,
  requireRole,
  requireCustomer: [authenticateToken, requireRole('Customer')],
  requireAdmin: [authenticateToken, requireRole('Admin')],
  requireCashier: [authenticateToken, requireRole('Admin', 'Cashier')],
  requireKitchen: [authenticateToken, requireRole('Admin', 'Kitchen')],
  requireDelivery: [authenticateToken, requireRole('Admin', 'Delivery')],
  requireStaff: [authenticateToken, requireRole('Admin', 'Cashier', 'Kitchen', 'Delivery')]
};