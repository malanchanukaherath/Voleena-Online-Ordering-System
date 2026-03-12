const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { requireAuth, requireDelivery, requireRole } = require('../middleware/auth');
const { publicLookupLimiter } = require('../middleware/rateLimiter');

/**
 * Public endpoints (no authentication required)
 */

/**
 * Validate delivery distance for checkout
 */
router.post('/validate-distance', publicLookupLimiter, deliveryController.validateDeliveryDistance);

/**
 * Get delivery fee configuration
 */
router.get('/fee-config', publicLookupLimiter, deliveryController.getDeliveryFeeConfig);

/**
 * Calculate delivery fee for a specific distance
 */
router.post('/calculate-fee', publicLookupLimiter, deliveryController.calculateDeliveryFee);

// Authenticated location lookup for customers, assigned riders, and admins.
router.get('/deliveries/:deliveryId/location', requireAuth, deliveryController.getDeliveryLocation);

/**
 * Protected routes (require authentication and delivery role or admin)
 */

// All routes below require authentication and delivery role (or admin)
router.use(requireDelivery);

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
 * Location Tracking (Rider sends location, Admin/Customer retrieves it)
 */
router.post('/deliveries/:deliveryId/location', deliveryController.trackDeliveryLocation);
/**
 * Available staff (admin endpoint)
 */
router.get('/staff/available', requireRole('Admin'), deliveryController.getAvailableDeliveryStaff);

/**
 * Availability Management
 */
router.get('/availability', deliveryController.getAvailability);
router.put('/availability', deliveryController.updateAvailability);

module.exports = router;
