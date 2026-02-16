import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Toast from '../components/ui/Toast';
import authService from '../services/authService';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Enter email/phone, 2: Select method
    const [formData, setFormData] = useState({
        identifier: '', // email or phone
        method: 'email' // email or sms
    });
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.identifier.trim()) {
            newErrors.identifier = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier.trim())) {
            newErrors.identifier = 'Enter a valid email address';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleStep1Submit = (e) => {
        e.preventDefault();
        if (!validateStep1()) return;
        setStep(2);
    };

    const handleSendOTP = async () => {
        setLoading(true);
        const email = formData.identifier.trim();
        const result = await authService.requestPasswordReset(email, 'Customer');
        setLoading(false);

        if (!result.success) {
            setToastMessage(result.error || 'Failed to send OTP');
            setToastType('error');
            setShowToast(true);
            return;
        }

        setToastMessage(`OTP sent to your ${formData.method === 'email' ? 'email' : 'phone'}!`);
        setToastType('success');
        setShowToast(true);

        setTimeout(() => {
            navigate('/reset-password', {
                state: {
                    identifier: email,
                    method: formData.method,
                    userType: 'Customer'
                }
            });
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
                    <p className="text-gray-600 text-sm">
                        {step === 1 ? 'Enter your email or phone number' : 'Choose verification method'}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleStep1Submit} className="space-y-6">
                        <Input
                            label="Email Address"
                            name="identifier"
                            type="text"
                            value={formData.identifier}
                            onChange={handleChange}
                            error={errors.identifier}
                            placeholder="email@example.com"
                            required
                        />

                        <Button type="submit" className="w-full">
                            Continue
                        </Button>

                        <div className="text-center text-sm">
                            <Link to="/login" className="text-primary-600 hover:text-primary-700">
                                ← Back to Login
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700">
                                We'll send a verification code to:
                            </p>
                            <p className="font-semibold mt-1">{formData.identifier}</p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Select verification method:</p>

                            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="method"
                                    value="email"
                                    checked={formData.method === 'email'}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <div className="ml-3">
                                    <p className="font-medium">Email Verification</p>
                                    <p className="text-sm text-gray-500">Receive OTP via email</p>
                                </div>
                            </label>

                            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="method"
                                    value="sms"
                                    checked={formData.method === 'sms'}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <div className="ml-3">
                                    <p className="font-medium">SMS Verification</p>
                                    <p className="text-sm text-gray-500">Receive OTP via text message</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleSendOTP}
                                className="flex-1"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </Button>
                        </div>
                    </div>
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

export default ForgotPassword;
