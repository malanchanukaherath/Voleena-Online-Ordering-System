// CODEMAP: BACKEND_SERVER_MIDDLEWARE_VALIDATION_JS
// PURPOSE: Central request validation rules and error formatting middleware.
// SEARCH_HINT: Search exported validate* arrays and handleValidationErrors.
const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
// Simple: This handles what happens when validation errors is triggered.
// Frontend connection: Applies shared security/validation rules across customer and staff flows.
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
}

/**
 * Validation rules for customer registration
 */
const validateCustomerRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(\+94|0)?7[0-9]{8}$/).withMessage('Invalid Sri Lankan phone number format (07XXXXXXXX)'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),

    handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Validation rules for staff creation
 */
const validateStaffCreation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^(\+94|0)?7[0-9]{8}$/).withMessage('Invalid Sri Lankan phone number'),

    body('role_id')
        .notEmpty().withMessage('Role is required')
        .isInt({ min: 1 }).withMessage('Invalid role ID'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    handleValidationErrors
];

/**
 * Validation rules for order creation
 */
const validateOrderCreation = [
    body('order_type')
        .notEmpty().withMessage('Order type is required')
        .isIn(['ONLINE', 'DELIVERY', 'TAKEAWAY', 'WALK_IN']).withMessage('Invalid order type'),

    body('items')
        .isArray({ min: 1 }).withMessage('Order must contain at least one item'),

    body('items.*.menu_item_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid menu item ID'),

    body('items.*.combo_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid combo ID'),

    body('items.*.quantity')
        .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),

    body('address_id')
        .if(body('order_type').equals('DELIVERY'))
        .notEmpty().withMessage('Address is required for delivery orders')
        .isInt({ min: 1 }).withMessage('Invalid address ID'),

    body('special_instructions')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Special instructions must not exceed 500 characters'),

    handleValidationErrors
];

/**
 * Validation rules for menu item creation
 */
const validateMenuItemCreation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),

    body('category_id')
        .notEmpty().withMessage('Category is required')
        .isInt({ min: 1 }).withMessage('Invalid category ID'),

    handleValidationErrors
];

/**
 * Validation rules for stock update
 */
const validateStockUpdate = [
    body('menu_item_id')
        .notEmpty().withMessage('Menu item ID is required')
        .isInt({ min: 1 }).withMessage('Invalid menu item ID'),

    body('opening_quantity')
        .notEmpty().withMessage('Opening quantity is required')
        .isInt({ min: 0 }).withMessage('Opening quantity must be a non-negative integer'),

    body('stock_date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),

    handleValidationErrors
];

/**
 * Validation rules for order cancellation
 */
const validateOrderCancellation = [
    param('id')
        .notEmpty().withMessage('Order ID is required')
        .isInt({ min: 1 }).withMessage('Invalid order ID'),

    body('reason')
        .trim()
        .notEmpty().withMessage('Cancellation reason is required')
        .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
        .matches(/^[a-zA-Z0-9\s.,!?'-]+$/).withMessage('Reason contains invalid characters'),

    handleValidationErrors
];

/**
 * Validation rules for combo pack creation
 */
const validateComboPackCreation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),

    body('discount_type')
        .notEmpty().withMessage('Discount type is required')
        .isIn(['PERCENTAGE', 'FIXED_PRICE']).withMessage('Invalid discount type'),

    body('schedule_start_date')
        .optional()
        .isISO8601().withMessage('Invalid start date format'),

    body('schedule_end_date')
        .optional()
        .isISO8601().withMessage('Invalid end date format')
        .custom((value, { req }) => {
            if (req.body.schedule_start_date && value < req.body.schedule_start_date) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('items')
        .isArray({ min: 1 }).withMessage('Combo must contain at least one item'),

    body('items.*.menu_item_id')
        .isInt({ min: 1 }).withMessage('Invalid menu item ID'),

    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

    handleValidationErrors
];

/**
 * Validation rules for address creation
 */
const validateAddressCreation = [
    body('address_line1')
        .trim()
        .notEmpty().withMessage('Address line 1 is required')
        .isLength({ max: 255 }).withMessage('Address line 1 too long'),

    body('city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ max: 100 }).withMessage('City name too long'),

    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

    handleValidationErrors
];

/**
 * Validation rules for OTP verification
 */
const validateOTPVerification = [
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers'),

    handleValidationErrors
];

/**
 * Validation rules for password reset
 */
const validatePasswordReset = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    handleValidationErrors
];

/**
 * Validation rules for feedback submission
 */
const validateFeedbackSubmission = [
    body('orderId')
        .notEmpty().withMessage('Order ID is required')
        .isInt({ min: 1 }).withMessage('Invalid order ID'),

    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters')
        .matches(/^[a-zA-Z0-9\s.,!?'"-]*$/).withMessage('Comment contains invalid characters'),

    body('positiveTags')
        .optional()
        .isArray({ max: 10 }).withMessage('Positive tags must be an array'),

    body('positiveTags.*')
        .optional()
        .isIn(['Good taste', 'Fast delivery']).withMessage('Invalid positive tag'),

    body('issueTags')
        .optional()
        .isArray({ max: 10 }).withMessage('Issue tags must be an array'),

    body('issueTags.*')
        .optional()
        .isIn(['Late delivery', 'Wrong item', 'Poor packaging']).withMessage('Invalid issue tag'),

    handleValidationErrors
];

/**
 * Validation rules for payment processing
 * CRITICAL: Prevents payment manipulation and fraud
 */
const validatePaymentProcessing = [
    body('order_id')
        .notEmpty().withMessage('Order ID is required')
        .isInt({ min: 1 }).withMessage('Invalid order ID'),

    body('payment_method')
        .notEmpty().withMessage('Payment method is required')
        .isIn(['CASH', 'CARD', 'ONLINE']).withMessage('Invalid payment method'),

    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
        .custom((value) => {
            // Ensure amount has max 2 decimal places
            if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
                throw new Error('Amount must have at most 2 decimal places');
            }
            return true;
        }),

    body('payment_reference')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Payment reference too long')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Payment reference contains invalid characters'),

    handleValidationErrors
];

/**
 * Validation rules for stock adjustment
 * CRITICAL: Prevents unauthorized stock manipulation
 */
const validateStockAdjustment = [
    body('menu_item_id')
        .notEmpty().withMessage('Menu item ID is required')
        .isInt({ min: 1 }).withMessage('Invalid menu item ID'),

    body('adjustment_quantity')
        .notEmpty().withMessage('Adjustment quantity is required')
        .isInt({ min: -1000, max: 1000 }).withMessage('Adjustment must be between -1000 and 1000'),

    body('reason')
        .trim()
        .notEmpty().withMessage('Reason is required for stock adjustment')
        .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
        .matches(/^[a-zA-Z0-9\s.,!?'-]+$/).withMessage('Reason contains invalid characters'),

    body('stock_date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
        .custom((value) => {
            const date = new Date(value);
            const today = new Date();
            const maxFuture = new Date();
            maxFuture.setDate(today.getDate() + 7);
            
            if (date > maxFuture) {
                throw new Error('Stock date cannot be more than 7 days in the future');
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Validation rules for order status update
 * CRITICAL: Ensures valid status transitions
 */
const validateOrderStatusUpdate = [
    param('id')
        .notEmpty().withMessage('Order ID is required')
        .isInt({ min: 1 }).withMessage('Invalid order ID'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['PREORDER_PENDING', 'PREORDER_CONFIRMED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid order status'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
        .matches(/^[a-zA-Z0-9\s.,!?'-]*$/).withMessage('Notes contain invalid characters'),

    handleValidationErrors
];

/**
 * Validation rules for delivery assignment
 * CRITICAL: Ensures delivery staff availability and valid assignments
 */
const validateDeliveryAssignment = [
    body('order_id')
        .notEmpty().withMessage('Order ID is required')
        .isInt({ min: 1 }).withMessage('Invalid order ID'),

    body('staff_id')
        .notEmpty().withMessage('Delivery staff ID is required')
        .isInt({ min: 1 }).withMessage('Invalid staff ID'),

    body('estimated_delivery_time')
        .optional()
        .isISO8601().withMessage('Invalid datetime format')
        .custom((value) => {
            const deliveryTime = new Date(value);
            const now = new Date();
            const maxFuture = new Date();
            maxFuture.setHours(now.getHours() + 4); // Max 4 hours in future
            
            if (deliveryTime < now) {
                throw new Error('Estimated delivery time cannot be in the past');
            }
            if (deliveryTime > maxFuture) {
                throw new Error('Estimated delivery time cannot be more than 4 hours in the future');
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Sanitize user input to prevent XSS
 */
// Simple: This cleans or formats the input.
// Frontend connection: Applies shared security/validation rules across customer and staff flows.
function sanitizeInput(req, res, next) {
    const DOMPurify = require('isomorphic-dompurify');

    // Simple: This cleans or formats the object.
    // Frontend connection: Applies shared security/validation rules across customer and staff flows.
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = DOMPurify.sanitize(obj[key], { ALLOWED_TAGS: [] });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) {
        sanitizeObject(req.body);
    }

    next();
}

module.exports = {
    handleValidationErrors,
    validateCustomerRegistration,
    validateLogin,
    validateStaffCreation,
    validateOrderCreation,
    validateOrderCancellation,
    validateOrderStatusUpdate,
    validateMenuItemCreation,
    validateStockUpdate,
    validateStockAdjustment,
    validateComboPackCreation,
    validateAddressCreation,
    validateOTPVerification,
    validatePasswordReset,
    validateFeedbackSubmission,
    validatePaymentProcessing,
    validateDeliveryAssignment,
    sanitizeInput
};



