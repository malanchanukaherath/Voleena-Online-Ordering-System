const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg,
                value: err.value
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
        .isIn(['DELIVERY', 'TAKEAWAY']).withMessage('Invalid order type'),

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
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),

    body('order_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid order ID'),

    body('feedback_type')
        .optional()
        .isIn(['ORDER', 'DELIVERY', 'GENERAL']).withMessage('Invalid feedback type'),

    handleValidationErrors
];

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(req, res, next) {
    const DOMPurify = require('isomorphic-dompurify');

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
    validateMenuItemCreation,
    validateStockUpdate,
    validateComboPackCreation,
    validateAddressCreation,
    validateOTPVerification,
    validatePasswordReset,
    validateFeedbackSubmission,
    sanitizeInput
};
