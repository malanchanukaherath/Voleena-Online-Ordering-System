import backendApi from './backendApi';

export const createPreorderRequest = async (payload) => {
  return backendApi.post('/api/v1/preorder-requests', payload);
};

export const getPreorderRequests = async (params = {}) => {
  return backendApi.get('/api/v1/preorder-requests', { params });
};

export const getPreorderRequestById = async (requestId) => {
  return backendApi.get(`/api/v1/preorder-requests/${requestId}`);
};

export const updatePreorderRequestStatus = async (requestId, payload) => {
  return backendApi.patch(`/api/v1/preorder-requests/${requestId}/status`, payload);
};
