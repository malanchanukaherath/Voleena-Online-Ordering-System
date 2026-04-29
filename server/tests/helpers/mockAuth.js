const state = {
  mode: 'allow',
  user: {
    id: 1,
    type: 'Staff',
    role: 'Admin',
    email: 'admin@orderflow.test'
  },
  token: 'test-token'
};

// Simple: This handles clone user logic.
function cloneUser() {
  return { ...state.user };
}

// Simple: This handles authenticate token logic.
function authenticateToken(req, res, next) {
  if (state.mode === 'unauthorized') {
    return res.status(401).json({ success: false, error: 'Authorization token missing' });
  }

  req.user = cloneUser();
  req.token = state.token;
  return next();
}

// Simple: This handles require role logic.
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

// Simple: This removes or clears the auth state.
function resetAuthState() {
  state.mode = 'allow';
  state.user = {
    id: 1,
    type: 'Staff',
    role: 'Admin',
    email: 'admin@orderflow.test'
  };
  state.token = 'test-token';
}

// Simple: This updates the auth mode.
function setAuthMode(mode) {
  state.mode = mode;
}

// Simple: This updates the auth user.
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



