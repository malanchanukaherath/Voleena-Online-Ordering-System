const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireCustomer, requireCashier, requireStaff } = require('../middleware/auth');

// Customer routes - create and view own orders
router.post('/', authenticateToken, requireCustomer, orderController.createOrder);
router.get('/', authenticateToken, orderController.getAllOrders); // Role-filtered in controller
router.get('/:id', authenticateToken, orderController.getOrderById); // Role-filtered in controller

// Staff routes - order management
router.post('/:id/confirm', authenticateToken, requireCashier, orderController.confirmOrder);
router.patch('/:id/status', authenticateToken, requireStaff, orderController.updateOrderStatus);
router.delete('/:id', authenticateToken, orderController.cancelOrder); // Role-filtered in controller

module.exports = router;
