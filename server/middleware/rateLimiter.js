const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client for distributed rate limiting (optional)
// If Redis is not available, falls back to memory store
let redisClient;
try {
    if (process.env.REDIS_URL) {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL
        });
        redisClient.connect().catch(err => {
            console.warn('Redis connection failed, using memory store for rate limiting:', err.message);
            redisClient = null;
        });
    }
} catch (error) {
    console.warn('Redis not available, using memory store for rate limiting');
}

/**
 * Helper to create a RedisStore using the rate-limit-redis v4 API (sendCommand)
 */
function makeRedisStore(prefix) {
    if (!redisClient) return undefined;
    return new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix
    });
}

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: makeRedisStore('rl:api:')
});

/**
 * Strict rate limiter for authentication endpoints
 * Production: 10 attempts per 15 minutes; Development: 100 attempts
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes'
    },
    skipSuccessfulRequests: true,
    store: makeRedisStore('rl:auth:')
});

/**
 * OTP request rate limiter
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 OTP requests per window
    message: {
        success: false,
        error: 'Too many OTP requests, please try again after 15 minutes'
    },
    store: makeRedisStore('rl:otp:')
});

/**
 * Email verification token validation limiter
 */
const verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        success: false,
        error: 'Too many verification attempts, please try again later'
    },
    store: makeRedisStore('rl:verify-email:')
});

/**
 * Order creation rate limiter
 */
const orderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 orders per 5 minutes
    message: {
        success: false,
        error: 'Too many orders, please slow down'
    },
    store: makeRedisStore('rl:order:')
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        success: false,
        error: 'Too many password reset attempts, please try again after 1 hour'
    },
    store: makeRedisStore('rl:reset:')
});

/**
 * Payment endpoint rate limiter
 * Prevents abuse of payment initiation and webhook endpoints
 */
const paymentLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 payment requests per 10 minutes
    message: {
        success: false,
        error: 'Too many payment requests, please slow down'
    },
    skip: (req) => {
        // Skip limiting for webhook endpoints (public safety)
        if (req.path.includes('webhook')) {
            return true;
        }
        return false;
    },
    store: makeRedisStore('rl:payment:')
});

/**
 * Order confirmation endpoint rate limiter
 * Prevents rapid confirmation attempts that could cause race conditions
 */
const confirmOrderLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15, // 15 confirmations per 5 minutes
    message: {
        success: false,
        error: 'Too many confirmation attempts, please slow down'
    },
    store: makeRedisStore('rl:confirm:')
});

module.exports = {
    apiLimiter,
    authLimiter,
    otpLimiter,
    verifyEmailLimiter,
    orderLimiter,
    paymentLimiter,
    confirmOrderLimiter,
    passwordResetLimiter
};
