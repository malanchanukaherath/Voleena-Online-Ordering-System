/**
 * Rate Limit Headers Middleware
 * Ensures all responses include RFC 6585 standard rate limit headers
 * even when express-rate-limit doesn't set them
 */
// Code Review: Function rateLimitHeadersMiddleware in server\middleware\rateLimitHeaders.js. Used in: server/index.js, server/middleware/rateLimitHeaders.js, server/tests/rateLimitHeaders.middleware.test.js.
function rateLimitHeadersMiddleware(req, res, next) {
    // Set Rate-Limit headers if not already set by rate limiter
    const originalJson = res.json;
    const originalSend = res.send;

    // Code Review: Function addHeaders in server\middleware\rateLimitHeaders.js. Used in: server/middleware/rateLimitHeaders.js.
    function addHeaders(data) {
        // Add rate limit info if available (from rate limiter)
        if (req.rateLimit) {
            const resetTimeMs = req.rateLimit.resetTime
                ? new Date(req.rateLimit.resetTime).getTime()
                : Date.now();
            const remaining = Number.isFinite(req.rateLimit.remaining)
                ? req.rateLimit.remaining
                : Math.max((req.rateLimit.limit || 0) - (req.rateLimit.current || 0), 0);

            res.setHeader('RateLimit-Limit', req.rateLimit.limit);
            res.setHeader('RateLimit-Remaining', remaining);
            res.setHeader('RateLimit-Reset', new Date(resetTimeMs).toUTCString());
            // Alternative Unix timestamp format
            res.setHeader('X-RateLimit-Reset', Math.ceil(resetTimeMs / 1000));
        }
        return data;
    }

    // Override json response
    res.json = function (data) {
        addHeaders(data);
        return originalJson.call(this, data);
    };

    // Override text response
    res.send = function (data) {
        if (typeof data === 'object') {
            addHeaders(data);
        }
        return originalSend.call(this, data);
    };

    next();
}

module.exports = rateLimitHeadersMiddleware;
