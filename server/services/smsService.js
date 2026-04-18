const twilio = require('twilio');
const { Notification } = require('../models');

// Initialize Twilio client
let twilioClient = null;
let hasLoggedSmsFallbackWarning = false;
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const DEFAULT_COUNTRY_CALLING_CODE = String(process.env.DEFAULT_COUNTRY_CALLING_CODE || '').trim();

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

const buildInvalidPhoneError = (rawPhone) => {
    const error = new Error('Recipient phone number must be in international format (E.164).');
    error.code = 'INVALID_RECIPIENT_PHONE';
    error.userMessage = 'Phone number must include country code (for example: +94771234567). Please update your profile phone and try again.';
    error.rawPhone = rawPhone;
    return error;
};

const normalizePhoneForSms = (phone) => {
    const rawPhone = normalizePhone(phone);
    if (!rawPhone) {
        return '';
    }

    if (rawPhone.startsWith('+')) {
        return `+${rawPhone.slice(1).replace(/\D/g, '')}`;
    }

    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!digitsOnly) {
        return '';
    }

    if (digitsOnly.startsWith('00')) {
        return `+${digitsOnly.slice(2)}`;
    }

    const countryDigits = DEFAULT_COUNTRY_CALLING_CODE.replace(/\D/g, '');
    if (!countryDigits) {
        return digitsOnly;
    }

    if (digitsOnly.startsWith(countryDigits)) {
        return `+${digitsOnly}`;
    }

    const nationalNumber = digitsOnly.startsWith('0') ? digitsOnly.replace(/^0+/, '') : digitsOnly;
    if (!nationalNumber) {
        return '';
    }

    return `+${countryDigits}${nationalNumber}`;
};

const mapProviderPhoneError = (error, rawPhone) => {
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();

    if (code === '21211' || message.includes('invalid') && message.includes('phone number')) {
        const invalidPhoneError = buildInvalidPhoneError(rawPhone);
        invalidPhoneError.providerCode = error?.code;
        return invalidPhoneError;
    }

    if (code === '21608') {
        const trialRestrictionError = new Error('Twilio trial account cannot send SMS to this unverified destination number.');
        trialRestrictionError.code = 'TRIAL_UNVERIFIED_DESTINATION';
        trialRestrictionError.providerCode = error?.code;
        trialRestrictionError.userMessage = 'Twilio Trial restriction: this phone number is not verified in your Twilio account. Verify the recipient number in Twilio Console or upgrade the account, then retry.';
        return trialRestrictionError;
    }

    return error;
};

const buildAuditableMessage = (message, containsSensitiveContent) => {
    if (containsSensitiveContent) {
        return '[REDACTED] Sensitive SMS content';
    }

    return message;
};

async function logNotification(payload) {
    if (!Notification || typeof Notification.create !== 'function') {
        return false;
    }

    try {
        await Notification.create(payload);
        return true;
    } catch (error) {
        // Never fail SMS delivery flow due to local audit-log persistence errors.
        console.error('Failed to persist SMS notification audit log:', error.message);
        return false;
    }
}

/**
 * Send SMS message
 */
async function sendSMS(to, message, relatedOrderId = null, options = {}) {
    try {
        const normalizedTo = normalizePhoneForSms(to);
        const containsSensitiveContent = Boolean(options.containsSensitiveContent);
        const recipientId = Number.isInteger(options.recipientId) && options.recipientId > 0
            ? options.recipientId
            : null;
        const recipientType = String(options.recipientType || 'CUSTOMER').toUpperCase() === 'STAFF'
            ? 'STAFF'
            : 'CUSTOMER';
        const auditableMessage = buildAuditableMessage(message, containsSensitiveContent);

        if (!normalizedTo) {
            throw new Error('Recipient phone number is required for SMS');
        }

        if (!E164_PHONE_PATTERN.test(normalizedTo)) {
            throw buildInvalidPhoneError(to);
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

            if (recipientId !== null) {
                await logNotification({
                    RecipientType: recipientType,
                    RecipientID: recipientId,
                    NotificationType: 'SMS',
                    Subject: null,
                    Message: auditableMessage,
                    Status: 'SENT',
                    SentAt: new Date(),
                    RelatedOrderID: relatedOrderId
                });
            }

            return {
                success: true,
                messageId: result.sid
            };
        }

        if (!hasLoggedSmsFallbackWarning) {
            console.warn('⚠️  SMS service is not configured. SMS delivery will be skipped.');
            hasLoggedSmsFallbackWarning = true;
        }

        console.log(
            '📱 SMS skipped (provider not configured):',
            normalizedTo,
            containsSensitiveContent ? '[REDACTED]' : message
        );

        if (recipientId !== null) {
            await logNotification({
                RecipientType: recipientType,
                RecipientID: recipientId,
                NotificationType: 'SMS',
                Subject: null,
                Message: auditableMessage,
                Status: 'FAILED',
                ErrorMessage: 'SMS provider not configured',
                RelatedOrderID: relatedOrderId
            });
        }

        return {
            success: false,
            skipped: true,
            reason: 'SMS provider not configured'
        };
    } catch (error) {
        const normalizedError = mapProviderPhoneError(error, to);
        try {
            if (recipientId !== null) {
                await logNotification({
                    RecipientType: recipientType,
                    RecipientID: recipientId,
                    NotificationType: 'SMS',
                    Subject: null,
                    Message: buildAuditableMessage(message, Boolean(options.containsSensitiveContent)),
                    Status: 'FAILED',
                    ErrorMessage: normalizedError.message,
                    RelatedOrderID: relatedOrderId
                });
            }
        } catch (notificationLogError) {
            console.error('Failed to log SMS notification status:', notificationLogError.message);
        }

        throw normalizedError;
    }
}

/**
 * Send OTP via SMS (FR28)
 */
async function sendOTPSMS(phone, otp, purpose, metadata = {}) {
    const purposeMessages = {
        EMAIL_VERIFICATION: 'email verification',
        PHONE_VERIFICATION: 'phone verification',
        PASSWORD_RESET: 'password reset',
        LOGIN: 'login'
    };

    const message = `Your Voleena Foods ${purposeMessages[purpose] || 'verification'} code is: ${otp}. Valid for 10 minutes.`;

    return sendSMS(phone, message, null, {
        containsSensitiveContent: true,
        recipientId: metadata.recipientId,
        recipientType: metadata.recipientType
    });
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
