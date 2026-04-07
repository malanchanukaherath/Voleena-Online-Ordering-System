const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const feedbackController = require('../controllers/feedbackController');
const { requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(requireAdmin);

/**
 * Dashboard & Analytics
 */
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/reports/monthly-sales', adminController.getMonthlySalesReport);
router.get('/reports/best-selling', adminController.getBestSellingItems);
router.get('/reports/customer-retention', adminController.getCustomerRetentionReport);

/**
 * Staff Management
 */
router.get('/staff', adminController.getAllStaff);
router.post('/staff', adminController.createStaff);
router.put('/staff/:id', adminController.updateStaff);
router.delete('/staff/:id', adminController.deleteStaff);

/**
 * Roles
 */
router.get('/roles', adminController.getAllRoles);

/**
 * Delivery Assignment
 */
router.post('/delivery/assign', adminController.assignDeliveryStaff);

/**
 * Feedback Management
 */
router.get('/feedback', feedbackController.getAdminFeedback);
router.patch('/feedback/:id/respond', feedbackController.respondToFeedback);

module.exports = router;
