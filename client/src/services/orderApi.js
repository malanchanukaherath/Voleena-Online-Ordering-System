import backendApi from './backendApi';

/**
 * Cart Management APIs
 */

/**
 * Validate cart items against current stock
 */
// Code Review: Function validateCart in client\src\services\orderApi.js. Used in: client/src/services/orderApi.js, server/controllers/cartController.js, server/routes/cart.js.
export const validateCart = async (items) => {
  return backendApi.post('/api/v1/cart/validate', { items });
};

/**
 * Get cart summary with pricing
 */
// Code Review: Function getCartSummary in client\src\services\orderApi.js. Used in: client/src/services/orderApi.js, client/src/utils/cartStorage.js, server/controllers/cartController.js.
export const getCartSummary = async (items, orderType) => {
  return backendApi.post('/api/v1/cart/summary', { items, orderType });
};

/**
 * Address & Delivery APIs
 */

// Code Review: Function createAddress in client\src\services\orderApi.js. Used in: client/src/services/orderApi.js.
export const createAddress = async (address) => {
  return backendApi.post('/api/v1/customers/me/addresses', address);
};

// Code Review: Function updateCheckoutContactProfile in client\src\services\orderApi.js. Used in: client/src/services/orderApi.js.
export const updateCheckoutContactProfile = async (profile) => {
  return backendApi.put('/api/v1/customers/me', profile);
};

/**
 * Validate delivery distance for an address
 */
// Code Review: Function validateDeliveryDistance in client\src\services\orderApi.js. Used in: client/src/pages/Checkout.jsx, client/src/services/orderApi.js, server/controllers/deliveryController.js.
export const validateDeliveryDistance = async (data) => {
  return backendApi.post('/api/v1/delivery/validate-distance', data);
};

/**
 * Calculate delivery fee for a validated distance
 */
// Code Review: Function calculateDeliveryFeeByDistance in client\src\services\orderApi.js. Used in: client/src/pages/Checkout.jsx, client/src/services/orderApi.js.
export const calculateDeliveryFeeByDistance = async (distanceKm) => {
  return backendApi.post('/api/v1/delivery/calculate-fee', { distanceKm });
};

/**
 * Order Management APIs
 */

// Code Review: Function createOrder in client\src\services\orderApi.js. Used in: client/src/pages/Checkout.jsx, client/src/services/orderApi.js, server/controllers/cashierController.js.
export const createOrder = async (payload) => {
  return backendApi.post('/api/v1/orders', payload);
};

// Code Review: Function initiatePayment in client\src\services\orderApi.js. Used in: client/src/pages/Checkout.jsx, client/src/services/orderApi.js, server/controllers/paymentController.js.
export const initiatePayment = async (orderId, paymentMethod) => {
  return backendApi.post('/api/v1/payments/initiate', { orderId, paymentMethod });
};

// Code Review: Function confirmCardPayment in client\src\services\orderApi.js. Used in: client/src/components/payment/StripePaymentModal.jsx, client/src/pages/Checkout.jsx, client/src/services/orderApi.js.
export const confirmCardPayment = async (orderId, paymentIntentId) => {
  return backendApi.post('/api/v1/payments/confirm-card', { orderId, paymentIntentId });
};

// Code Review: Function getOrders in client\src\services\orderApi.js. Used in: client/src/pages/AdminDashboard.jsx, client/src/pages/OrderHistory.jsx, client/src/pages/OrderManagement.jsx.
export const getOrders = async () => {
  return backendApi.get('/api/v1/orders');
};

// Code Review: Function getOrderById in client\src\services\orderApi.js. Used in: client/src/pages/Feedback.jsx, client/src/pages/OrderConfirmation.jsx, client/src/pages/OrderTracking.jsx.
export const getOrderById = async (orderId) => {
  return backendApi.get(`/api/v1/orders/${orderId}`);
};

// Code Review: Function getDeliveryLocation in client\src\services\orderApi.js. Used in: client/src/pages/OrderTracking.jsx, client/src/services/dashboardService.js, client/src/services/orderApi.js.
export const getDeliveryLocation = async (deliveryId) => {
  return backendApi.get(`/api/v1/delivery/deliveries/${deliveryId}/location`);
};

// Code Review: Function cancelOrder in client\src\services\orderApi.js. Used in: client/src/pages/OrderTracking.jsx, client/src/services/dashboardService.js, client/src/services/orderApi.js.
export const cancelOrder = async (orderId, reason) => {
  return backendApi.delete(`/api/v1/orders/${orderId}`, {
    data: { reason },
    timeout: 30000
  });
};

