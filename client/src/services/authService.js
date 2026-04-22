// CODEMAP: FRONTEND_SERVICES_AUTHSERVICE_JS
// WHAT_THIS_IS: This file supports frontend behavior for authService.js.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: services/authService.js
// - Search text: authService.js
import { realApi } from './backendApi';
import { API_BASE_URL } from '../config/api';

// This keeps login and account actions in one place.
class AuthService {
  // This reads when the login token will expire.
  getTokenExpiry() {
    const raw = localStorage.getItem('tokenExpiry');
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // This checks whether the login token is already expired.
  isTokenExpired() {
    const expiry = this.getTokenExpiry();
    if (!expiry) {
      return false;
    }
    return Date.now() > expiry;
  }

  // This saves when the login token will expire.
  setTokenExpiry(expiresInSeconds) {
    const parsed = Number(expiresInSeconds);
    const expiresMs = Number.isFinite(parsed)
      ? parsed * 1000
      : 30 * 60 * 1000;
    localStorage.setItem('tokenExpiry', Date.now() + expiresMs);
  }

  // Staff Login (Admin, Cashier, Kitchen, Delivery)
  async staffLogin(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const authError = new Error(data.error || 'Login failed');
        authError.code = data.code;
        throw authError;
      }

      const { user, token } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      this.setTokenExpiry(data.expiresIn);

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed',
        code: error.code
      };
    }
  }

  // Customer Login
  async customerLogin(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const authError = new Error(data.error || 'Login failed');
        authError.code = data.code;
        throw authError;
      }

      const { user, token } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      this.setTokenExpiry(data.expiresIn);

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed',
        code: error.code
      };
    }
  }
  //Register Customer
  // Register new customer
  async register(userData) {
    try {
      const response = await realApi.register(userData);

      return {
        success: true,
        requiresEmailVerification: !!response.data?.requiresEmailVerification,
        emailSent: response.data?.emailSent !== false,
        message: response.data?.message || 'Registration successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed'
      };
    }
  }
  //Login Customer
  // Login user (legacy - determines user type automatically)
  async login(credentials) {
    const { email, password, userType } = credentials;

    // Require email and password - don't attempt login without credentials
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    // If userType specified, use specific login
    if (userType === 'staff') {
      return this.staffLogin(email, password);
    } else if (userType === 'customer') {
      return this.customerLogin(email, password);
    }

    // Otherwise, try customer first (default public login), then staff
    const customerResult = await this.customerLogin(email, password);
    if (customerResult.success) {
      return customerResult;
    }

    // Preserve customer-specific verification feedback instead of masking it
    if (customerResult.code === 'EMAIL_NOT_VERIFIED') {
      return customerResult;
    }

    return this.staffLogin(email, password);
  }

  // Refresh token
  async refreshToken() {
    try {
      const token = this.getToken();
      const refreshToken = localStorage.getItem('refreshToken');
      if (!token) {
        throw new Error('No token available');
      }
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Refresh-Token': refreshToken
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      const { user, token: newToken, refreshToken: newRefreshToken } = data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(user));
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      this.setTokenExpiry(data.expiresIn);

      return { success: true, user, token: newToken };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token refresh failed'
      };
    }
  }

  // Request password reset
  async requestPasswordReset(email, userType = 'Customer') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed');
      }

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Password reset request failed'
      };
    }
  }

  // Verify customer email token
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        const verifyError = new Error(data.error || 'Email verification failed');
        verifyError.code = data.code;
        throw verifyError;
      }

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Email verification failed',
        code: error.code
      };
    }
  }

  // Resend customer verification email
  async resendVerificationEmail(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/email-verification/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        const resendError = new Error(data.error || 'Failed to resend verification email');
        resendError.code = data.code;
        resendError.retryAfterSeconds = data.retryAfterSeconds;
        throw resendError;
      }

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to resend verification email',
        code: error.code,
        retryAfterSeconds: error.retryAfterSeconds
      };
    }
  }

  // Verify OTP
  async verifyResetOTP(email, otp, userType = 'Customer') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/password-reset/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, userType })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'OTP verification failed'
      };
    }
  }

  // Reset password
  async resetPassword(email, otp, newPassword, userType = 'Customer') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword, userType })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }

  // Logout user
  logout() {
    const token = localStorage.getItem('token');

    if (token) {
      fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch((err) => {
        // Local logout should still succeed if the API is unavailable.
        // Log for debugging purposes (no sensitive data exposed).
        console.warn('Logout API call failed, proceeding with local logout:', err?.message || 'Network error');
      });
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('refreshToken');
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get token from localStorage
  getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    if (this.isTokenExpired()) {
      this.logout();
      return null;
    }
    return token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Check if user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'Admin' || user?.role === 'admin';
  }

  // Check if user has specific role
  hasRole(roles) {
    const user = this.getCurrentUser();
    if (!user || !roles) return false;
    return roles.includes(user.role);
  }
}

export default new AuthService();


