import backendApi from './backendApi';

export const submitFeedback = async (payload) => {
  return backendApi.post('/api/v1/feedback', payload);
};

export const getOrderFeedback = async (orderId) => {
  return backendApi.get('/api/v1/feedback/me', { params: { orderId } });
};

export const getMyFeedback = async () => {
  return backendApi.get('/api/v1/feedback/me');
};

export const getAdminFeedback = async () => {
  return backendApi.get('/api/v1/admin/feedback');
};

export const respondToFeedback = async (feedbackId, response) => {
  return backendApi.patch(`/api/v1/admin/feedback/${feedbackId}/respond`, { response });
};

export default {
  submitFeedback,
  getOrderFeedback,
  getMyFeedback,
  getAdminFeedback,
  respondToFeedback
};