const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { requireAuth, requireDelivery } = require('../middleware/auth');

// All routes require authentication and delivery role (or admin)
router.use(requireAuth, requireDelivery);

/**
 * Dashboard
 */
router.get('/dashboard/stats', deliveryController.getDashboardStats);

/**
 * Deliveries Management
 */
router.get('/deliveries', deliveryController.getMyDeliveries);
router.get('/deliveries/:deliveryId', deliveryController.getDeliveryById);
router.put('/deliveries/:deliveryId/status', deliveryController.updateDeliveryStatus);
router.get('/history', deliveryController.getDeliveryHistory);

/**
 * Availability Management
 */
router.get('/availability', deliveryController.getAvailability);
router.put('/availability', deliveryController.updateAvailability);

module.exports = router;
