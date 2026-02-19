/**
 * Validation Utilities
 * Input validation for Sri Lankan phone numbers, emails, and other data
 */

/**
 * Validate Sri Lankan phone number
 * Accepts multiple formats:
 * - +94XXXXXXXXX (with country code)
 * - 0XXXXXXXXX (local number)
 * - 94XXXXXXXXX (country code without +)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid Sri Lankan phone number
 */
function validateSriLankanPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }

    const trimmed = phone.trim();
    
    // Pattern for Sri Lankan phone numbers
    // Local: 0701234567 (10 digits starting with 0)
    // International: +94701234567 or 94701234567 (12 digits)
    const phoneRegex = /^(?:\+94|94|0)(?:70|71|72|73|74|75|76|77|78|31|32|33|34|35|36|37)[0-9]{7}$/;
    
    return phoneRegex.test(trimmed);
}

/**
 * Validate email address
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.length <= 255;
}

/**
 * Validate postal code format
 * Sri Lankan postal codes are typically 5 digits
 * 
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} True if valid postal code
 */
function validatePostalCode(postalCode) {
    if (!postalCode) {
        return true; // Optional field
    }

    if (typeof postalCode !== 'string') {
        return false;
    }

    // Accept 5-10 digit postal codes
    return /^[0-9]{5,10}$/.test(postalCode.trim());
}

/**
 * Validate address line
 * 
 * @param {string} address - Address line to validate
 * @returns {boolean} True if valid address
 */
function validateAddressLine(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }

    const trimmed = address.trim();
    // At least 5 characters, max 255
    return trimmed.length >= 5 && trimmed.length <= 255;
}

/**
 * Validate coordinates
 * 
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {boolean} True if valid coordinates
 */
function validateCoordinates(latitude, longitude) {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return false;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    return (
        !isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

/**
 * Sanitize text input
 * Removes dangerous characters but preserves legitimate content
 * 
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeText(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, 1000); // Limit length
}

/**
 * Validate quantity
 * 
 * @param {number} quantity - Quantity value
 * @returns {boolean} True if valid quantity
 */
function validateQuantity(quantity) {
    const qty = parseInt(quantity, 10);
    return !isNaN(qty) && qty > 0 && qty <= 999;
}

/**
 * Validate order type
 * 
 * @param {string} orderType - Order type (DELIVERY, TAKEAWAY)
 * @returns {boolean} True if valid order type
 */
function validateOrderType(orderType) {
    return ['DELIVERY', 'TAKEAWAY'].includes(orderType);
}

/**
 * Validate payment method
 * 
 * @param {string} method - Payment method
 * @returns {boolean} True if valid payment method
 */
function validatePaymentMethod(method) {
    return ['CASH', 'CARD', 'ONLINE', 'WALLET'].includes(method);
}

/**
 * Validate cart items
 * 
 * @param {Array} items - Cart items array
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
function validateCartItems(items) {
    const errors = [];

    if (!Array.isArray(items)) {
        return { isValid: false, errors: ['Cart items must be an array'] };
    }

    if (items.length === 0) {
        return { isValid: false, errors: ['Cart must contain at least one item'] };
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (!item.menuItemId && !item.comboId) {
            errors.push(`Item ${i + 1}: Must have either menuItemId or comboId`);
        }

        if (!validateQuantity(item.quantity)) {
            errors.push(`Item ${i + 1}: Invalid quantity`);
        }

        if (item.notes && typeof item.notes !== 'string') {
            errors.push(`Item ${i + 1}: Notes must be text`);
        }

        if (item.notes && item.notes.length > 255) {
            errors.push(`Item ${i + 1}: Notes cannot exceed 255 characters`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateSriLankanPhone,
    validateEmail,
    validatePostalCode,
    validateAddressLine,
    validateCoordinates,
    sanitizeText,
    validateQuantity,
    validateOrderType,
    validatePaymentMethod,
    validateCartItems
};
