// CODEMAP: BACKEND_JWT_UTILS
// PURPOSE: Generate, verify, hash, and blacklist JWT tokens.
// SEARCH_HINT: Use this for token lifecycle explanation.
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TokenBlacklist } = require('../models');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30m';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

/**
 * Generate access token
 */
function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('TOKEN_EXPIRED');
        }
        throw new Error('INVALID_TOKEN');
    }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('REFRESH_TOKEN_EXPIRED');
        }
        throw new Error('INVALID_REFRESH_TOKEN');
    }
}

/**
 * Hash token for blacklist storage
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(token) {
    if (!TokenBlacklist) {
        return false;
    }
    const tokenHash = hashToken(token);
    const blacklisted = await TokenBlacklist.findOne({
        where: { token_hash: tokenHash }
    });
    return !!blacklisted;
}

/**
 * Blacklist a token
 */
async function blacklistToken(token, userType, userId, reason = 'LOGOUT') {
    if (!TokenBlacklist) {
        return;
    }
    const tokenHash = hashToken(token);
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
        throw new Error('Invalid token');
    }

    const expiresAt = new Date(decoded.exp * 1000);

    await TokenBlacklist.create({
        token_hash: tokenHash,
        user_type: userType,
        user_id: userId,
        expires_at: expiresAt,
        reason
    });
}

/**
 * Clean expired blacklisted tokens (run periodically)
 */
async function cleanExpiredBlacklistedTokens() {
    if (!TokenBlacklist) {
        return 0;
    }
    await TokenBlacklist.destroy({
        where: {
            expires_at: { [Op.lt]: new Date() }
        }
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashToken,
    isTokenBlacklisted,
    blacklistToken,
    cleanExpiredBlacklistedTokens
};
