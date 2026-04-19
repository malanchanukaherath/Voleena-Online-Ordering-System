import backendApi from './backendApi';

/**
 * Cart Management APIs
 */

/**
 * Validate cart items against current stock
 */
// Simple: This checks if the cart is correct.
export const validateCart = async (items) => {
  return backendApi.post('/api/v1/cart/validate', { items });
};

/**
 * Get cart summary with pricing
 */
// Simple: This gets the cart summary.
export const getCartSummary = async (items, orderType) => {
  return backendApi.post('/api/v1/cart/summary', { items, orderType });
};

/**
 * Address & Delivery APIs
 */

// Simple: This creates the address.
export const createAddress = async (address) => {
  return backendApi.post('/api/v1/customers/me/addresses', address);
};

// Simple: This updates the checkout contact profile.
export const updateCheckoutContactProfile = async (profile) => {
  return backendApi.put('/api/v1/customers/me', profile);
};

/**
 * Validate delivery distance for an address
 */
// Simple: This checks if the delivery distance is correct.
export const validateDeliveryDistance = async (data) => {
  return backendApi.post('/api/v1/delivery/validate-distance', data);
};

/**
 * Calculate delivery fee for a validated distance
 */
// Simple: This calculates the delivery fee by distance.
export const calculateDeliveryFeeByDistance = async (distanceKm) => {
  return backendApi.post('/api/v1/delivery/calculate-fee', { distanceKm });
};

/**
 * Order Management APIs
 */

// Simple: This creates the order.
export const createOrder = async (payload) => {
  return backendApi.post('/api/v1/orders', payload);
};

// Simple: This handles initiate payment logic.
export const initiatePayment = async (orderId, paymentMethod) => {
  return backendApi.post('/api/v1/payments/initiate', { orderId, paymentMethod });
};

// Simple: This handles confirm card payment logic.
export const confirmCardPayment = async (orderId, paymentIntentId) => {
  return backendApi.post('/api/v1/payments/confirm-card', { orderId, paymentIntentId });
};

// Simple: This gets the orders.
export const getOrders = async () => {
  return backendApi.get('/api/v1/orders');
};

// Simple: This gets the order by id.
export const getOrderById = async (orderId) => {
  return backendApi.get(`/api/v1/orders/${orderId}`);
};

// Simple: This gets the delivery location.
export const getDeliveryLocation = async (deliveryId) => {
  return backendApi.get(`/api/v1/delivery/deliveries/${deliveryId}/location`);
};

// Simple: This removes or clears the order.
export const cancelOrder = async (orderId, reason) => {
  return backendApi.delete(`/api/v1/orders/${orderId}`, {
    data: { reason },
    timeout: 30000
  });
};

