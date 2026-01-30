import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

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

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = () => {
      const user = authService.getCurrentUser();
      const token = authService.getToken();
      const isAuthenticated = authService.isAuthenticated();

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
      return { success: false, error: result.error };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    const result = await authService.register(userData);

    if (result.success) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user: result.user, token: result.token }
      });
      return { success: true };
    } else {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: result.error
      });
      return { success: false, error: result.error };
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

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
    return state.user?.role === 'admin';
  };

  // Check if user has a role in allowedRoles array
  const hasRole = (roles) => {
    if (!Array.isArray(roles) || !roles.length) return false;
    const role = state.user?.role || null;
    return !!role && roles.includes(role);
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    isAdmin,
    hasRole,
    updateUser
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
