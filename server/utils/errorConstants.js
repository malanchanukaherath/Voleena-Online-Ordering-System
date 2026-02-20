/**
 * Error Constants & Handling
 * Provides consistent error codes and messages across the application
 */

const ERROR_CODES = {
  // Authentication Errors (4001-4099)
  INVALID_CREDENTIALS: {
    code: '4001',
    message: 'Invalid email or password',
    statusCode: 401
  },
  TOKEN_EXPIRED: {
    code: '4002',
    message: 'Your session has expired. Please login again',
    statusCode: 401
  },
  INVALID_TOKEN: {
    code: '4003',
    message: 'Invalid authentication token',
    statusCode: 401
  },
  REFRESH_TOKEN_EXPIRED: {
    code: '4004',
    message: 'Refresh token expired. Please login again',
    statusCode: 401
  },
  NO_TOKEN: {
    code: '4005',
    message: 'Authentication token required',
    statusCode: 401
  },
  INSUFFICIENT_PERMISSIONS: {
    code: '4006',
    message: 'You do not have permission to perform this action',
    statusCode: 403
  },
  ACCOUNT_LOCKED: {
    code: '4007',
    message: 'Account is locked due to too many failed attempts',
    statusCode: 403
  },

  // Validation Errors (4201-4299)
  INVALID_INPUT: {
    code: '4201',
    message: 'Invalid input data',
    statusCode: 400
  },
  MISSING_REQUIRED_FIELD: {
    code: '4202',
    message: 'Required field is missing',
    statusCode: 400
  },
  INVALID_EMAIL: {
    code: '4203',
    message: 'Invalid email format',
    statusCode: 400
  },
  INVALID_PHONE: {
    code: '4204',
    message: 'Invalid phone number format',
    statusCode: 400
  },
  WEAK_PASSWORD: {
    code: '4205',
    message: 'Password does not meet security requirements',
    statusCode: 400
  },
  DUPLICATE_EMAIL: {
    code: '4206',
    message: 'Email already registered',
    statusCode: 409
  },
  INVALID_ORDER_TYPE: {
    code: '4207',
    message: 'Invalid order type. Must be DELIVERY or TAKEAWAY',
    statusCode: 400
  },

  // Business Logic Errors (4301-4399)
  INSUFFICIENT_STOCK: {
    code: '4301',
    message: 'Insufficient stock available',
    statusCode: 400
  },
  ITEM_NOT_AVAILABLE: {
    code: '4302',
    message: 'Item is not currently available',
    statusCode: 400
  },
  ORDER_NOT_FOUND: {
    code: '4303',
    message: 'Order not found',
    statusCode: 404
  },
  INVALID_ORDER_STATUS: {
    code: '4304',
    message: 'Invalid order status transition',
    statusCode: 400
  },
  DELIVERY_OUT_OF_RANGE: {
    code: '4305',
    message: 'Delivery address is outside our service area',
    statusCode: 400
  },
  CANNOT_CANCEL_ORDER: {
    code: '4306',
    message: 'Order cannot be cancelled at this stage',
    statusCode: 400
  },
  PAYMENT_FAILED: {
    code: '4307',
    message: 'Payment processing failed',
    statusCode: 400
  },
  DUPLICATE_PAYMENT: {
    code: '4308',
    message: 'Payment already processed for this order',
    statusCode: 409
  },

  // Resource Errors (4401-4499)
  CUSTOMER_NOT_FOUND: {
    code: '4401',
    message: 'Customer not found',
    statusCode: 404
  },
  USER_NOT_FOUND: {
    code: '4402',
    message: 'User not found',
    statusCode: 404
  },
  DELIVERY_STAFF_NOT_FOUND: {
    code: '4403',
    message: 'No available delivery staff',
    statusCode: 404
  },
  ADDRESS_NOT_FOUND: {
    code: '4404',
    message: 'Address not found',
    statusCode: 404
  },

  // Server Errors (5001-5999)
  INTERNAL_ERROR: {
    code: '5000',
    message: 'An unexpected error occurred',
    statusCode: 500
  },
  DATABASE_ERROR: {
    code: '5001',
    message: 'Database operation failed',
    statusCode: 500
  },
  PAYMENT_GATEWAY_ERROR: {
    code: '5002',
    message: 'Payment gateway unavailable',
    statusCode: 503
  },
  EMAIL_SERVICE_ERROR: {
    code: '5003',
    message: 'Failed to send email',
    statusCode: 500
  },
  LOCATION_SERVICE_ERROR: {
    code: '5004',
    message: 'Location service unavailable',
    statusCode: 503
  }
};

/**
 * Create standardized error response
 */
function createErrorResponse(errorCode, additionalDetails = null) {
  const error = ERROR_CODES[errorCode];
  
  if (!error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR.code,
        message: ERROR_CODES.INTERNAL_ERROR.message,
        statusCode: ERROR_CODES.INTERNAL_ERROR.statusCode
      }
    };
  }

  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      ...(additionalDetails && { details: additionalDetails })
    }
  };
}

module.exports = {
  ERROR_CODES,
  createErrorResponse
};

