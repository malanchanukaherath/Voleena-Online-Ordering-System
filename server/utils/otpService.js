const { OTPVerification } = require('../models');
const crypto = require('crypto');
const notificationService = require('./notificationService');

/**
 * OTP Verification Service
 * Handles OTP generation and verification for:
 * - Email verification (FR28)
 * - Phone verification (FR28)
 * - Password reset (FR27)
 * - Two-factor authentication
 */
class OTPService {
    constructor() {
        this.otpLength = 6;
        this.otpExpiry = 15; // minutes
    }

    /**
     * Generate a random OTP code
     */
    generateOTP() {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Create and send OTP for email/phone verification or password reset
     * @param {string} userType - 'CUSTOMER' or 'STAFF'
     * @param {number} userID - User ID
     * @param {string} purpose - 'EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN'
     * @param {string} email - Email address (optional)
     * @param {string} phone - Phone number (optional)
     * @returns {Promise<{success: boolean, otpId: number}>}
     */
    async generateAndSendOTP(userType, userID, purpose, email = null, phone = null) {
        try {
            // Generate OTP code
            const otpCode = this.generateOTP();

            // Calculate expiry time
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + this.otpExpiry);

            // Save OTP to database
            const otp = await OTPVerification.create({
                UserType: userType,
                UserID: userID,
                OTPCode: otpCode,
                Purpose: purpose,
                ExpiresAt: expiresAt,
                IsUsed: false
            });

            // Send OTP via email/SMS
            await notificationService.sendOTPVerification(email, phone, otpCode, purpose);

            console.log(`✅ OTP generated for ${userType} ${userID}: ${otpCode} (expires in ${this.otpExpiry}min)`);

            return {
                success: true,
                otpId: otp.OTPID,
                expiresAt: expiresAt,
                message: `Verification code sent to ${email || phone}`
            };

        } catch (error) {
            console.error('❌ OTP generation failed:', error.message);
            throw new Error('Failed to generate verification code');
        }
    }

    /**
     * Verify OTP code
     * @param {string} userType - 'CUSTOMER' or 'STAFF'
     * @param {number} userID - User ID
     * @param {string} otpCode - The OTP code to verify
     * @param {string} purpose - 'EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN'
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async verifyOTP(userType, userID, otpCode, purpose) {
        try {
            // Find the OTP record
            const otp = await OTPVerification.findOne({
                where: {
                    UserType: userType,
                    UserID: userID,
                    OTPCode: otpCode,
                    Purpose: purpose,
                    IsUsed: false
                },
                order: [['CreatedAt', 'DESC']]
            });

            if (!otp) {
                return {
                    success: false,
                    message: 'Invalid verification code'
                };
            }

            // Check if OTP has expired
            const now = new Date();
            if (now > new Date(otp.ExpiresAt)) {
                return {
                    success: false,
                    message: 'Verification code has expired. Please request a new one.'
                };
            }

            // Mark OTP as used
            await otp.update({
                IsUsed: true,
                UsedAt: now
            });

            console.log(`✅ OTP verified for ${userType} ${userID}`);

            return {
                success: true,
                message: 'Verification successful',
                otpId: otp.OTPID
            };

        } catch (error) {
            console.error('❌ OTP verification failed:', error.message);
            return {
                success: false,
                message: 'Verification failed. Please try again.'
            };
        }
    }

    /**
     * Clean up expired OTPs (can be run as a cron job)
     */
    async cleanupExpiredOTPs() {
        try {
            const deleted = await OTPVerification.destroy({
                where: {
                    ExpiresAt: {
                        [require('sequelize').Op.lt]: new Date()
                    },
                    IsUsed: true
                }
            });

            console.log(`🧹 Cleaned up ${deleted} expired OTP records`);
            return deleted;

        } catch (error) {
            console.error('❌ OTP cleanup failed:', error.message);
            return 0;
        }
    }

    /**
     * Resend OTP
     */
    async resendOTP(userType, userID, purpose, email = null, phone = null) {
        // Invalidate previous OTPs
        await OTPVerification.update(
            { IsUsed: true },
            {
                where: {
                    UserType: userType,
                    UserID: userID,
                    Purpose: purpose,
                    IsUsed: false
                }
            }
        );

        // Generate and send new OTP
        return await this.generateAndSendOTP(userType, userID, purpose, email, phone);
    }
}

module.exports = new OTPService();
