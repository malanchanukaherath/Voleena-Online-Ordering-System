import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance with auth token
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
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

// Staff Management API
export const staffApi = {
    // Get all staff
    getAll: async () => {
        const response = await api.get('/api/staff');
        return response.data;
    },

    // Create new staff
    create: async (staffData) => {
        const response = await api.post('/api/staff', staffData);
        return response.data;
    },

    // Update staff status
    updateStatus: async (staffId, isActive) => {
        const response = await api.patch(`/api/staff/${staffId}`, { isActive });
        return response.data;
    },

    // Get roles
    getRoles: async () => {
        const response = await api.get('/api/staff/roles');
        return response.data;
    },
};

// Customer Management API
export const customerApi = {
    // Get all customers
    getAll: async (params = {}) => {
        const response = await api.get('/api/customers', { params });
        return response.data;
    },

    // Get customer by ID
    getById: async (customerId) => {
        const response = await api.get(`/api/customers/${customerId}`);
        return response.data;
    },

    // Create new customer (staff registration)
    create: async (customerData) => {
        const response = await api.post('/api/customers', customerData);
        return response.data;
    },

    // Update customer
    update: async (customerId, customerData) => {
        const response = await api.put(`/api/customers/${customerId}`, customerData);
        return response.data;
    },
};

export default api;
