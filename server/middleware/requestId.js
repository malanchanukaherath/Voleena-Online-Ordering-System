const { v4: uuidv4 } = require('uuid');

// CODEMAP: BACKEND_SERVER_MIDDLEWARE_REQUESTID_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { v4: uuidv4 } = require('uuid');

// CODEMAP: BACKEND_SERVER_MIDDLEWARE_REQUESTID_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { v4: uuidv4 } = require('uuid');

// CODEMAP: BACKEND_SERVER_MIDDLEWARE_REQUESTID_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { v4: uuidv4 } = require('uuid');
module.exports = requestIdMiddleware;
// CODEMAP: BACKEND_SERVER_MIDDLEWARE_REQUESTID_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware
 * Adds a unique request ID for distributed tracing and debugging
 * Returns X-Request-ID header in all responses
 */
// Simple: This handles request id middleware logic.
// Frontend connection: Applies shared security/validation rules across customer and staff flows.
function requestIdMiddleware(req, res, next) {
    // Check for existing request ID (from load balancer or client)
    const requestId = req.headers['x-request-id'] || uuidv4();

    // Attach to request object
    req.id = requestId;
    req.requestId = requestId;

    // Store in request context for logging
    if (!req.requestContext) {
        req.requestContext = {};
    }
    req.requestContext.requestId = requestId;

    // Set response header
    res.setHeader('X-Request-ID', requestId);

    // Log request start with ID
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Optionally override console methods to include request ID
    // (Comment out if using external logger like winston)
    /*
    console.log = (...args) => {
        originalLog(`[${requestId}]`, ...args);
    };
    console.error = (...args) => {
        originalError(`[${requestId}]`, ...args);
    };
    console.warn = (...args) => {
        originalWarn(`[${requestId}]`, ...args);
    };
    
    // Restore on response finish
    res.on('finish', () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
    });
    */

    next();
}

module.exports = requestIdMiddleware;



