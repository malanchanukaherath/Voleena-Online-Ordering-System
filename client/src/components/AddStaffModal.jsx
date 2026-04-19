import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

// Code Review: Function AddStaffModal in client\src\components\AddStaffModal.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/pages/StaffManagement.jsx.
const AddStaffModal = ({ isOpen, onClose, onSubmit, roles }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        roleId: '',
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

    // Code Review: Function handleChange in client\src\components\AddStaffModal.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/components/ImageUpload.jsx.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Code Review: Function validate in client\src\components\AddStaffModal.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/pages/Cart.jsx.
    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        } else if (!/^[+]?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone number';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.roleId) {
            newErrors.roleId = 'Role is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Code Review: Function handleSubmit in client\src\components\AddStaffModal.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/components/payment/StripePaymentModal.jsx.
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                roleId: '',
            });
            setErrors({});
            onClose();
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to create staff member' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;



    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold">Add Staff Member</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@voleena.lk"
                            error={errors.email}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password *
                        </label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min 8 characters"
                            error={errors.password}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Select
                            label="Role"
                            name="roleId"
                            value={formData.roleId}
                            onChange={handleChange}
                            options={roles.map(role => ({ value: role.id, label: role.name }))}
                            error={errors.roleId}
                            disabled={loading}
                            required
                        />
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
                            {loading ? 'Creating...' : 'Create Staff'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaffModal;
