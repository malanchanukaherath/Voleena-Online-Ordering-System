// CODEMAP: FRONTEND_API
// PURPOSE: One place for checkout/order-related frontend API calls.
// SEARCH_HINT: Start here when tracing checkout, preorder, payment, or order tracking requests.
import backendApi from './backendApi';

/**
 * Cart Management APIs
 */

/**
 * Validate cart items against current stock
 */
// Simple: Ask backend if current cart items are valid with latest stock.
export const validateCart = async (items) => {
  return backendApi.post('/api/v1/cart/validate', { items });
};

/**
 * Get cart summary with pricing
 */
// Simple: Get backend-calculated totals for items and order type.
export const getCartSummary = async (items, orderType) => {
  return backendApi.post('/api/v1/cart/summary', { items, orderType });
};

/**
 * Address & Delivery APIs
 */

// Simple: Save a new customer address from checkout/profile flow.
export const createAddress = async (address) => {
  return backendApi.post('/api/v1/customers/me/addresses', address);
};

// Simple: Update customer contact fields used during checkout.
export const updateCheckoutContactProfile = async (profile) => {
  return backendApi.put('/api/v1/customers/me', profile);
};

/**
 * Validate delivery distance for an address
 */
// Simple: Check if delivery location is serviceable and get distance details.
export const validateDeliveryDistance = async (data) => {
  return backendApi.post('/api/v1/delivery/validate-distance', data);
};

/**
 * Calculate delivery fee for a validated distance
 */
// Simple: Ask backend to calculate final delivery fee using distance rules.
export const calculateDeliveryFeeByDistance = async (distanceKm) => {
  return backendApi.post('/api/v1/delivery/calculate-fee', { distanceKm });
};

/**
 * Order Management APIs
 */
//add to cart
// Simple: Place a new order (normal or preorder) from checkout payload.
export const createOrder = async (payload) => {
  return backendApi.post('/api/v1/orders', payload);
};

// Simple: Start payment session for an existing order.
export const initiatePayment = async (orderId, paymentMethod) => {
  return backendApi.post('/api/v1/payments/initiate', { orderId, paymentMethod });
};

// Simple: Confirm card payment after gateway response.
export const confirmCardPayment = async (orderId, paymentIntentId) => {
  return backendApi.post('/api/v1/payments/confirm-card', { orderId, paymentIntentId });
};

// Simple: Get orders list with optional filters (status, preorder, paging).
export const getOrders = async (params = {}) => {
  return backendApi.get('/api/v1/orders', { params });
};

// Simple: Get full details for one order by ID.
export const getOrderById = async (orderId) => {
  return backendApi.get(`/api/v1/orders/${orderId}`);
};

// Simple: Get live delivery location for tracking screen.
export const getDeliveryLocation = async (deliveryId) => {
  return backendApi.get(`/api/v1/delivery/deliveries/${deliveryId}/location`);
};

// Simple: Cancel an order with reason and safe timeout for slow networks.
export const cancelOrder = async (orderId, reason) => {
  return backendApi.delete(`/api/v1/orders/${orderId}`, {
    data: { reason },
    timeout: 30000
  });
};

