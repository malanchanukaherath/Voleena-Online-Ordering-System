const express = require('express');
const router = express.Router();
const cashierController = require('../controllers/cashierController');
const { requireAuth, requireCashier } = require('../middleware/auth');

// All routes require authentication and cashier role (or admin)
router.use(requireAuth, requireCashier);

/**
 * Dashboard
 */
router.get('/dashboard/stats', cashierController.getDashboardStats);

/**
 * Orders Management
 */
router.get('/orders', cashierController.getAllOrders);
router.put('/orders/:orderId/confirm', cashierController.confirmOrder);
router.put('/orders/:orderId/cancel', cashierController.cancelOrder);

/**
 * Customer Management
 */
router.get('/customers', cashierController.getAllCustomers);
router.get('/customers/:customerId', cashierController.getCustomerById);
router.post('/customers', cashierController.registerCustomer);
router.put('/customers/:customerId', cashierController.updateCustomer);

module.exports = router;
