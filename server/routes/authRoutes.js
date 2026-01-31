const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @route POST /api/auth/staff/login
 * @desc Staff login (Admin, Cashier, Kitchen, Delivery)
 */
router.post('/staff/login', authController.staffLogin);

/**
 * @route POST /api/auth/customer/login
 * @desc Customer login
 */
router.post('/customer/login', authController.customerLogin);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 */
router.post('/logout', authController.logout);

/**
 * @route GET /api/auth/verify
 * @desc Verify current token
 */
router.get('/verify', authController.verifyToken);

/**
 * @route POST /api/auth/password-reset/request
 * @desc Request password reset (generates OTP)
 */
router.post('/password-reset/request', authController.requestPasswordReset);

/**
 * @route POST /api/auth/password-reset/verify-otp
 * @desc Verify OTP for password reset
 */
router.post('/password-reset/verify-otp', authController.verifyResetOTP);

/**
 * @route POST /api/auth/password-reset/reset
 * @desc Reset password with OTP
 */
router.post('/password-reset/reset', authController.resetPassword);

module.exports = router;
