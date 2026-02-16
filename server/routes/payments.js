const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireCustomer } = require('../middleware/auth');

// Customer payment initiation
router.post('/initiate', requireCustomer, paymentController.initiatePayment);

// Webhooks (no auth)
router.post('/webhook/payhere', paymentController.payHereWebhook);
router.post('/webhook/stripe', paymentController.stripeWebhook);

module.exports = router;
