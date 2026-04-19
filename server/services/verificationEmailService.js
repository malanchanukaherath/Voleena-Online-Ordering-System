// CODEMAP: BACKEND_SERVICE_VERIFICATIONEMAILSERVICE
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Simple: This gets the from address.
const getFromAddress = () => {
  return process.env.EMAIL_FROM || 'onboarding@resend.dev';
};

// Simple: This checks whether log verification link should happen.
const shouldLogVerificationLink = () => {
  return process.env.NODE_ENV !== 'production' && process.env.EMAIL_VERIFICATION_CONSOLE_LOG !== 'false';
};

// Simple: This sends or records the verification link.
const logVerificationLink = (email, verificationUrl, source = 'generated') => {
  if (!shouldLogVerificationLink()) {
    return;
  }

  console.log(`[DEV][email-verification:${source}] ${email} -> ${verificationUrl}`);
};

// Simple: This checks whether resend sandbox restriction is true.
const isResendSandboxRestriction = (message = '') => {
  return (
    /only send testing emails to your own email address/i.test(message) ||
    /verify a domain/i.test(message)
  );
};

// Simple: This sends or records the email verification link.
async function sendEmailVerificationLink(email, customerName, verificationUrl) {
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production');
    }

    logVerificationLink(email, verificationUrl, 'console_only');
    return {
      success: true,
      provider: 'console'
    };
  }

  const safeName = customerName || 'Customer';
  const ttlMinutes = parseInt(process.env.EMAIL_VERIFICATION_TTL_MINUTES || '30', 10);

  const payload = {
    from: getFromAddress(),
    to: email,
    subject: 'Verify your Voleena Foods account',
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <h2>Welcome to Voleena Foods, ${safeName}!</h2>
        <p>Thanks for creating your account. Please verify your email to activate login.</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 16px; background: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
        </p>
        <p>This link expires in ${ttlMinutes} minutes and can only be used once.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `
  };

  let data;
  let error;

  try {
    const response = await resend.emails.send(payload);
    data = response?.data;
    error = response?.error;
  } catch (sendError) {
    error = sendError;
  }

  if (error) {
    const errorMessage = error.message || 'Failed to send verification email';

    if (process.env.NODE_ENV !== 'production' && isResendSandboxRestriction(errorMessage)) {
      console.warn('Resend sandbox restriction encountered. Falling back to console email log.');
      logVerificationLink(email, verificationUrl, 'sandbox_fallback');

      return {
        success: true,
        provider: 'console',
        reason: 'resend_sandbox_restriction'
      };
    }

    throw new Error(errorMessage);
  }

  logVerificationLink(email, verificationUrl, 'resend_sent');

  return {
    success: true,
    provider: 'resend',
    id: data?.id || null
  };
}

module.exports = {
  sendEmailVerificationLink
};
