import backendApi from './backendApi';

export const createAddress = async (address) => {
  return backendApi.post('/api/v1/customers/me/addresses', address);
};

export const createOrder = async (payload) => {
  return backendApi.post('/api/v1/orders', payload);
};

export const initiatePayment = async (orderId, paymentMethod) => {
  return backendApi.post('/api/v1/payments/initiate', { orderId, paymentMethod });
};

export const getOrders = async () => {
  return backendApi.get('/api/v1/orders');
};

export const getOrderById = async (orderId) => {
  return backendApi.get(`/api/v1/orders/${orderId}`);
};

export const cancelOrder = async (orderId, reason) => {
  return backendApi.delete(`/api/v1/orders/${orderId}`, { data: { reason } });
};
