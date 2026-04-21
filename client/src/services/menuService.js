// CODEMAP: FRONTEND_SERVICES_MENUSERVICE_JS
// WHAT_THIS_IS: This file supports frontend behavior for menuService.js.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: services/menuService.js
// - Search text: menuService.js
import axios from 'axios';
import { API_BASE_URL as API_ROOT_URL, API_V1_BASE_URL } from '../config/api';

const API_BASE_URL = API_V1_BASE_URL;

// Simple: This gets the auth header.
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const menuItemService = {
    // This gets a list of records from the backend.
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/menu`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // This gets one record from the backend by its ID.
    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/menu/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This gets the add-on choices saved for one menu item.
    getAddOnConfig: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/menu/${id}/addons-config`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This gets the full list of add-ons that can be used.
    getAddOnCatalog: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/menu/addons/catalog`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // This creates a new add-on option.
    createAddOnCatalogItem: async (payload) => {
        const response = await axios.post(`${API_BASE_URL}/menu/addons/catalog`, payload, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This updates one add-on option.
    updateAddOnCatalogItem: async (id, payload) => {
        const response = await axios.put(`${API_BASE_URL}/menu/addons/catalog/${id}`, payload, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This removes one add-on option.
    deleteAddOnCatalogItem: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/menu/addons/catalog/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This saves which add-ons belong to a menu item.
    updateAddOnConfig: async (id, addOnIds) => {
        const response = await axios.put(`${API_BASE_URL}/menu/${id}/addons-config`, {
            addOnIds
        }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This creates a new record in the backend.
    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/menu`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This updates an existing record in the backend.
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

    // This uploads an image for this record.
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
    // This gets a list of records from the backend.
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/combos`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // This gets only the records that are active right now.
    getActive: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/combos/active`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // This gets one record from the backend by its ID.
    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/combos/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This creates a new record in the backend.
    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/combos`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This updates an existing record in the backend.
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

    // This uploads an image for this record.
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
    // This gets a list of records from the backend.
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/categories`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // This creates a new record in the backend.
    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/categories`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // This updates an existing record in the backend.
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
    // This uploads an image for this record.
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

