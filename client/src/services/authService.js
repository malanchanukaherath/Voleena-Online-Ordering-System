import { realApi } from './backendApi';
import { API_BASE_URL } from '../config/api';

class AuthService {
  getTokenExpiry() {
    const raw = localStorage.getItem('tokenExpiry');
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  isTokenExpired() {
    const expiry = this.getTokenExpiry();
    if (!expiry) {
      return false;
    }
    return Date.now() > expiry;
  }

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
      const response = await fetch(`${API_BASE_URL}/api/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
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
        error: error.message || 'Login failed'
      };
    }
  }

  // Customer Login
  async customerLogin(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
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
        error: error.message || 'Login failed'
      };
    }
  }

  // Register new customer
  async register(userData) {
    try {
      const response = await realApi.register(userData);
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (response.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      this.setTokenExpiry(response.data?.expiresIn);

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed'
      };
    }
  }

  // Login user (legacy - determines user type automatically)
  async login(credentials) {
    const { email, password, userType } = credentials;

    // If userType specified, use specific login
    if (userType === 'staff') {
      return this.staffLogin(email, password);
    } else if (userType === 'customer') {
      return this.customerLogin(email, password);
    }

    // Otherwise, try staff first, then customer
    const staffResult = await this.staffLogin(email, password);
    if (staffResult.success) {
      return staffResult;
    }

    return this.customerLogin(email, password);
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

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/password-reset/request`, {
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

  // Verify OTP
  async verifyResetOTP(email, otp, userType = 'Customer') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password-reset/verify-otp`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/password-reset/reset`, {
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

