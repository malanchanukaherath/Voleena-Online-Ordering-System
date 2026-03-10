const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireCustomer, requireCashier, requireStaff } = require('../middleware/auth');
const { orderLimiter, confirmOrderLimiter } = require('../middleware/rateLimiter');
const { validateOrderCancellation } = require('../middleware/validation');

// Customer routes - create and view own orders
router.post('/', authenticateToken, requireCustomer, orderLimiter, orderController.createOrder);
router.get('/', authenticateToken, orderController.getAllOrders); // Role-filtered in controller
router.get('/:id', authenticateToken, orderController.getOrderById); // Role-filtered in controller

// Staff routes - order management
// CRITICAL: confirmOrderLimiter prevents rapid confirmation attempts that could cause race conditions
router.post('/:id/confirm', authenticateToken, requireCashier, confirmOrderLimiter, orderController.confirmOrder);
router.patch('/:id/status', authenticateToken, requireStaff, orderController.updateOrderStatus);
// CRITICAL: Validation prevents SQL injection and XSS attacks via cancellation reason
router.delete('/:id', authenticateToken, validateOrderCancellation, orderController.cancelOrder); // Role-filtered in controller

module.exports = router;
