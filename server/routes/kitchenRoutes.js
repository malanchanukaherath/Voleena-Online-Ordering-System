// CODEMAP: BACKEND_ROUTE_KITCHENROUTES
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { requireKitchen } = require('../middleware/auth');

// All routes require authentication and kitchen role (or admin)
router.use(requireKitchen);

/**
 * Dashboard
 */
router.get('/dashboard/stats', kitchenController.getDashboardStats);

/**
 * Orders Management
 */
router.get('/orders', kitchenController.getAssignedOrders);
router.put('/orders/:orderId/status', kitchenController.updateOrderStatus);

/**
 * Menu Items (read-only for stock reference)
 */
router.get('/menu-items', kitchenController.getAllMenuItems);

/**
 * Daily Stock Management
 */
router.get('/stock/daily', kitchenController.getDailyStock);
router.post('/stock/daily', kitchenController.updateDailyStock);
router.post('/stock/daily/bulk', kitchenController.bulkUpdateDailyStock);

module.exports = router;
