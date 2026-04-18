const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireCustomer, requireCashier, requireStaff, requireRole } = require('../middleware/auth');
const { orderLimiter, confirmOrderLimiter } = require('../middleware/rateLimiter');
const { validateOrderCancellation } = require('../middleware/validation');

// Customer routes - create and view own orders
router.post('/', requireCustomer, orderLimiter, orderController.createOrder);
router.get('/', authenticateToken, orderController.getAllOrders); // Role-filtered in controller
router.get('/:id', authenticateToken, orderController.getOrderById); // Role-filtered in controller
router.get('/:id/addons/options', requireCustomer, orderController.getOrderAddOnOptions);
router.patch('/:id/items/:orderItemId/addons', requireCustomer, orderController.updateOrderItemAddOns);

// Staff routes - order management
// CRITICAL: confirmOrderLimiter prevents rapid confirmation attempts that could cause race conditions
router.post('/:id/confirm', requireCashier, confirmOrderLimiter, orderController.confirmOrder);
router.patch('/:id/status', requireStaff, orderController.updateOrderStatus);
// CRITICAL: Validation prevents SQL injection and XSS attacks via cancellation reason
router.delete('/:id', authenticateToken, requireRole('Customer', 'Admin', 'Cashier'), validateOrderCancellation, orderController.cancelOrder); // Role-filtered in controller

module.exports = router;
