const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const getFromAddress = () => {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Voleena Foods <noreply@voleenafoods.lk>';
};

async function sendEmailVerificationLink(email, customerName, verificationUrl) {
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is missing in production');
    }

    console.log('DEV email verification link for', email, verificationUrl);
    return {
      success: true,
      provider: 'console'
    };
  }

  const safeName = customerName || 'Customer';
  const ttlMinutes = parseInt(process.env.EMAIL_VERIFICATION_TTL_MINUTES || '30', 10);

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: [email],
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
  });

  if (error) {
    throw new Error(error.message || 'Failed to send verification email');
  }

  return {
    success: true,
    provider: 'resend',
    id: data?.id || null
  };
}

module.exports = {
  sendEmailVerificationLink
};
