import backendApi from './backendApi';

// Simple: This handles submit feedback logic.
export const submitFeedback = async (payload) => {
  return backendApi.post('/api/v1/feedback', payload);
};

// Simple: This gets the order feedback.
export const getOrderFeedback = async (orderId) => {
  return backendApi.get('/api/v1/feedback/me', { params: { orderId } });
};

// Simple: This gets the my feedback.
export const getMyFeedback = async () => {
  return backendApi.get('/api/v1/feedback/me');
};

// Simple: This gets the admin feedback.
export const getAdminFeedback = async () => {
  return backendApi.get('/api/v1/admin/feedback');
};

// Simple: This handles respond to feedback logic.
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
