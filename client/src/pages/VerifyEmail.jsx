import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import authService from '../services/authService';

const verificationMessages = {
  INVALID_VERIFICATION_TOKEN: 'This verification link is invalid.',
  VERIFICATION_TOKEN_USED: 'This verification link has already been used.',
  VERIFICATION_TOKEN_EXPIRED: 'This verification link has expired. Enter your email below to request a new one.',
  VERIFICATION_EMAIL_COOLDOWN: 'A verification email was sent recently. Please wait before requesting another.'
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const buildRetryMessage = (result, fallbackMessage) => {
    if (result?.retryAfterSeconds) {
      return `${fallbackMessage} Try again in ${result.retryAfterSeconds} seconds.`;
    }

    return fallbackMessage;
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage(verificationMessages.INVALID_VERIFICATION_TOKEN);
        return;
      }

      const result = await authService.verifyEmail(token);
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully. You can now log in.');
        return;
      }

      setStatus('error');
      setMessage(buildRetryMessage(
        result,
        verificationMessages[result.code] || result.error || 'Verification failed. Please request a new verification email.'
      ));
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage('Enter your email to resend verification.');
      return;
    }

    setResending(true);
    const result = await authService.resendVerificationEmail(email.trim().toLowerCase());
    setResending(false);

    if (result.success) {
      setMessage(result.message || 'Verification email sent. Please check your inbox.');
      return;
    }

    setMessage(buildRetryMessage(
      result,
      verificationMessages[result.code] || result.error || 'Unable to resend verification email.'
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h1>
        <p className="text-sm text-gray-700 mb-6">{message}</p>

        {status === 'loading' && (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button
              type="button"
              className="w-full"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
            Go to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmail;
