const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireCustomer } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Customer payment initiation with rate limiting
// CRITICAL: Limits 20 requests per 10 minutes to prevent abuse
router.post('/initiate', requireCustomer, paymentLimiter, paymentController.initiatePayment);
router.post('/confirm-card', requireCustomer, paymentLimiter, paymentController.confirmCardPayment);

// Webhooks (no auth, no rate limit - external payment gateways must be able to reach)
// Note: Webhooks are verified via signature instead of rate limiting
router.post('/webhook/payhere', paymentController.payHereWebhook);
router.post('/payhere/notify', paymentController.payHereWebhook);
router.post('/webhook/stripe', paymentController.stripeWebhook);

module.exports = router;
