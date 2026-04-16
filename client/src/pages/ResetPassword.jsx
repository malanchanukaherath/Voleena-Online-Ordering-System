import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Toast from '../components/ui/Toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import authService from '../services/authService';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { identifier, userType } = location.state || {};

    const [step, setStep] = useState(1); // 1: Enter OTP, 2: Set new password
    const [formData, setFormData] = useState({
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // OTP expiry timer
    useEffect(() => {
        if (step === 1 && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, step]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleResendOTP = () => {
        setTimeLeft(300);
        const email = identifier?.trim();
        if (!email) return;
        authService.requestPasswordReset(email, userType || 'Customer').then((result) => {
            setToastMessage(result.success
                ? (result.message || 'If the account exists, a new OTP has been sent to your registered contact methods.')
                : (result.error || 'Failed to resend OTP'));
            setToastType(result.success ? 'success' : 'error');
            setShowToast(true);
        });
    };

    const validateOTP = () => {
        const newErrors = {};
        if (!formData.otp.trim()) {
            newErrors.otp = 'OTP is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        if (!validateOTP()) return;
        setIsVerifying(true);
        const result = await authService.verifyResetOTP(identifier, formData.otp, userType || 'Customer');
        setIsVerifying(false);

        if (!result.success) {
            setErrors(prev => ({ ...prev, otp: result.error || 'OTP verification failed' }));
            return;
        }

        setStep(2);
    };

    const validatePassword = () => {
        const newErrors = {};
        if (!formData.newPassword) {
            newErrors.newPassword = 'Password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;
        setIsSubmitting(true);
        const result = await authService.resetPassword(identifier, formData.otp, formData.newPassword, userType || 'Customer');
        setIsSubmitting(false);

        setToastMessage(result.success ? 'Password reset successfully!' : (result.error || 'Password reset failed'));
        setToastType(result.success ? 'success' : 'error');
        setShowToast(true);

        if (result.success) {
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        }
    };

    if (!identifier) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <p className="text-gray-600 mb-4">Invalid reset link</p>
                    <Link to="/forgot-password">
                        <Button>Start Password Reset</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                    <p className="text-gray-600 text-sm">
                        {step === 1 ? 'Enter the OTP sent to your registered contact method' : 'Create a new password'}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleOTPSubmit} className="space-y-6">
                        <div>
                            <Input
                                label="Enter OTP"
                                name="otp"
                                type="text"
                                value={formData.otp}
                                onChange={handleChange}
                                error={errors.otp}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                required
                            />
                            <div className="flex justify-between items-center mt-2 text-sm">
                                <span className={`${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                                    Time remaining: {formatTime(timeLeft)}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    className="text-primary-600 hover:text-primary-700"
                                    disabled={timeLeft > 240}
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full">
                            {isVerifying ? 'Verifying...' : 'Verify OTP'}
                        </Button>

                        <div className="text-center text-sm">
                            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700">
                                ← Back
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div className="relative">
                            <Input
                                label="New Password"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={handleChange}
                                error={errors.newPassword}
                                placeholder="Enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-gray-500"
                                aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <div className="relative">
                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword}
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-9 text-gray-500"
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
                            <p className="font-medium mb-1">Password requirements:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>At least 8 characters long</li>
                                <li>Contains uppercase and lowercase letters</li>
                                <li>Contains at least one number</li>
                            </ul>
                        </div>

                        <Button type="submit" className="w-full">
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                )}
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

export default ResetPassword;
