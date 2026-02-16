import axios from 'axios';

// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
      // Unauthorized - clear auth data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints only
export const realApi = {
  /**
   * Login user
   */
  login: async (email, password) => {
    return await backendApi.post('/api/auth/login', { email, password });
  },

  /**
   * Register new customer
   */
  register: async (userData) => {
    return await backendApi.post('/api/auth/register', userData);
  },

  /**
   * Verify JWT token
   */
  verifyToken: async () => {
    return await backendApi.get('/api/auth/verify');
  },
};

export default backendApi;
