import { realApi } from './backendApi';

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await realApi.register(userData);
      const { user, token } = response.data;
      console.log('Client Received Token (Register):', token); // SHOW TOKEN IN CONSOLE

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed'
      };
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await realApi.login(credentials.email, credentials.password);
      const { user, token } = response.data;
      console.log('Client Received Token (Login):', token); // SHOW TOKEN IN CONSOLE

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Login failed'
      };
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
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

