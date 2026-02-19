const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireCustomer, authenticateToken } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Customer payment initiation with rate limiting
// CRITICAL: Limits 20 requests per 10 minutes to prevent abuse
router.post('/initiate', authenticateToken, requireCustomer, paymentLimiter, paymentController.initiatePayment);

// Webhooks (no auth, no rate limit - external payment gateways must be able to reach)
// Note: Webhooks are verified via signature instead of rate limiting
router.post('/webhook/payhere', paymentController.payHereWebhook);
router.post('/webhook/stripe', paymentController.stripeWebhook);

module.exports = router;
