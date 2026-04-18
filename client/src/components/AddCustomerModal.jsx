import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from './ui/Button';
import Input from './ui/Input';

const AddCustomerModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        postalCode: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!/^[+]?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone number';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        const hasAddressLine1 = !!formData.addressLine1.trim();
        const hasCity = !!formData.city.trim();

        if (hasAddressLine1 !== hasCity) {
            if (!hasAddressLine1) {
                newErrors.addressLine1 = 'Address line 1 is required when city is provided';
            }
            if (!hasCity) {
                newErrors.city = 'City is required when address line 1 is provided';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            const customerData = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                password: formData.password || undefined,
            };

            // Add address if provided
            if (formData.addressLine1 && formData.city) {
                customerData.address = {
                    addressLine1: formData.addressLine1,
                    addressLine2: formData.addressLine2 || null,
                    city: formData.city,
                    district: formData.district || null,
                    postalCode: formData.postalCode || null,
                };
            }

            await onSubmit(customerData);

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                district: '',
                postalCode: '',
            });
            setErrors({});
            onClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to create customer' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold">Register New Customer</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                        disabled={loading}
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Full Name *
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    error={errors.name}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Phone *
                                </label>
                                <Input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0771234567"
                                    error={errors.phone}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Email (Optional)
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    error={errors.email}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Password (Optional)
                                </label>
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Leave blank for auto-generate"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    If not provided, a password will be auto-generated
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Address (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Address Line 1
                                </label>
                                <Input
                                    name="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={handleChange}
                                    placeholder="123 Main Street"
                                    disabled={loading}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Address Line 2
                                </label>
                                <Input
                                    name="addressLine2"
                                    value={formData.addressLine2}
                                    onChange={handleChange}
                                    placeholder="Apartment, suite, etc."
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    City
                                </label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Colombo"
                                    error={errors.city}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    District
                                </label>
                                <Input
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="Colombo"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Postal Code
                                </label>
                                <Input
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    placeholder="10100"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                            {errors.submit}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? 'Creating...' : 'Register Customer'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerModal;
