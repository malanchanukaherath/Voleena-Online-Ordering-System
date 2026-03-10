import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

// Session timeout duration (30 minutes in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000;
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000; // Refresh token every 25 minutes

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_COMPLETE: 'REGISTER_COMPLETE',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  INIT_AUTH: 'INIT_AUTH'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.REGISTER_COMPLETE:
      return {
        ...state,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.INIT_AUTH:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionTimeoutRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset session timeout
  const resetSessionTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    if (state.isAuthenticated) {
      sessionTimeoutRef.current = setTimeout(() => {
        console.log('Session timeout - logging out');
        logout();
        alert('Your session has expired due to inactivity. Please login again.');
      }, SESSION_TIMEOUT);
    }
  }, [state.isAuthenticated]);

  // Refresh token periodically
  const startTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (state.isAuthenticated) {
      refreshIntervalRef.current = setInterval(async () => {
        try {
          const result = await authService.refreshToken();
          if (result.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: result.user, token: result.token }
            });
          } else {
            console.error('Token refresh failed:', result.error);
            logout();
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          logout();
        }
      }, TOKEN_REFRESH_INTERVAL);
    }
  }, [state.isAuthenticated]);

  // Track user activity
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 60000) { // Only reset if > 1 minute since last activity
        resetSessionTimeout();
      }
    };

    if (state.isAuthenticated) {
      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      resetSessionTimeout();
      startTokenRefresh();
    }

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [state.isAuthenticated, resetSessionTimeout, startTokenRefresh]);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = () => {
      const token = authService.getToken();
      const user = token ? authService.getCurrentUser() : null;
      const isAuthenticated = !!(token && user);

      dispatch({
        type: AUTH_ACTIONS.INIT_AUTH,
        payload: { user, token, isAuthenticated }
      });
    };

    initAuth();
  }, []);

  // Listen for storage changes (e.g., profile updates from other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        const user = authService.getCurrentUser();
        const token = authService.getToken();
        dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user, token, isAuthenticated: !!user } });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    const result = await authService.login(credentials);

    if (result.success) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: result.user, token: result.token }
      });
      return { success: true };
    } else {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error, code: result.code };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    const result = await authService.register(userData);

    if (result.success) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_COMPLETE
      });
      return result;
    } else {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  };

  // Logout function
  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
  }, []);

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Update user in context and localStorage
  const updateUser = (updates) => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const merged = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(merged));
    dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: { user: merged, token: state.token, isAuthenticated: true } });
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'Admin' || state.user?.staffRole === 'Admin';
  };

  // Check if user has a specific role
  const hasRole = (roles) => {
    if (!Array.isArray(roles) || !roles.length) return false;
    const userRole = state.user?.role || state.user?.staffRole || null;
    return !!userRole && roles.includes(userRole);
  };

  // Get user role
  const getUserRole = () => {
    return state.user?.role || state.user?.staffRole || null;
  };

  // Check if user is staff
  const isStaff = () => {
    return state.user?.type === 'Staff';
  };

  // Check if user is customer
  const isCustomer = () => {
    return state.user?.type === 'Customer';
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    isAdmin,
    hasRole,
    getUserRole,
    isStaff,
    isCustomer,
    updateUser,
    resetSessionTimeout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
