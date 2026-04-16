const twilio = require('twilio');
const { Notification } = require('../models');

// Initialize Twilio client
let twilioClient = null;
let hasLoggedSmsFallbackWarning = false;

const shouldUseTwilio = process.env.SMS_PROVIDER === 'twilio';
const hasApiKeyCredentials = Boolean(
    process.env.TWILIO_ACCOUNT_SID
    && process.env.TWILIO_API_KEY
    && process.env.TWILIO_API_SECRET
);
const hasLegacyCredentials = Boolean(
    process.env.TWILIO_ACCOUNT_SID
    && process.env.TWILIO_AUTH_TOKEN
);

if (shouldUseTwilio && (hasApiKeyCredentials || hasLegacyCredentials)) {
    twilioClient = hasApiKeyCredentials
        ? twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, {
            accountSid: process.env.TWILIO_ACCOUNT_SID
        })
        : twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    console.log(
        `✅ SMS service (Twilio) ready using ${hasApiKeyCredentials ? 'API key' : 'Auth token'} credentials`
    );
}

const normalizePhone = (phone) => String(phone || '').trim();

async function logNotification(payload) {
    if (!Notification || typeof Notification.create !== 'function') {
        return;
    }

    await Notification.create(payload);
}

/**
 * Send SMS message
 */
async function sendSMS(to, message, relatedOrderId = null) {
    try {
        const normalizedTo = normalizePhone(to);

        if (!normalizedTo) {
            throw new Error('Recipient phone number is required for SMS');
        }

        if (twilioClient) {
            const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            const fromNumber = process.env.TWILIO_PHONE_NUMBER;

            if (!messagingServiceSid && !fromNumber) {
                throw new Error('Twilio sender is not configured. Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER');
            }

            const createPayload = {
                body: message,
                to: normalizedTo
            };

            if (messagingServiceSid) {
                createPayload.messagingServiceSid = messagingServiceSid;
            } else {
                createPayload.from = fromNumber;
            }

            const result = await twilioClient.messages.create(createPayload);

            await logNotification({
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
        }

        if (!hasLoggedSmsFallbackWarning) {
            console.warn('⚠️  SMS service is not configured. SMS will be logged to console.');
            hasLoggedSmsFallbackWarning = true;
        }

        console.log('📱 SMS (Console):', normalizedTo, message);

        await logNotification({
            RecipientType: 'CUSTOMER',
            RecipientID: null,
            NotificationType: 'SMS',
            Subject: null,
            Message: message,
            Status: 'SENT',
            ErrorMessage: 'SMS provider not configured - logged to console',
            SentAt: new Date(),
            RelatedOrderID: relatedOrderId
        });

        return {
            success: true,
            messageId: `console-${Date.now()}`
        };
    } catch (error) {
        try {
            await logNotification({
                RecipientType: 'CUSTOMER',
                RecipientID: null,
                NotificationType: 'SMS',
                Subject: null,
                Message: message,
                Status: 'FAILED',
                ErrorMessage: error.message,
                RelatedOrderID: relatedOrderId
            });
        } catch (notificationLogError) {
            console.error('Failed to log SMS notification status:', notificationLogError.message);
        }

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
