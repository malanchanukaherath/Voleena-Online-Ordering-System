// CODEMAP: BACKEND_ROUTE_AUTHROUTES
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
	authLimiter,
	otpLimiter,
	passwordResetLimiter,
	verifyEmailLimiter
} = require('../middleware/rateLimiter');

/**
 * @route POST /api/auth/staff/login
 * @desc Staff login (Admin, Cashier, Kitchen, Delivery)
 * CRITICAL: Rate limited to 5 attempts per 15 minutes
 */
router.post('/staff/login', authLimiter, authController.staffLogin);

/**
 * @route POST /api/auth/customer/login
 * @desc Customer login
 * CRITICAL: Rate limited to 5 attempts per 15 minutes
 */
router.post('/customer/login', authLimiter, authController.customerLogin);

/**
 * @route POST /api/auth/register
 * @desc Customer self-registration
 * CRITICAL: Rate limited to 5 attempts per 15 minutes
 */
router.post('/register', authLimiter, authController.register);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify customer email via one-time token
 */
router.post('/verify-email', verifyEmailLimiter, authController.verifyEmail);

/**
 * @route POST /api/auth/email-verification/resend
 * @desc Resend customer verification email
 * CRITICAL: Rate limited to 3 attempts per 15 minutes
 */
router.post('/email-verification/resend', otpLimiter, authController.resendEmailVerification);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route GET /api/auth/verify
 * @desc Verify current token
 */
router.get('/verify', authenticateToken, authController.verifyToken);

/**
 * @route POST /api/auth/password-reset/request
 * @desc Request password reset (generates OTP)
 * CRITICAL: Rate limited to 3 OTP requests per 15 minutes
 */
router.post('/password-reset/request', otpLimiter, authController.requestPasswordReset);

/**
 * @route POST /api/auth/password-reset/verify-otp
 * @desc Verify OTP for password reset
 * CRITICAL: Rate limited to 3 attempts per 15 minutes
 */
router.post('/password-reset/verify-otp', otpLimiter, authController.verifyResetOTP);

/**
 * @route POST /api/auth/password-reset/reset
 * @desc Reset password with OTP
 * CRITICAL: Rate limited to 3 attempts per hour
 */
router.post('/password-reset/reset', passwordResetLimiter, authController.resetPassword);

module.exports = router;
