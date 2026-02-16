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
        redisClient.connect();
    }
} catch (error) {
    console.warn('Redis not available, using memory store for rate limiting');
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
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:api:'
    }) : undefined
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes'
    },
    skipSuccessfulRequests: true,
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:'
    }) : undefined
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
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:otp:'
    }) : undefined
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
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:order:'
    }) : undefined
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
    store: redisClient ? new RedisStore({
        client: redisClient,
        prefix: 'rl:reset:'
    }) : undefined
});

module.exports = {
    apiLimiter,
    authLimiter,
    otpLimiter,
    orderLimiter,
    passwordResetLimiter
};
