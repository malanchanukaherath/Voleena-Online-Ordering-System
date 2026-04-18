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

export const updateCheckoutContactProfile = async (profile) => {
  return backendApi.put('/api/v1/customers/me', profile);
};

/**
 * Validate delivery distance for an address
 */
export const validateDeliveryDistance = async (data) => {
  return backendApi.post('/api/v1/delivery/validate-distance', data);
};

/**
 * Calculate delivery fee for a validated distance
 */
export const calculateDeliveryFeeByDistance = async (distanceKm) => {
  return backendApi.post('/api/v1/delivery/calculate-fee', { distanceKm });
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

export const confirmCardPayment = async (orderId, paymentIntentId) => {
  return backendApi.post('/api/v1/payments/confirm-card', { orderId, paymentIntentId });
};

export const getOrders = async () => {
  return backendApi.get('/api/v1/orders');
};

export const getOrderById = async (orderId) => {
  return backendApi.get(`/api/v1/orders/${orderId}`);
};

export const getOrderAddOnOptions = async (orderId) => {
  return backendApi.get(`/api/v1/orders/${orderId}/addons/options`);
};

export const updateOrderItemAddOns = async (orderId, orderItemId, addOns) => {
  return backendApi.patch(`/api/v1/orders/${orderId}/items/${orderItemId}/addons`, { addOns });
};

export const getDeliveryLocation = async (deliveryId) => {
  return backendApi.get(`/api/v1/delivery/deliveries/${deliveryId}/location`);
};

export const cancelOrder = async (orderId, reason) => {
  return backendApi.delete(`/api/v1/orders/${orderId}`, {
    data: { reason },
    timeout: 30000
  });
};

