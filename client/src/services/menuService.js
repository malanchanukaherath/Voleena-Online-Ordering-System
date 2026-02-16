import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const menuItemService = {
    getAll: async (params = {}) => {
        const response = await axios.get(`${API_BASE_URL}/menu-items`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/menu-items/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/menu-items`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/menu-items/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/menu-items/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    uploadImage: async (id, file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_BASE_URL}/menu-items/${id}/image`, formData, {
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
        const response = await axios.get(`${API_BASE_URL}/combo-packs`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    getActive: async () => {
        const response = await axios.get(`${API_BASE_URL}/combo-packs/active`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getById: async (id) => {
        const response = await axios.get(`${API_BASE_URL}/combo-packs/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(`${API_BASE_URL}/combo-packs`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_BASE_URL}/combo-packs/${id}`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/combo-packs/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    uploadImage: async (id, file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_BASE_URL}/combo-packs/${id}/image`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const categoryService = {
    getAll: async () => {
        const response = await axios.get(`${API_BASE_URL}/categories`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};
