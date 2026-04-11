import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaUserPlus } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FilterResetButton from '../components/ui/FilterResetButton';
import AddCustomerModal from '../components/AddCustomerModal';
import { customerApi } from '../services/staffCustomerApi';
import { useAuth } from '../contexts/AuthContext';

const mapAddress = (address = {}) => ({
    AddressID: address.AddressID ?? address.address_id ?? address.id,
    AddressLine1: address.AddressLine1 ?? address.addressLine1 ?? '',
    AddressLine2: address.AddressLine2 ?? address.addressLine2 ?? '',
    City: address.City ?? address.city ?? '',
    District: address.District ?? address.district ?? '',
    PostalCode: address.PostalCode ?? address.postalCode ?? ''
});

const CustomerManagement = () => {
    const { isAdmin } = useAuth();
    const canAdminManageAddress = isAdmin();

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [error, setError] = useState(null);
    const [addressActionLoadingId, setAddressActionLoadingId] = useState(null);
    const [isAddressCreating, setIsAddressCreating] = useState(false);
    const [customerAddresses, setCustomerAddresses] = useState([]);
    const [addressFormErrors, setAddressFormErrors] = useState({});
    const [newAddressData, setNewAddressData] = useState({
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        postalCode: ''
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        isActive: true
    });
    const [editErrors, setEditErrors] = useState({});

    // Fetch customers on mount
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await customerApi.getAll({ limit: 100 });
            setCustomers(data.customers || []);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
            setError(err.response?.data?.error || 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (customerData) => {
        try {
            const result = await customerApi.create(customerData);

            if (result.exists) {
                // Customer already exists
                const existing = result.customer;
                alert(`Customer already exists:\n\nName: ${existing.name}\nPhone: ${existing.phone}\nEmail: ${existing.email || 'N/A'}\nStatus: ${existing.accountStatus}`);
            } else {
                // New customer created
                await fetchCustomers();
                const msg = result.customer.temporaryPassword
                    ? `Customer created!\n\nTemporary Password: ${result.customer.temporaryPassword}\n\nPlease share this with the customer.`
                    : 'Customer created successfully!';

                setToastMessage(msg);
                setToastType('success');
                setShowToast(true);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to create customer';
            throw new Error(errorMsg);
        }
    };

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setEditFormData({
            name: customer.Name,
            email: customer.Email || '',
            phone: customer.Phone,
            isActive: customer.AccountStatus === 'ACTIVE'
        });
        setCustomerAddresses([]);
        setAddressFormErrors({});
        setNewAddressData({
            addressLine1: '',
            addressLine2: '',
            city: '',
            district: '',
            postalCode: ''
        });
        setEditErrors({});
        setShowEditModal(true);

        customerApi.getById(customer.CustomerID)
            .then((data) => {
                const fullCustomer = data.customer || customer;
                const addresses = (fullCustomer.addresses || []).map(mapAddress);
                setSelectedCustomer(fullCustomer);
                setCustomerAddresses(addresses);
            })
            .catch((err) => {
                const message = err?.response?.data?.error || 'Failed to load customer addresses';
                setToastMessage(message);
                setToastType('error');
                setShowToast(true);
            });
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (editErrors[name]) {
            setEditErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateEditForm = () => {
        const newErrors = {};

        if (!editFormData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (editFormData.email && !/\S+@\S+\.\S+/.test(editFormData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!editFormData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        }

        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveEdit = async () => {
        if (!validateEditForm()) return;

        try {
            await customerApi.update(selectedCustomer.CustomerID, {
                name: editFormData.name.trim(),
                email: editFormData.email.trim() || null,
                phone: editFormData.phone.trim(),
                accountStatus: editFormData.isActive ? 'ACTIVE' : 'INACTIVE'
            });

            await fetchCustomers();
            setToastMessage('Customer details updated successfully!');
            setToastType('success');
            setShowToast(true);
            setShowEditModal(false);
            setSelectedCustomer(null);
        } catch (err) {
            setEditErrors({ submit: err.response?.data?.error || 'Failed to update customer' });
        }
    };

    const handleAddressInputChange = (e) => {
        const { name, value } = e.target;
        setNewAddressData((prev) => ({ ...prev, [name]: value }));
        if (addressFormErrors[name]) {
            setAddressFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateAddressPayload = (payload) => {
        const errs = {};
        if (!payload.addressLine1 || !payload.addressLine1.trim()) {
            errs.addressLine1 = 'Address line 1 is required';
        }
        if (!payload.city || !payload.city.trim()) {
            errs.city = 'City is required';
        }
        return errs;
    };

    const handleCreateAddress = async () => {
        if (!selectedCustomer?.CustomerID) return;

        const validation = validateAddressPayload(newAddressData);
        if (Object.keys(validation).length > 0) {
            setAddressFormErrors(validation);
            return;
        }

        try {
            setIsAddressCreating(true);
            const payload = {
                addressLine1: newAddressData.addressLine1.trim(),
                addressLine2: newAddressData.addressLine2.trim() || null,
                city: newAddressData.city.trim(),
                district: newAddressData.district.trim() || null,
                postalCode: newAddressData.postalCode.trim() || null
            };

            const response = await customerApi.addAddress(selectedCustomer.CustomerID, payload);
            const created = mapAddress(response.address || {
                AddressID: response.addressId,
                ...payload
            });

            setCustomerAddresses((prev) => [created, ...prev]);
            setNewAddressData({
                addressLine1: '',
                addressLine2: '',
                city: '',
                district: '',
                postalCode: ''
            });
            setAddressFormErrors({});
            setToastMessage('Address added successfully');
            setToastType('success');
            setShowToast(true);
        } catch (err) {
            setToastMessage(err.response?.data?.error || 'Failed to add address');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsAddressCreating(false);
        }
    };

    const handleExistingAddressChange = (addressId, field, value) => {
        setCustomerAddresses((prev) => prev.map((addr) => {
            if (addr.AddressID !== addressId) return addr;
            return { ...addr, [field]: value };
        }));
    };

    const handleUpdateAddress = async (address) => {
        if (!canAdminManageAddress || !selectedCustomer?.CustomerID || !address?.AddressID) return;

        const payload = {
            addressLine1: address.AddressLine1,
            addressLine2: address.AddressLine2 || null,
            city: address.City,
            district: address.District || null,
            postalCode: address.PostalCode || null
        };

        const validation = validateAddressPayload(payload);
        if (Object.keys(validation).length > 0) {
            setToastMessage('Address line 1 and city are required');
            setToastType('error');
            setShowToast(true);
            return;
        }

        try {
            setAddressActionLoadingId(`update-${address.AddressID}`);
            await customerApi.updateAddress(selectedCustomer.CustomerID, address.AddressID, payload);
            setToastMessage('Address updated successfully');
            setToastType('success');
            setShowToast(true);
        } catch (err) {
            setToastMessage(err.response?.data?.error || 'Failed to update address');
            setToastType('error');
            setShowToast(true);
        } finally {
            setAddressActionLoadingId(null);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!canAdminManageAddress || !selectedCustomer?.CustomerID || !addressId) return;

        const confirmed = window.confirm('Delete this customer address?');
        if (!confirmed) return;

        try {
            setAddressActionLoadingId(`delete-${addressId}`);
            await customerApi.deleteAddress(selectedCustomer.CustomerID, addressId);
            setCustomerAddresses((prev) => prev.filter((addr) => addr.AddressID !== addressId));
            setToastMessage('Address deleted successfully');
            setToastType('success');
            setShowToast(true);
        } catch (err) {
            setToastMessage(err.response?.data?.error || 'Failed to delete address');
            setToastType('error');
            setShowToast(true);
        } finally {
            setAddressActionLoadingId(null);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.Phone?.includes(searchTerm)
    );

    const clearSearch = () => {
        setSearchTerm('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const parsedDate = new Date(dateString);
        if (Number.isNaN(parsedDate.getTime())) return 'N/A';
        return parsedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Customer Management</h1>
                        <p className="text-gray-600">View and manage customer accounts</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <FaUserPlus className="inline mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={FaSearch}
                        />
                    </div>
                    <FilterResetButton
                        onClick={clearSearch}
                        disabled={!searchTerm}
                        label="Clear Search"
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                    <p className="text-3xl font-bold text-primary-600">{customers.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Active Customers</p>
                    <p className="text-3xl font-bold text-green-600">
                        {customers.filter(c => c.AccountStatus === 'ACTIVE').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Email Verified</p>
                    <p className="text-3xl font-bold text-blue-600">
                        {customers.filter(c => c.IsEmailVerified).length}
                    </p>
                </div>
            </div>

            {/* Customers Table */}
            {loading ? (
                <LoadingSkeleton type="table" rows={10} />
            ) : filteredCustomers.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verified
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Join Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.CustomerID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <span className="text-primary-600 font-semibold">
                                                        {customer.Name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{customer.Name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{customer.Email || 'No email'}</div>
                                            <div className="text-xs text-gray-500">{customer.Phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {customer.AccountStatus === 'ACTIVE' ? (
                                                <span className="text-green-600 text-sm">● Active</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">● {customer.AccountStatus}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex flex-col gap-1">
                                                {customer.IsEmailVerified && (
                                                    <span className="text-xs text-green-600">✓ Email</span>
                                                )}
                                                {customer.IsPhoneVerified && (
                                                    <span className="text-xs text-green-600">✓ Phone</span>
                                                )}
                                                {!customer.IsEmailVerified && !customer.IsPhoneVerified && (
                                                    <span className="text-xs text-gray-400">Not verified</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatDate(customer.CreatedAt || customer.createdAt || customer.created_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleEdit(customer)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No customers found"
                    description="No customers match your search criteria"
                    action={
                        <Button onClick={clearSearch}>
                            Clear Search
                        </Button>
                    }
                />
            )}

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddCustomer}
            />

            {/* Edit Customer Modal */}
            {showEditModal && selectedCustomer && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedCustomer(null);
                        setEditErrors({});
                    }}
                    title="Edit Customer Details"
                >
                    <div className="space-y-4">
                        <Input
                            label="Customer Name"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            error={editErrors.name}
                            required
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={editFormData.email}
                            onChange={handleEditChange}
                            error={editErrors.email}
                        />
                        <Input
                            label="Phone Number"
                            type="tel"
                            name="phone"
                            value={editFormData.phone}
                            onChange={handleEditChange}
                            error={editErrors.phone}
                            required
                        />
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={editFormData.isActive}
                                onChange={handleEditChange}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Active Customer
                            </label>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-base font-semibold mb-3">Customer Addresses</h3>

                            <div className="space-y-3 mb-4">
                                {customerAddresses.length === 0 ? (
                                    <p className="text-sm text-gray-500">No saved addresses for this customer.</p>
                                ) : customerAddresses.map((address) => (
                                    <div key={address.AddressID} className="border rounded-md p-3 space-y-2">
                                        <Input
                                            label="Address Line 1"
                                            value={address.AddressLine1}
                                            onChange={(e) => handleExistingAddressChange(address.AddressID, 'AddressLine1', e.target.value)}
                                            disabled={!canAdminManageAddress || !!addressActionLoadingId}
                                        />
                                        <Input
                                            label="Address Line 2"
                                            value={address.AddressLine2 || ''}
                                            onChange={(e) => handleExistingAddressChange(address.AddressID, 'AddressLine2', e.target.value)}
                                            disabled={!canAdminManageAddress || !!addressActionLoadingId}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <Input
                                                label="City"
                                                value={address.City}
                                                onChange={(e) => handleExistingAddressChange(address.AddressID, 'City', e.target.value)}
                                                disabled={!canAdminManageAddress || !!addressActionLoadingId}
                                            />
                                            <Input
                                                label="District"
                                                value={address.District || ''}
                                                onChange={(e) => handleExistingAddressChange(address.AddressID, 'District', e.target.value)}
                                                disabled={!canAdminManageAddress || !!addressActionLoadingId}
                                            />
                                            <Input
                                                label="Postal Code"
                                                value={address.PostalCode || ''}
                                                onChange={(e) => handleExistingAddressChange(address.AddressID, 'PostalCode', e.target.value)}
                                                disabled={!canAdminManageAddress || !!addressActionLoadingId}
                                            />
                                        </div>

                                        {canAdminManageAddress && (
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleUpdateAddress(address)}
                                                    loading={addressActionLoadingId === `update-${address.AddressID}`}
                                                    disabled={!!addressActionLoadingId}
                                                >
                                                    Save Address
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteAddress(address.AddressID)}
                                                    loading={addressActionLoadingId === `delete-${address.AddressID}`}
                                                    disabled={!!addressActionLoadingId}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border rounded-md p-3 space-y-2">
                                <h4 className="font-medium">Add New Address</h4>
                                <Input
                                    label="Address Line 1"
                                    name="addressLine1"
                                    value={newAddressData.addressLine1}
                                    onChange={handleAddressInputChange}
                                    error={addressFormErrors.addressLine1}
                                />
                                <Input
                                    label="Address Line 2"
                                    name="addressLine2"
                                    value={newAddressData.addressLine2}
                                    onChange={handleAddressInputChange}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <Input
                                        label="City"
                                        name="city"
                                        value={newAddressData.city}
                                        onChange={handleAddressInputChange}
                                        error={addressFormErrors.city}
                                    />
                                    <Input
                                        label="District"
                                        name="district"
                                        value={newAddressData.district}
                                        onChange={handleAddressInputChange}
                                    />
                                    <Input
                                        label="Postal Code"
                                        name="postalCode"
                                        value={newAddressData.postalCode}
                                        onChange={handleAddressInputChange}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleCreateAddress}
                                    loading={isAddressCreating}
                                    disabled={isAddressCreating}
                                >
                                    Add Address
                                </Button>
                                {!canAdminManageAddress && (
                                    <p className="text-xs text-gray-500">
                                        Cashier can add address but cannot update or delete customer addresses.
                                    </p>
                                )}
                            </div>
                        </div>

                        {editErrors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {editErrors.submit}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSaveEdit}
                                className="flex-1"
                            >
                                Save Changes
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedCustomer(null);
                                    setEditErrors({});
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Toast Notification */}
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

export default CustomerManagement;
