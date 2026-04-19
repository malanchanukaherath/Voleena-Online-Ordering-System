import axios from 'axios';
import { API_BASE_URL as API_ROOT_URL, API_V1_BASE_URL } from '../config/api';

const API_BASE_URL = API_V1_BASE_URL;

// Code Review: Function getAuthHeader in client\src\services\menuService.js. Used in: client/src/services/menuService.js.
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const menuItemService = {
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/menu`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/menu/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getAddOnConfig: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/menu/${id}/addons-config`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getAddOnCatalog: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/menu/addons/catalog`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    createAddOnCatalogItem: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/menu/addons/catalog`, payload, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateAddOnCatalogItem: async (id, payload) => {
        const response = await axios.put(`${API_BASE_URL}/menu/addons/catalog/${id}`, payload, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    deleteAddOnCatalogItem: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/menu/addons/catalog/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateAddOnConfig: async (id, addOnIds) => {
        const response = await axios.put(`${API_BASE_URL}/menu/${id}/addons-config`, {
            addOnIds
        }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/menu`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/menu/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/menu/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    uploadImage: async (id, file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_BASE_URL}/menu/${id}/image`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const comboPackService = {
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/combos`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    getActive: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/combos/active`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/combos/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/combos`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/combos/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/combos/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    uploadImage: async (id, file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_BASE_URL}/combos/${id}/image`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const categoryService = {
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/categories`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/categories`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/categories/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/categories/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export const imageUploadService = {
    uploadImage: async (file, folder = 'menu') => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', folder);

        const response = await axios.post(`${API_ROOT_URL}/api/upload/image`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }
};
