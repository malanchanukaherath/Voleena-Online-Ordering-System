/**
 * Cart Routes
 * Handles shopping cart validation and summary endpoints
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

/**
 * Validate cart items against current inventory
 * POST /api/v1/cart/validate
 */
router.post('/validate', cartController.validateCart);

/**
 * Get cart summary with pricing
 * POST /api/v1/cart/summary
 */
router.post('/summary', cartController.getCartSummary);

module.exports = router;
