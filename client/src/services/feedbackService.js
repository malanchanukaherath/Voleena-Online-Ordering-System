import backendApi from './backendApi';

// Code Review: Function submitFeedback in client\src\services\feedbackService.js. Used in: client/src/pages/Feedback.jsx, client/src/services/feedbackService.js, server/controllers/feedbackController.js.
export const submitFeedback = async (payload) => {
  return backendApi.post('/api/v1/feedback', payload);
};

// Code Review: Function getOrderFeedback in client\src\services\feedbackService.js. Used in: client/src/services/feedbackService.js.
export const getOrderFeedback = async (orderId) => {
  return backendApi.get('/api/v1/feedback/me', { params: { orderId } });
};

// Code Review: Function getMyFeedback in client\src\services\feedbackService.js. Used in: client/src/services/feedbackService.js, server/controllers/feedbackController.js, server/routes/feedback.js.
export const getMyFeedback = async () => {
  return backendApi.get('/api/v1/feedback/me');
};

// Code Review: Function getAdminFeedback in client\src\services\feedbackService.js. Used in: client/src/pages/FeedbackManagement.jsx, client/src/services/feedbackService.js, server/controllers/feedbackController.js.
export const getAdminFeedback = async () => {
  return backendApi.get('/api/v1/admin/feedback');
};

// Code Review: Function respondToFeedback in client\src\services\feedbackService.js. Used in: client/src/pages/FeedbackManagement.jsx, client/src/services/feedbackService.js, server/controllers/feedbackController.js.
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