import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance for backend API
const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        // Unauthorized - clear auth data and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints only
export const realApi = {
  /**
   * Login user
   */
  login: async (email, password, userType = 'staff') => {
    const endpoint = userType === 'customer' ? '/api/v1/auth/customer/login' : '/api/v1/auth/staff/login';
    return await backendApi.post(endpoint, { email, password });
  },

  /**
   * Register new customer
   */
  register: async (userData) => {
    return await backendApi.post('/api/v1/auth/register', userData);
  },

  /**
   * Verify JWT token
   */
  verifyToken: async () => {
    return await backendApi.get('/api/v1/auth/verify');
  },
};

export default backendApi;
