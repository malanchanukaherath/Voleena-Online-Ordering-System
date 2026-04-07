import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaClipboardList, FaMapMarkedAlt } from 'react-icons/fa';
import { getOrders } from '../services/orderApi';
import {
    getCustomerProfile,
    updateCustomerProfile,
    changeCustomerPassword,
    getCustomerAddresses,
    createCustomerAddress,
    deleteCustomerAddress
} from '../services/profileService';

const NOTIFICATION_OPTIONS = ['EMAIL', 'SMS', 'BOTH'];

const mapCustomerProfile = (profile = {}) => {
    const name = profile.Name ?? profile.name ?? '';
    const email = profile.Email ?? profile.email ?? '';
    const phone = profile.Phone ?? profile.phone ?? '';
    const preferredNotification = String(
        profile.PreferredNotification ?? profile.preferredNotification ?? 'BOTH'
    ).toUpperCase();
    const createdAt = profile.createdAt ?? profile.created_at ?? null;

    return {
        name,
        email,
        phone,
        preferredNotification: NOTIFICATION_OPTIONS.includes(preferredNotification) ? preferredNotification : 'BOTH',
        createdAt
    };
};

const getApiErrorMessage = (error, fallback) => {
    return error?.response?.data?.error || fallback;
};

const mapAddress = (address = {}) => ({
    id: address.AddressID ?? address.address_id ?? address.id,
    addressLine1: address.AddressLine1 ?? address.addressLine1 ?? '',
    addressLine2: address.AddressLine2 ?? address.addressLine2 ?? '',
    city: address.City ?? address.city ?? '',
    postalCode: address.PostalCode ?? address.postal_code ?? address.postalCode ?? '',
    district: address.District ?? address.district ?? '',
    latitude: address.Latitude ?? address.latitude ?? null,
    longitude: address.Longitude ?? address.longitude ?? null
});

const Profile = () => {
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        preferredNotification: user?.preferredNotification || 'BOTH'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [addressForm, setAddressForm] = useState({
        addressLine1: '',
        addressLine2: '',
        city: '',
        postalCode: '',
        district: ''
    });

    const [errors, setErrors] = useState({});
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const [isAddressSaving, setIsAddressSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [addresses, setAddresses] = useState([]);

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

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddressForm((prev) => ({ ...prev, [name]: value }));
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

        if (!NOTIFICATION_OPTIONS.includes(formData.preferredNotification)) {
            newErrors.preferredNotification = 'Please select a valid notification preference';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordForm = () => {
        const newErrors = {};
        if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (passwordData.currentPassword && passwordData.newPassword && passwordData.currentPassword === passwordData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateAddressForm = () => {
        const newErrors = {};

        if (!addressForm.addressLine1.trim()) {
            newErrors.addressLine1 = 'Address line 1 is required';
        } else if (addressForm.addressLine1.trim().length < 5) {
            newErrors.addressLine1 = 'Address line 1 must be at least 5 characters';
        }

        if (!addressForm.city.trim()) {
            newErrors.city = 'City is required';
        }

        setErrors((prev) => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const loadAddresses = async () => {
        setIsAddressLoading(true);

        try {
            const response = await getCustomerAddresses();
            const rows = response.data?.data || [];
            setAddresses(rows.map(mapAddress));
        } catch (error) {
            const message = getApiErrorMessage(error, 'Failed to load addresses');
            if (message.toLowerCase().includes('address features are temporarily unavailable')) {
                setAddresses([]);
            } else {
                setToastMessage(message);
                setToastType('error');
                setShowToast(true);
            }
        } finally {
            setIsAddressLoading(false);
        }
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        if (!validateAddressForm()) return;

        setIsAddressSaving(true);

        try {
            await createCustomerAddress({
                addressLine1: addressForm.addressLine1.trim(),
                addressLine2: addressForm.addressLine2.trim() || null,
                city: addressForm.city.trim(),
                postalCode: addressForm.postalCode.trim() || null,
                district: addressForm.district.trim() || null
            });

            setAddressForm({
                addressLine1: '',
                addressLine2: '',
                city: '',
                postalCode: '',
                district: ''
            });

            setToastMessage('Address added successfully');
            setToastType('success');
            setShowToast(true);

            await loadAddresses();
        } catch (error) {
            setToastMessage(getApiErrorMessage(error, 'Failed to add address. Please try again.'));
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsAddressSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!addressId) return;

        const confirmed = window.confirm('Are you sure you want to delete this address?');
        if (!confirmed) return;

        try {
            await deleteCustomerAddress(addressId);
            setAddresses((prev) => prev.filter((address) => address.id !== addressId));
            setToastMessage('Address deleted successfully');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            setToastMessage(getApiErrorMessage(error, 'Failed to delete address. Please try again.'));
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!validateProfileForm()) return;

        setIsProfileSaving(true);

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                preferredNotification: formData.preferredNotification
            };

            const response = await updateCustomerProfile(payload);
            const mappedProfile = mapCustomerProfile(response.data?.data || payload);

            setFormData((prev) => ({
                ...prev,
                name: mappedProfile.name,
                email: mappedProfile.email,
                phone: mappedProfile.phone,
                preferredNotification: mappedProfile.preferredNotification
            }));

            if (updateUser) {
                updateUser({
                    name: mappedProfile.name,
                    email: mappedProfile.email,
                    phone: mappedProfile.phone,
                    preferredNotification: mappedProfile.preferredNotification,
                    ...(mappedProfile.createdAt ? { createdAt: mappedProfile.createdAt } : {})
                });
            }

            setToastMessage(response.data?.message || 'Profile updated successfully!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            setToastMessage(getApiErrorMessage(error, 'Failed to update profile. Please try again.'));
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;

        setIsPasswordSaving(true);

        try {
            const response = await changeCustomerPassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setToastMessage(response.data?.message || 'Password updated successfully');
            setToastType('success');
            setShowToast(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setToastMessage(getApiErrorMessage(error, 'Failed to update password. Please try again.'));
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        memberSince: '—'
    });

    useEffect(() => {
        const localUserProfile = mapCustomerProfile(user || {});
        setFormData((prev) => ({
            ...prev,
            name: localUserProfile.name,
            email: localUserProfile.email,
            phone: localUserProfile.phone,
            preferredNotification: localUserProfile.preferredNotification
        }));
    }, [user]);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                setIsProfileLoading(true);
                const response = await getCustomerProfile();
                const profile = mapCustomerProfile(response.data?.data || {});

                if (!isMounted) return;

                setFormData((prev) => ({
                    ...prev,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    preferredNotification: profile.preferredNotification
                }));

                if (updateUser) {
                    updateUser({
                        name: profile.name,
                        email: profile.email,
                        phone: profile.phone,
                        preferredNotification: profile.preferredNotification,
                        ...(profile.createdAt ? { createdAt: profile.createdAt } : {})
                    });
                }
            } catch (error) {
                if (!isMounted) return;

                setToastMessage(getApiErrorMessage(error, 'Failed to load profile data. Showing saved account details.'));
                setToastType('error');
                setShowToast(true);
            } finally {
                if (isMounted) {
                    setIsProfileLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [updateUser]);

    useEffect(() => {
        loadAddresses();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadStats = async () => {
            try {
                const response = await getOrders();
                const orders = response.data?.data || response.data || [];
                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0), 0);

                if (isMounted) {
                    const memberSinceDate = user?.createdAt || user?.created_at;
                    setStats({
                        totalOrders,
                        totalSpent,
                        memberSince: memberSinceDate ? new Date(memberSinceDate).toLocaleDateString() : '—'
                    });
                }
            } catch {
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
                    {isProfileLoading && (
                        <p className="text-sm text-gray-500 mb-4">Loading profile...</p>
                    )}
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Notification</label>
                            <select
                                name="preferredNotification"
                                value={formData.preferredNotification}
                                onChange={handleChange}
                                className={`
                                    block w-full px-3 py-2 border rounded-md shadow-sm
                                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                                    ${errors.preferredNotification ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
                                `}
                            >
                                <option value="BOTH">Email and SMS</option>
                                <option value="EMAIL">Email only</option>
                                <option value="SMS">SMS only</option>
                            </select>
                            {errors.preferredNotification && (
                                <p className="mt-1 text-sm text-red-600">{errors.preferredNotification}</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            loading={isProfileSaving}
                            disabled={isProfileSaving || isProfileLoading}
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
                        <Button type="submit" className="w-full" loading={isPasswordSaving} disabled={isPasswordSaving}>
                            Update Password
                        </Button>
                    </form>
                </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaMapMarkedAlt className="text-primary-600" />
                        Saved Addresses
                    </h2>
                </div>

                {isAddressLoading ? (
                    <p className="text-sm text-gray-500 mb-4">Loading addresses...</p>
                ) : addresses.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">No saved addresses yet.</p>
                ) : (
                    <div className="space-y-3 mb-6">
                        {addresses.map((address) => (
                            <div key={address.id || `${address.addressLine1}-${address.city}`} className="border border-gray-200 rounded-md p-4">
                                <p className="font-medium text-gray-800">{address.addressLine1}</p>
                                {address.addressLine2 && <p className="text-sm text-gray-600">{address.addressLine2}</p>}
                                <p className="text-sm text-gray-600">
                                    {[address.city, address.district, address.postalCode].filter(Boolean).join(', ')}
                                </p>
                                {!!address.id && (
                                    <div className="mt-3">
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteAddress(address.id)}
                                        >
                                            Delete Address
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
                <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            label="Address Line 1"
                            name="addressLine1"
                            value={addressForm.addressLine1}
                            onChange={handleAddressChange}
                            error={errors.addressLine1}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Input
                            label="Address Line 2 (Optional)"
                            name="addressLine2"
                            value={addressForm.addressLine2}
                            onChange={handleAddressChange}
                            error={errors.addressLine2}
                        />
                    </div>
                    <Input
                        label="City"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        error={errors.city}
                        required
                    />
                    <Input
                        label="District (Optional)"
                        name="district"
                        value={addressForm.district}
                        onChange={handleAddressChange}
                        error={errors.district}
                    />
                    <Input
                        label="Postal Code (Optional)"
                        name="postalCode"
                        value={addressForm.postalCode}
                        onChange={handleAddressChange}
                        error={errors.postalCode}
                    />
                    <div className="md:col-span-2">
                        <Button
                            type="submit"
                            className="w-full md:w-auto"
                            loading={isAddressSaving}
                            disabled={isAddressSaving || isAddressLoading}
                        >
                            Save Address
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

export default Profile;

