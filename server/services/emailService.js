// CODEMAP: BACKEND_SERVICE_EMAILSERVICE
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { Notification } = require('../models');

let hasLoggedEmailNotConfiguredWarning = false;
let hasLoggedResendNotConfiguredWarning = false;

// Simple: This handles warn email not configured once logic.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const warnEmailNotConfiguredOnce = () => {
  if (hasLoggedEmailNotConfiguredWarning) {
    return;
  }

  console.warn('⚠️  Email SMTP is not configured. Legacy email notifications will be skipped.');
  hasLoggedEmailNotConfiguredWarning = true;
};

// Simple: This handles warn resend not configured once logic.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const warnResendNotConfiguredOnce = () => {
  if (hasLoggedResendNotConfiguredWarning) {
    return;
  }

  console.warn('⚠️  Resend is selected as email provider but RESEND_API_KEY is missing.');
  hasLoggedResendNotConfiguredWarning = true;
};

// Simple: This gets the preferred email provider.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const getPreferredEmailProvider = () => {
  return String(process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();
};

// Simple: This checks whether resend configured is true.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const isResendConfigured = () => {
  return Boolean(process.env.RESEND_API_KEY);
};

// Check if email service is properly configured
// Simple: This checks whether email configured is true.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

// Create reusable transporter only if configured
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
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
}

const resend = isResendConfigured() ? new Resend(process.env.RESEND_API_KEY) : null;

// Simple: This gets the email from address.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const getEmailFromAddress = () => {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev';
};

// Simple: This sends or records the via resend.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function sendViaResend(to, subject, html) {
  if (!resend || !isResendConfigured()) {
    throw new Error('Resend provider is not configured');
  }

  const response = await resend.emails.send({
    from: getEmailFromAddress(),
    to,
    subject,
    html
  });

  if (response?.error) {
    throw new Error(response.error.message || 'Resend failed to send email');
  }

  return {
    success: true,
    provider: 'resend',
    messageId: response?.data?.id || null
  };
}

/**
 * Send email and log notification
 */
// Simple: This sends or records the email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function sendEmail(to, subject, html, relatedOrderId = null, options = {}) {
  const messageForAudit = options.logMessage || html;
  const preferredProvider = getPreferredEmailProvider();

  if (preferredProvider === 'resend') {
    if (!isResendConfigured()) {
      warnResendNotConfiguredOnce();
    } else {
      try {
        const resendResult = await sendViaResend(to, subject, html);

        await Notification.create({
          RecipientType: 'CUSTOMER',
          RecipientID: null,
          NotificationType: 'EMAIL',
          Subject: subject,
          Message: messageForAudit,
          Status: 'SENT',
          SentAt: new Date(),
          RelatedOrderID: relatedOrderId
        });

        return resendResult;
      } catch (error) {
        console.error(`Resend send error: ${error.message}`);

        if (!isEmailConfigured() || !transporter) {
          throw error;
        }
      }
    }
  }

  // Skip if email service not configured
  if (!transporter || !isEmailConfigured()) {
    warnEmailNotConfiguredOnce();
    console.log(`📧 Email skipped (not configured): ${subject} to ${to}`);
    return {
      success: false,
      skipped: true,
      reason: 'Email service not configured'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"OrderFlow" <${process.env.SMTP_FROM}>`,
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
      Message: messageForAudit,
      Status: 'SENT',
      SentAt: new Date(),
      RelatedOrderID: relatedOrderId
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`Email send error: ${error.message}`);

    // Log failed notification
    try {
      await Notification.create({
        RecipientType: 'CUSTOMER',
        RecipientID: null,
        NotificationType: 'EMAIL',
        Subject: subject,
        Message: messageForAudit,
        Status: 'FAILED',
        ErrorMessage: error.message,
        RelatedOrderID: relatedOrderId
      });
    } catch (dbError) {
      console.error('Failed to log notification error:', dbError.message);
    }

    throw error;
  }
}

/**
 * Send order confirmation email (FR15)
 */
// Simple: This sends or records the order confirmation email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
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
          <p>Thank you for choosing OrderFlow!</p>
        </div>
        <div class="footer">
          <p>OrderFlow | Kalagedihena, Gampaha District, Sri Lanka</p>
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
// Simple: This sends or records the order status update email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
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
          <p>OrderFlow | Kalagedihena, Gampaha District, Sri Lanka</p>
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
// Simple: This sends or records the otp email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
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
          <p>OrderFlow | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html, null, {
    logMessage: '[REDACTED] Sensitive OTP email content'
  });
}

/**
 * Send password reset email (FR27)
 */
// Simple: This sends or records the password reset email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
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
          <p>OrderFlow | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html, null, {
    logMessage: '[REDACTED] Sensitive password reset email content'
  });
}

/**
 * Send welcome email for new customers
 */
// Simple: This sends or records the welcome email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function sendWelcomeEmail(customer) {
  const subject = 'Welcome to OrderFlow!';
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
          <h1>Welcome to OrderFlow!</h1>
        </div>
        <div class="content">
          <p>Dear ${customer.Name},</p>
          <p>Thank you for registering with OrderFlow!</p>
          <p>We're excited to serve you delicious Sri Lankan meals, combo packs, and catering services.</p>
          <p>Start browsing our menu and place your first order today!</p>
          <p>Best regards,<br>The OrderFlow Team</p>
        </div>
        <div class="footer">
          <p>OrderFlow | Kalagedihena, Gampaha District, Sri Lanka</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(customer.Email, subject, html);
}

/**
 * Send critical system alert to admin
 * Used for automated job failures, stock issues, payment problems
 * CRITICAL: Ensures admins are notified of system failures that require manual intervention
 */
// Simple: This sends or records the admin critical alert.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function sendAdminCriticalAlert(alertType, details, errorMessage = null) {
  // Get admin email from environment
  const adminEmails = (process.env.ADMIN_EMAIL || process.env.SMTP_USER || '').split(',').filter(e => e.trim());
  
  if (adminEmails.length === 0) {
    console.error('❌ Cannot send admin alert: No admin email configured (ADMIN_EMAIL env variable)');
    return {
      success: false,
      skipped: true,
      reason: 'No admin email configured'
    };
  }

  const alertTitles = {
    DAILY_STOCK_FAILURE: '🚨 CRITICAL: Daily Stock Creation Failed',
    PAYMENT_FAILURE: '⚠️ Payment Processing Error',
    STOCK_SYNC_FAILURE: '⚠️ Stock Synchronization Failed',
    REFUND_FAILURE: '⚠️ Refund Processing Failed',
    DATABASE_ERROR: '🚨 CRITICAL: Database Error'
  };

  const subject = alertTitles[alertType] || '🚨 System Alert';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Courier New', monospace; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #fff3e0; border: 2px solid #ff9800; }
        .alert-box { background: white; padding: 15px; margin: 15px 0; border-left: 5px solid #d32f2f; }
        .details { background: #f5f5f5; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .action-required { background: #ffeb3b; padding: 10px; margin: 15px 0; font-weight: bold; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
        </div>
        <div class="content">
          <div class="action-required">
            ⚠️ IMMEDIATE ACTION REQUIRED ⚠️
          </div>
          
          <div class="alert-box">
            <h3>Alert Type: ${alertType}</h3>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          </div>
          
          <h3>Details:</h3>
          <div class="details">${details}</div>
          
          ${errorMessage ? `
          <h3>Error Message:</h3>
          <div class="details" style="border-left: 5px solid #d32f2f; color: #d32f2f;">${errorMessage}</div>
          ` : ''}
          
          <div class="alert-box">
            <h3>Recommended Actions:</h3>
            <ul>
              <li>Check system logs for detailed error traces</li>
              <li>Verify database connectivity and permissions</li>
              <li>Check all environment variables are set correctly</li>
              <li>Restart affected services if necessary</li>
              <li>Monitor system for repeated failures</li>
            </ul>
          </div>
          
          <p><strong>This is an automated alert from OrderFlow Online Ordering System.</strong></p>
        </div>
        <div class="footer">
          <p>OrderFlow Operations System</p>
          <p>Server: ${process.env.SERVER_HOST || 'localhost'} | Environment: ${process.env.NODE_ENV || 'development'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all admin emails
  const results = [];
  for (const adminEmail of adminEmails) {
    try {
      const result = await sendEmail(adminEmail.trim(), subject, html);
      results.push({ email: adminEmail, ...result });
    } catch (error) {
      console.error(`Failed to send alert to ${adminEmail}:`, error.message);
      results.push({ email: adminEmail, success: false, error: error.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📧 Admin alert sent: ${successCount}/${adminEmails.length} successful`);

  return {
    success: successCount > 0,
    results
  };
}

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminCriticalAlert
};
