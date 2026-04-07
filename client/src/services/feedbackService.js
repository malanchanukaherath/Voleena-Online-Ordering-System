import backendApi from './backendApi';

export const submitFeedback = async (payload) => {
  return backendApi.post('/api/v1/feedback', payload);
};

export const getMyFeedback = async () => {
  return backendApi.get('/api/v1/feedback/me');
};

export const getAdminFeedback = async (params = {}) => {
  return backendApi.get('/api/v1/feedback/admin', { params });
};

export const respondToFeedback = async (feedbackId, response) => {
  return backendApi.patch(`/api/v1/feedback/${feedbackId}/respond`, { response });
};

export default {
  submitFeedback,
  getMyFeedback,
  getAdminFeedback,
  respondToFeedback
};