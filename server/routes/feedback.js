const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { requireCustomer, requireAdmin } = require('../middleware/auth');
const { validateFeedbackSubmission } = require('../middleware/validation');

// Customer feedback actions
router.post('/', requireCustomer, validateFeedbackSubmission, feedbackController.submitFeedback);
router.get('/me', requireCustomer, feedbackController.getMyFeedback);

// Admin feedback management
router.get('/admin', requireAdmin, feedbackController.getAdminFeedback);
router.patch('/:id/respond', requireAdmin, feedbackController.respondToFeedback);

module.exports = router;