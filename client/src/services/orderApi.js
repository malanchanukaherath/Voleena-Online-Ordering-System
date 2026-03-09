import backendApi from './backendApi';

/**
 * Cart Management APIs
 */

/**
 * Validate cart items against current stock
 */
export const validateCart = async (items) => {
  return backendApi.post('/api/v1/cart/validate', { items });
};

/**
 * Get cart summary with pricing
 */
export const getCartSummary = async (items, orderType) => {
  return backendApi.post('/api/v1/cart/summary', { items, orderType });
};

/**
 * Address & Delivery APIs
 */

export const createAddress = async (address) => {
  return backendApi.post('/api/v1/customers/me/addresses', address);
};

/**
 * Validate delivery distance for an address
 */
export const validateDeliveryDistance = async (data) => {
  return backendApi.post('/api/v1/delivery/validate-distance', data);
};

/**
 * Order Management APIs
 */

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

