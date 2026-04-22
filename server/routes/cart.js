// CODEMAP: BACKEND_ROUTE_CART
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
/**
 * Cart Routes
 * Handles shopping cart validation and summary endpoints
 *
 * SECURITY NOTE: These endpoints are INTENTIONALLY PUBLIC to support guest cart browsing.
 * They only validate provided product data and stock availability without accessing
 * any user-specific or private information. Rate limiting is applied to prevent abuse.
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { publicLookupLimiter } = require('../middleware/rateLimiter');

/**
 * Validate cart items against current inventory
 * POST /api/v1/cart/validate
 *
 * PUBLIC: Supports guest cart validation before authentication
 * Validates only provided product IDs and quantities against stock
 */
router.post('/validate', publicLookupLimiter, cartController.validateCart);

/**
 * Get cart summary with pricing
 * POST /api/v1/cart/summary
 *
 * PUBLIC: Supports guest cart pricing preview before authentication
 * Calculates totals based on provided items and public system settings
 */
router.post('/summary', publicLookupLimiter, cartController.getCartSummary);

module.exports = router;
