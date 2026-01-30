import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { realApi } from '../services/backendApi';

const CustomerRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Customer name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[+]?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Phone number must be 9-15 digits';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await realApi.register({
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password
            });

            setToastMessage('Customer registered successfully!');
            setToastType('success');
            setShowToast(true);

            // Reset form
            setFormData({ name: '', email: '', phone: '', password: '' });

            // Navigate back to cashier dashboard after 2 seconds
            setTimeout(() => {
                navigate('/cashier');
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
            setToastMessage(errorMessage);
            setToastType('error');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Register New Customer</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input
                        label="Customer Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                    <Input
                        label="Phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        helperText="Enter phone number (9-15 digits)"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        helperText="Minimum 8 characters"
                        required
                    />
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            className="flex-1"
                            loading={loading}
                            disabled={loading}
                        >
                            Register Customer
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/cashier')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>

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

export default CustomerRegistration;

