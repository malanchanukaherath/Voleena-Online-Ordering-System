import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Toast from '../components/ui/Toast';
import authService from '../services/authService';

// Simple: This checks if the account is correct.
const VerifyAccount = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, phone, userType } = location.state || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [isVerifying, setIsVerifying] = useState(false);

    // OTP expiry timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Simple: This cleans or formats the time.
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Simple: This handles what happens when otp change is triggered.
    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    // Simple: This handles what happens when key down is triggered.
    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    // Simple: This handles what happens when paste is triggered.
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
        setOtp(newOtp);

        // Focus last filled input
        const lastIndex = Math.min(pastedData.length, 5);
        document.getElementById(`otp-${lastIndex}`)?.focus();
    };

    // Simple: This handles what happens when resend otp is triggered.
    const handleResendOTP = () => {
        setTimeLeft(300);
        setOtp(['', '', '', '', '', '']);
        if (email) {
            authService.requestPasswordReset(email, userType || 'Customer').then((result) => {
                setToastMessage(result.success ? 'New OTP sent!' : (result.error || 'Failed to resend OTP'));
                setToastType(result.success ? 'success' : 'error');
                setShowToast(true);
            });
        }
    };

    // Simple: This handles what happens when verify is triggered.
    const handleVerify = async () => {
        const enteredOtp = otp.join('');

        if (enteredOtp.length !== 6) {
            setError('Please enter complete 6-digit OTP');
            return;
        }

        setIsVerifying(true);
        const result = await authService.verifyResetOTP(email, enteredOtp, userType || 'Customer');
        setIsVerifying(false);

        if (!result.success) {
            setError(result.error || 'Invalid OTP. Please try again.');
            return;
        }

        setToastMessage('Verification successful!');
        setToastType('success');
        setShowToast(true);

        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    if (!email && !phone) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <p className="text-gray-600 mb-4">Invalid verification link</p>
                    <Link to="/register">
                        <Button>Go to Registration</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verify Your Account</h1>
                    <p className="text-gray-600 text-sm">
                        We've sent a verification code to
                    </p>
                    <p className="font-semibold mt-1">{email || phone}</p>
                </div>

                <div className="space-y-6">
                    {/* OTP Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                            Enter 6-digit code
                        </label>
                        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={`w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${error ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        {error && (
                            <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
                        )}
                    </div>

                    {/* Timer and Resend */}
                    <div className="flex justify-between items-center text-sm">
                        <span className={`${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                            {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP expired'}
                        </span>
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                            disabled={timeLeft > 240}
                        >
                            {timeLeft > 240 ? `Resend in ${formatTime(timeLeft - 240)}` : 'Resend OTP'}
                        </button>
                    </div>

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        className="w-full"
                        disabled={isVerifying || otp.join('').length !== 6}
                    >
                        {isVerifying ? 'Verifying...' : 'Verify Account'}
                    </Button>

                    {/* Help Text */}
                    <div className="text-center text-sm text-gray-600">
                        <p>Didn't receive the code?</p>
                        <p className="mt-1">Check your spam folder or click resend</p>
                    </div>

                    <div className="text-center text-sm">
                        <Link to="/register" className="text-primary-600 hover:text-primary-700">
                            ← Back to Registration
                        </Link>
                    </div>
                </div>
            </Card>

            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default VerifyAccount;
