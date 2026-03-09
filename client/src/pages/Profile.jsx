import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaClipboardList } from 'react-icons/fa';
import { getOrders } from '../services/orderApi';

const Profile = () => {
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateProfileForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!/^[+]?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Phone number must be 9-15 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordForm = () => {
        const newErrors = {};
        if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
        if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
        if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!validateProfileForm()) return;

        setLoading(true);

        try {
            // Note: Backend has no profile update endpoint
            // Using AuthContext updateUser which updates localStorage
            if (updateUser) {
                updateUser({
                    ...user,
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim()
                });
            }

            setToastMessage('Profile updated successfully!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            setToastMessage('Failed to update profile. Please try again.');
            setToastType('error');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;

        // Note: Backend has no password update endpoint
        // This is a UI-only implementation
        setToastMessage('Password change feature requires backend implementation');
        setToastType('error');
        setShowToast(true);

        // Clear form
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        memberSince: '—'
    });

    useEffect(() => {
        let isMounted = true;

        const loadStats = async () => {
            try {
                const response = await getOrders();
                const orders = response.data?.data || response.data || [];
                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0), 0);

                if (isMounted) {
                    setStats({
                        totalOrders,
                        totalSpent,
                        memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'
                    });
                }
            } catch (error) {
                if (isMounted) {
                    setStats((prev) => ({ ...prev }));
                }
            }
        };

        loadStats();

        return () => {
            isMounted = false;
        };
    }, [user]);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-gray-600">Manage your account information and preferences</p>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClipboardList className="w-8 h-8 text-primary-600 mb-2" />
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaUser className="w-8 h-8 text-primary-600 mb-2" />
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold">LKR {stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaUser className="w-8 h-8 text-primary-600 mb-2" />
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="text-2xl font-bold">{stats.memberSince}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            icon={FaUser}
                            required
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={FaEnvelope}
                            required
                        />
                        <Input
                            label="Phone Number"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            icon={FaPhone}
                            required
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            Save Changes
                        </Button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <Input
                            label="Current Password"
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            error={errors.currentPassword}
                            icon={FaLock}
                            required
                        />
                        <Input
                            label="New Password"
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            error={errors.newPassword}
                            icon={FaLock}
                            helperText="Minimum 8 characters"
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            error={errors.confirmPassword}
                            icon={FaLock}
                            required
                        />
                        <Button type="submit" className="w-full">
                            Update Password
                        </Button>
                    </form>
                </div>
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

export default Profile;

