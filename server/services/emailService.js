const nodemailer = require('nodemailer');
const { Notification } = require('../models');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service configuration error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

/**
 * Send email and log notification
 */
async function sendEmail(to, subject, html, relatedOrderId = null) {
    try {
        const info = await transporter.sendMail({
            from: `"Voleena Foods" <${process.env.SMTP_FROM}>`,
            to,
            subject,
            html
        });

        // Log notification
        await Notification.create({
          RecipientType: 'CUSTOMER', // Determine based on context
          RecipientID: null, // Set based on context
          NotificationType: 'EMAIL',
          Subject: subject,
          Message: html,
          Status: 'SENT',
          SentAt: new Date(),
          RelatedOrderID: relatedOrderId
        });

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        // Log failed notification
        await Notification.create({
          RecipientType: 'CUSTOMER',
          RecipientID: null,
          NotificationType: 'EMAIL',
          Subject: subject,
          Message: html,
          Status: 'FAILED',
          ErrorMessage: error.message,
          RelatedOrderID: relatedOrderId
        });

        throw error;
    }
}

/**
 * Send order confirmation email (FR15)
 */
async function sendOrderConfirmationEmail(order, customer) {
    const subject = `Order Confirmed - #${order.OrderNumber}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.Name},</p>
          <p>Thank you for your order. Your order has been confirmed and is being prepared.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.OrderNumber}</p>
            <p><strong>Order Type:</strong> ${order.OrderType}</p>
            <p><strong>Total Amount:</strong> LKR ${order.FinalAmount}</p>
            <p><strong>Status:</strong> ${order.Status}</p>
          </div>
          
          <p>You will receive updates as your order progresses.</p>
          <p>Thank you for choosing Voleena Foods!</p>
        </div>
        <div class="footer">
          <p>Voleena Foods | Kalagedihena, Gampaha District, Sri Lanka</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail(customer.Email, subject, html, order.OrderID);
}

/**
 * Send order status update email (FR15)
 */
async function sendOrderStatusUpdateEmail(order, customer, newStatus) {
    const statusMessages = {
        CONFIRMED: 'Your order has been confirmed',
        PREPARING: 'Your order is being prepared',
        READY: 'Your order is ready',
        OUT_FOR_DELIVERY: 'Your order is out for delivery',
        DELIVERED: 'Your order has been delivered',
        CANCELLED: 'Your order has been cancelled'
    };

    const subject = `Order Update - #${order.OrderNumber}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center; }
        .status h2 { color: #4CAF50; margin: 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.Name},</p>
          
          <div class="status">
            <h2>${statusMessages[newStatus]}</h2>
            <p>Order #${order.OrderNumber}</p>
          </div>
          
          ${newStatus === 'OUT_FOR_DELIVERY' ? '<p>Your order is on its way! Our delivery staff will contact you shortly.</p>' : ''}
          ${newStatus === 'READY' && order.OrderType === 'TAKEAWAY' ? '<p>Your order is ready for pickup at our location.</p>' : ''}
          
          <p>Thank you for your patience!</p>
        </div>
        <div class="footer">
          <p>Voleena Foods | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail(customer.Email, subject, html, order.OrderID);
}

/**
 * Send OTP verification email (FR28)
 */
async function sendOTPEmail(email, otp, purpose) {
    const purposeMessages = {
        EMAIL_VERIFICATION: 'Verify Your Email',
        PASSWORD_RESET: 'Reset Your Password',
        LOGIN: 'Login Verification'
    };

    const subject = purposeMessages[purpose] || 'Verification Code';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .otp { background: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #FF9800; letter-spacing: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <p>Your verification code is:</p>
          
          <div class="otp">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Voleena Foods | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail(email, subject, html);
}

/**
 * Send password reset email (FR27)
 */
async function sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset</h1>
        </div>
        <div class="content">
          <p>You requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>Voleena Foods | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail(email, subject, html);
}

/**
 * Send welcome email for new customers
 */
async function sendWelcomeEmail(customer) {
    const subject = 'Welcome to Voleena Foods!';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Voleena Foods!</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.Name},</p>
          <p>Thank you for registering with Voleena Foods!</p>
          <p>We're excited to serve you delicious Sri Lankan meals, combo packs, and catering services.</p>
          <p>Start browsing our menu and place your first order today!</p>
          <p>Best regards,<br>The Voleena Foods Team</p>
        </div>
        <div class="footer">
          <p>Voleena Foods | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail(customer.Email, subject, html);
}

module.exports = {
    sendEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail,
    sendOTPEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail
};
