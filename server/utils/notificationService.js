const nodemailer = require('nodemailer');
const { Notification } = require('../models');

/**
 * Notification Service
 * Handles EMAIL and SMS notifications (FR15, FR27-FR31)
 * - Order confirmations & status updates
 * - OTP verification
 * - Password reset
 * - Payment notifications
 */
class NotificationService {
    constructor() {
        this.emailTransporter = this.createEmailTransporter();
        this.smsProvider = process.env.SMS_PROVIDER || 'console'; // 'twilio', 'console'
        this.hasLoggedEmailFallbackWarning = false;
    }

    getAuditableMessage(message, containsSensitiveContent = false) {
        if (containsSensitiveContent) {
            return '[REDACTED] Sensitive notification content';
        }

        return message;
    }

    /**
     * Create email transporter using SMTP
     */
    createEmailTransporter() {
        // Check if email credentials are configured
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            return null;
        }

        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    /**
     * Send email notification
     */
    async sendEmail({ to, subject, htmlBody, textBody, relatedOrderID = null, containsSensitiveContent = false }) {
        let notification;
        const auditableMessage = this.getAuditableMessage(textBody || htmlBody, containsSensitiveContent);
        try {
            // Log notification to database
            notification = await Notification.create({
                RecipientType: 'CUSTOMER',
                RecipientID: null, // Will be set if we have customer context
                NotificationType: 'EMAIL',
                Subject: subject,
                Message: auditableMessage,
                Status: 'PENDING',
                RelatedOrderID: relatedOrderID
            });

            if (!this.emailTransporter) {
                if (!this.hasLoggedEmailFallbackWarning) {
                    console.warn('⚠️  Email SMTP is not configured. Notification emails will be logged to console.');
                    this.hasLoggedEmailFallbackWarning = true;
                }

                console.log('📧 Email skipped (provider not configured):', to, subject);

                await notification.update({
                    Status: 'FAILED',
                    ErrorMessage: 'Email provider not configured'
                });

                return {
                    success: false,
                    skipped: true,
                    reason: 'Email provider not configured'
                };
            }

            // Send actual email
            const info = await this.emailTransporter.sendMail({
                from: `"Voleena Foods" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                text: textBody,
                html: htmlBody
            });

            await notification.update({
                Status: 'SENT',
                SentAt: new Date()
            });

            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('❌ Email sending failed:', error.message);

            if (notification) {
                await notification.update({
                    Status: 'FAILED',
                    ErrorMessage: error.message
                });
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMS({ to, message, relatedOrderID = null, containsSensitiveContent = false }) {
        try {
            const auditableMessage = this.getAuditableMessage(message, containsSensitiveContent);

            // Log notification to database
            const notification = await Notification.create({
                RecipientType: 'CUSTOMER',
                RecipientID: null,
                NotificationType: 'SMS',
                Subject: null,
                Message: auditableMessage,
                Status: 'PENDING',
                RelatedOrderID: relatedOrderID
            });

            if (this.smsProvider === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
                // TODO: Implement Twilio SMS
                const twilioClient = require('twilio')(
                    process.env.TWILIO_ACCOUNT_SID,
                    process.env.TWILIO_AUTH_TOKEN
                );

                const sms = await twilioClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: to
                });

                await notification.update({
                    Status: 'SENT',
                    SentAt: new Date()
                });

                return { success: true, sid: sms.sid };
            } else {
                // Fallback: Console logging
                console.log('📱 SMS skipped (provider not configured):', to, containsSensitiveContent ? '[REDACTED]' : message);

                await notification.update({
                    Status: 'FAILED',
                    ErrorMessage: 'SMS provider not configured'
                });

                return {
                    success: false,
                    skipped: true,
                    reason: 'SMS provider not configured'
                };
            }

        } catch (error) {
            console.error('❌ SMS sending failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * FR15: Send order confirmation email
     */
    async sendOrderConfirmation(order, customer) {
        const subject = `Order Confirmation - #${order.OrderNumber}`;

        const htmlBody = this.generateOrderConfirmationHTML(order, customer);
        const textBody = this.generateOrderConfirmationText(order, customer);

        // Send email
        await this.sendEmail({
            to: customer.Email,
            subject,
            htmlBody,
            textBody,
            relatedOrderID: order.OrderID
        });

        // Send SMS if customer prefers
        if (customer.PreferredNotification === 'SMS' || customer.PreferredNotification === 'BOTH') {
            await this.sendSMS({
                to: customer.Phone,
                message: `Voleena Foods: Your order #${order.OrderNumber} has been confirmed! Total: LKR ${order.FinalAmount}. Track at: https://voleena.lk/track/${order.OrderNumber}`,
                relatedOrderID: order.OrderID
            });
        }
    }

    /**
     * FR15: Send order status update notification
     */
    async sendOrderStatusUpdate(order, customer, newStatus) {
        const statusMessages = {
            CONFIRMED: 'Your order has been confirmed and will be prepared soon.',
            PREPARING: 'Your order is being prepared in our kitchen.',
            READY: 'Your order is ready!',
            OUT_FOR_DELIVERY: 'Your order is on the way!',
            DELIVERED: 'Your order has been delivered. Enjoy your meal!',
            CANCELLED: 'Your order has been cancelled.'
        };

        const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`;

        const htmlBody = `
            <h2>Order Status Update</h2>
            <p>Hello ${customer.Name},</p>
            <p>${message}</p>
            <p><strong>Order Number:</strong> ${order.OrderNumber}</p>
            <p><strong>Status:</strong> ${newStatus}</p>
            <p><a href="https://voleena.lk/track/${order.OrderNumber}">Track your order</a></p>
            <br>
            <p>Thank you for choosing Voleena Foods!</p>
        `;

        await this.sendEmail({
            to: customer.Email,
            subject: `Order Update - #${order.OrderNumber}`,
            htmlBody,
            textBody: message,
            relatedOrderID: order.OrderID
        });
    }

    /**
     * FR28: Send OTP verification code
     */
    async sendOTPVerification(email, phone, otpCode, purpose = 'verification') {
        const purposes = {
            'EMAIL_VERIFICATION': 'verify your email',
            'PHONE_VERIFICATION': 'verify your phone',
            'PASSWORD_RESET': 'reset your password',
            'LOGIN': 'login to your account'
        };

        const purposeText = purposes[purpose] || 'verify your account';

        // Send email
        if (email) {
            const htmlBody = `
                <h2>Your Verification Code</h2>
                <p>Use this code to ${purposeText}:</p>
                <h1 style="font-size: 32px; font-weight: bold; color: #2563eb;">${otpCode}</h1>
                <p>This code will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `;

            await this.sendEmail({
                to: email,
                subject: 'Your Verification Code',
                htmlBody,
                textBody: `Your verification code is: ${otpCode}. Valid for 15 minutes.`,
                containsSensitiveContent: true
            });
        }

        // Send SMS
        if (phone) {
            await this.sendSMS({
                to: phone,
                message: `Voleena Foods: Your verification code is ${otpCode}. Valid for 15 minutes. Do not share this code.`,
                containsSensitiveContent: true
            });
        }
    }

    /**
     * FR31: Send payment notification
     */
    async sendPaymentNotification(order, customer, payment) {
        const isSuccess = payment.Status === 'PAID';
        const subject = isSuccess
            ? `Payment Successful - Order #${order.OrderNumber}`
            : `Payment Failed - Order #${order.OrderNumber}`;

        const htmlBody = isSuccess
            ? this.generatePaymentSuccessHTML(order, customer, payment)
            : this.generatePaymentFailureHTML(order, customer, payment);

        await this.sendEmail({
            to: customer.Email,
            subject,
            htmlBody,
            relatedOrderID: order.OrderID
        });
    }

    /**
     * FR21: Send refund notification
     */
    async sendRefundNotification(order, customer, refundAmount) {
        const htmlBody = `
            <h2>Refund Processed</h2>
            <p>Hello ${customer.Name},</p>
            <p>Your refund has been processed for order #${order.OrderNumber}.</p>
            <p><strong>Refund Amount:</strong> LKR ${refundAmount.toFixed(2)}</p>
            <p>The amount will be credited back to your original payment method within 5-7 business days.</p>
            <p>If you have any questions, please contact our support.</p>
        `;

        await this.sendEmail({
            to: customer.Email,
            subject: `Refund Processed - Order #${order.OrderNumber}`,
            htmlBody,
            relatedOrderID: order.OrderID
        });
    }

    // HTML Template Generators
    generateOrderConfirmationHTML(order, customer) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9fafb; }
                    .order-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .button { background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍔 Voleena Foods</h1>
                        <p>Order Confirmation</p>
                    </div>
                    <div class="content">
                        <h2>Thank you for your order, ${customer.Name}!</h2>
                        <p>Your order has been received and will be prepared shortly.</p>
                        
                        <div class="order-details">
                            <h3>Order Details</h3>
                            <p><strong>Order Number:</strong> ${order.OrderNumber}</p>
                            <p><strong>Order Type:</strong> ${order.OrderType}</p>
                            <p><strong>Total Amount:</strong> LKR ${order.FinalAmount}</p>
                            <p><strong>Status:</strong> ${order.Status}</p>
                        </div>

                        <div style="text-align: center;">
                            <a href="https://voleena.lk/track/${order.OrderNumber}" class="button">Track Your Order</a>
                        </div>

                        <p>We'll send you updates as your order progresses.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Voleena Foods. All rights reserved.</p>
                        <p>Kalagedihena, Gampaha District, Sri Lanka</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateOrderConfirmationText(order, customer) {
        return `
VOLEENA FOODS - Order Confirmation

Hello ${customer.Name},

Thank you for your order! Your order has been received.

Order Number: ${order.OrderNumber}
Order Type: ${order.OrderType}
Total Amount: LKR ${order.FinalAmount}
Status: ${order.Status}

Track your order at: https://voleena.lk/track/${order.OrderNumber}

We'll keep you updated on your order status.

Best regards,
Voleena Foods Team
        `;
    }

    generatePaymentSuccessHTML(order, customer, payment) {
        return `
            <h2>✅ Payment Successful</h2>
            <p>Hello ${customer.Name},</p>
            <p>Your payment has been successfully processed.</p>
            <div style="background-color: #f0f9ff; padding: 15px; margin: 15px 0;">
                <p><strong>Order Number:</strong> ${order.OrderNumber}</p>
                <p><strong>Amount Paid:</strong> LKR ${payment.Amount}</p>
                <p><strong>Payment Method:</strong> ${payment.Method}</p>
                <p><strong>Transaction ID:</strong> ${payment.TransactionID}</p>
            </div>
            <p>Your order is now being processed.</p>
        `;
    }

    generatePaymentFailureHTML(order, customer, payment) {
        return `
            <h2>❌ Payment Failed</h2>
            <p>Hello ${customer.Name},</p>
            <p>Unfortunately, your payment could not be processed.</p>
            <div style="background-color: #fef2f2; padding: 15px; margin: 15px 0;">
                <p><strong>Order Number:</strong> ${order.OrderNumber}</p>
                <p><strong>Amount:</strong> LKR ${payment.Amount}</p>
                <p><strong>Payment Method:</strong> ${payment.Method}</p>
            </div>
            <p>Please try again or choose a different payment method.</p>
            <a href="https://voleena.lk/orders/${order.OrderNumber}/payment" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Retry Payment</a>
        `;
    }
}

module.exports = new NotificationService();
