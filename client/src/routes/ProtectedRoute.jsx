// CODEMAP: FRONTEND_ROUTES_PROTECTEDROUTE_JSX
// WHAT_THIS_IS: This file supports frontend behavior for ProtectedRoute.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: routes/ProtectedRoute.jsx
// - Search text: ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Simple: This shows the protected route section.
const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles = null }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    // Set a small flag to show a friendly message on next page (lightweight)
    try {
      localStorage.setItem('voleena_message', JSON.stringify({ type: 'info', text: 'Admin access required' }));
    } catch {
      // Non-blocking fallback when localStorage is unavailable.
    }
    return <Navigate to="/" replace />;
  }

  // allowedRoles takes precedence if provided (array of roles)
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = user?.role || null;
    if (!role || !allowedRoles.includes(role)) {
      try {
        localStorage.setItem('voleena_message', JSON.stringify({ type: 'info', text: 'You do not have permission to view that page' }));
      } catch {
        // Non-blocking fallback when localStorage is unavailable.
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

