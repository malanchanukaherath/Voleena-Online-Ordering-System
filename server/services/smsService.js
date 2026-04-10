const twilio = require('twilio');
const { Notification } = require('../models');

// Initialize Twilio client
let twilioClient = null;
let hasLoggedSmsFallbackWarning = false;

if (process.env.SMS_PROVIDER === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ SMS service (Twilio) ready');
}

/**
 * Send SMS message
 */
async function sendSMS(to, message, relatedOrderId = null) {
    try {
        let result;

        if (twilioClient) {
            // Send via Twilio
            result = await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });

            // Log notification
            await Notification.create({
                RecipientType: 'CUSTOMER',
                RecipientID: null,
                NotificationType: 'SMS',
                Subject: null,
                Message: message,
                Status: 'SENT',
                SentAt: new Date(),
                RelatedOrderID: relatedOrderId
            });

            return {
                success: true,
                messageId: result.sid
            };
        } else {
            if (!hasLoggedSmsFallbackWarning) {
                console.warn('⚠️  SMS service is not configured. SMS will be logged to console.');
                hasLoggedSmsFallbackWarning = true;
            }

            // Console logging for development
            console.log('📱 SMS (Console):', to, message);

            await Notification.create({
                RecipientType: 'CUSTOMER',
                RecipientID: null,
                NotificationType: 'SMS',
                Subject: null,
                Message: message,
                Status: 'SENT',
                SentAt: new Date(),
                RelatedOrderID: relatedOrderId
            });

            return {
                success: true,
                messageId: 'console-' + Date.now()
            };
        }
    } catch (error) {
        // Log failed notification
        await Notification.create({
            RecipientType: 'CUSTOMER',
            RecipientID: null,
            NotificationType: 'SMS',
            Subject: null,
            Message: message,
            Status: 'FAILED',
            ErrorMessage: error.message,
            RelatedOrderID: relatedOrderId
        });

        throw error;
    }
}

/**
 * Send OTP via SMS (FR28)
 */
async function sendOTPSMS(phone, otp, purpose) {
    const purposeMessages = {
        EMAIL_VERIFICATION: 'email verification',
        PHONE_VERIFICATION: 'phone verification',
        PASSWORD_RESET: 'password reset',
        LOGIN: 'login'
    };

    const message = `Your Voleena Foods ${purposeMessages[purpose] || 'verification'} code is: ${otp}. Valid for 10 minutes.`;

    return sendSMS(phone, message);
}

/**
 * Send order confirmation SMS (FR15)
 */
async function sendOrderConfirmationSMS(phone, orderNumber) {
    const message = `Your Voleena Foods order #${orderNumber} has been confirmed. You will receive updates as it progresses. Thank you!`;

    return sendSMS(phone, message);
}

/**
 * Send order status update SMS (FR15)
 */
async function sendOrderStatusUpdateSMS(phone, orderNumber, status) {
    const statusMessages = {
        CONFIRMED: 'confirmed',
        PREPARING: 'being prepared',
        READY: 'ready',
        OUT_FOR_DELIVERY: 'out for delivery',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    };

    const message = `Order #${orderNumber} is now ${statusMessages[status]}. Thank you for choosing Voleena Foods!`;

    return sendSMS(phone, message);
}

/**
 * Send delivery notification SMS
 */
async function sendDeliveryNotificationSMS(phone, orderNumber, estimatedTime) {
    const message = `Your order #${orderNumber} is on the way! Estimated delivery: ${estimatedTime} minutes. Our delivery staff will contact you shortly.`;

    return sendSMS(phone, message);
}

module.exports = {
    sendSMS,
    sendOTPSMS,
    sendOrderConfirmationSMS,
    sendOrderStatusUpdateSMS,
    sendDeliveryNotificationSMS
};
