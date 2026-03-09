import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected Route Component
 * Restricts access based on authentication and role
 */
const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && user) {
    const userRole = user.role || user.staffRole;
    
    // Admin has access to everything
    if (userRole === 'Admin') {
      return <>{children}</>;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      const redirectPath = getRoleBasedRedirect(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Get redirect path based on user role
 */
const getRoleBasedRedirect = (role) => {
  const roleRedirects = {
    'Admin': '/admin/dashboard',
    'Cashier': '/cashier/dashboard',
    'Kitchen': '/kitchen/dashboard',
    'Delivery': '/delivery/dashboard',
    'Customer': '/menu'
  };

  return roleRedirects[role] || '/';
};

/**
 * Redirect authenticated users away from auth pages
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const userRole = user.role || user.staffRole;
    const redirectPath = getRoleBasedRedirect(userRole);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
