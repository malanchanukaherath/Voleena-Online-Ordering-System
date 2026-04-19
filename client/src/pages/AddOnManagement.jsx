import React, { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { menuItemService } from '../services/menuService';

// Code Review: Function normalizeIdValue in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx.
const normalizeIdValue = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_');

// Code Review: Function AddOnManagement in client\src\pages\AddOnManagement.jsx. Used in: client/src/components/layout/Header.jsx, client/src/components/layout/Sidebar.jsx, client/src/components/ui/LoadingSkeleton.jsx.
const AddOnManagement = () => {
    const [addOns, setAddOns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAddOn, setEditingAddOn] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        addonGroup: '',
        price: 0,
        maxQuantity: 1,
        displayOrder: 0,
        isActive: true
    });
    const [errors, setErrors] = useState({});

    // Code Review: Function fetchAddOns in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx.
    const fetchAddOns = async () => {
        const response = await menuItemService.getAddOnCatalog({ includeInactive: true });
        setAddOns(response.data || []);
    };

    useEffect(() => {
        // Code Review: Function load in client\src\pages\AddOnManagement.jsx. Used in: client/src/components/layout/Header.jsx, client/src/contexts/AuthContext.jsx, client/src/hooks/usePublicSettings.js.
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchAddOns();
            } catch (loadError) {
                console.error('Error loading add-on catalog:', loadError);
                setError(loadError.response?.data?.error || 'Failed to load add-ons');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    // Code Review: Function showToast in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/ComboManagement.jsx.
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    // Code Review: Function openModal in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx.
    const openModal = (addOn = null) => {
        if (addOn) {
            setEditingAddOn(addOn);
            setFormData({
                id: addOn.id || '',
                name: addOn.name || '',
                description: addOn.description || '',
                addonGroup: addOn.addonGroup || '',
                price: Number(addOn.price || 0),
                maxQuantity: Number(addOn.maxQuantity || 1),
                displayOrder: Number(addOn.displayOrder || 0),
                isActive: addOn.isActive !== false
            });
        } else {
            setEditingAddOn(null);
            setFormData({
                id: '',
                name: '',
                description: '',
                addonGroup: '',
                price: 0,
                maxQuantity: 1,
                displayOrder: 0,
                isActive: true
            });
        }
        setErrors({});
        setShowModal(true);
    };

    // Code Review: Function closeModal in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx.
    const closeModal = () => {
        setShowModal(false);
        setEditingAddOn(null);
        setErrors({});
    };

    // Code Review: Function validateForm in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/Checkout.jsx.
    const validateForm = () => {
        const nextErrors = {};
        const safeId = normalizeIdValue(formData.id);
        const safeName = String(formData.name || '').trim();

        if (!editingAddOn) {
            if (!safeId || safeId.length < 2 || safeId.length > 80) {
                nextErrors.id = 'ID must be 2-80 characters';
            } else if (!/^[a-z0-9_-]+$/.test(safeId)) {
                nextErrors.id = 'ID can only contain lowercase letters, numbers, _ and -';
            }
        }

        if (safeName.length < 2) {
            nextErrors.name = 'Name must be at least 2 characters';
        }

        const price = Number(formData.price);
        if (!Number.isFinite(price) || price < 0) {
            nextErrors.price = 'Price must be zero or greater';
        }

        const maxQuantity = Number(formData.maxQuantity);
        if (!Number.isInteger(maxQuantity) || maxQuantity < 1) {
            nextErrors.maxQuantity = 'Max quantity must be at least 1';
        }

        if (String(formData.description || '').length > 255) {
            nextErrors.description = 'Description cannot exceed 255 characters';
        }

        if (String(formData.addonGroup || '').length > 80) {
            nextErrors.addonGroup = 'Group cannot exceed 80 characters';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    // Code Review: Function handleSubmit in client\src\pages\AddOnManagement.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/components/payment/StripePaymentModal.jsx.
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        const payload = {
            name: String(formData.name || '').trim(),
            description: String(formData.description || '').trim(),
            addonGroup: String(formData.addonGroup || '').trim(),
            price: Number(formData.price || 0),
            maxQuantity: Number(formData.maxQuantity || 1),
            displayOrder: Number(formData.displayOrder || 0),
            isActive: !!formData.isActive
        };

        try {
            if (editingAddOn) {
                await menuItemService.updateAddOnCatalogItem(editingAddOn.id, payload);
                showToast('Add-on updated successfully');
            } else {
                await menuItemService.createAddOnCatalogItem({
                    id: normalizeIdValue(formData.id),
                    ...payload
                });
                showToast('Add-on created successfully');
            }

            closeModal();
            await fetchAddOns();
        } catch (saveError) {
            console.error('Save add-on error:', saveError);
            showToast(saveError.response?.data?.error || 'Failed to save add-on', 'error');
        }
    };

    // Code Review: Function handleToggleActive in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/MenuManagement.jsx.
    const handleToggleActive = async (addOn) => {
        try {
            await menuItemService.updateAddOnCatalogItem(addOn.id, { isActive: !addOn.isActive });
            showToast(`Add-on ${addOn.isActive ? 'deactivated' : 'activated'}`);
            await fetchAddOns();
        } catch (toggleError) {
            console.error('Toggle add-on error:', toggleError);
            showToast(toggleError.response?.data?.error || 'Failed to update add-on status', 'error');
        }
    };

    // Code Review: Function handleDeactivate in client\src\pages\AddOnManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx.
    const handleDeactivate = async (addOn) => {
        if (!window.confirm(`Deactivate add-on "${addOn.name}"?`)) {
            return;
        }

        try {
            await menuItemService.deleteAddOnCatalogItem(addOn.id);
            showToast('Add-on deactivated successfully');
            await fetchAddOns();
        } catch (deleteError) {
            console.error('Deactivate add-on error:', deleteError);
            showToast(deleteError.response?.data?.error || 'Failed to deactivate add-on', 'error');
        }
    };

    // Code Review: Function handleChange in client\src\pages\AddOnManagement.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/components/ImageUpload.jsx.
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors((previous) => ({
                ...previous,
                [name]: ''
            }));
        }
    };

    if (loading) {
        return <LoadingSkeleton type="card" count={6} />;
    }

    if (error) {
        return (
            <EmptyState
                type="error"
                title="Add-ons unavailable"
                description={error}
            />
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Add-on Management</h1>
                    <p className="text-gray-600 dark:text-slate-400">Create and manage catalog add-ons used by menu items</p>
                </div>
                <Button onClick={() => openModal()}>
                    <FaPlus className="inline mr-2" />Add Add-on
                </Button>
            </div>

            {addOns.length === 0 ? (
                <EmptyState
                    title="No add-ons yet"
                    description="Create your first add-on to enable configurable extras in checkout."
                    action={<Button onClick={() => openModal()}>Add Add-on</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {addOns.map((addOn) => (
                        <div key={addOn.id} className="bg-white rounded-lg shadow p-6 dark:bg-slate-800 dark:shadow-slate-900/50">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">{addOn.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2 dark:text-slate-400">ID: {addOn.id}</p>
                                    <p className="text-sm text-gray-600 mb-3 dark:text-slate-400">
                                        {addOn.description || 'No description provided'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggleActive(addOn)}
                                    className={`${addOn.isActive ? 'text-green-600' : 'text-gray-400'} hover:text-green-700`}
                                    title={addOn.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {addOn.isActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                </button>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600 dark:text-slate-300">
                                <p>Price: LKR {Number(addOn.price || 0).toFixed(2)}</p>
                                <p>Max Quantity: {Number(addOn.maxQuantity || 1)}</p>
                                <p>Group: {addOn.addonGroup || 'General'}</p>
                                <p>Display Order: {Number(addOn.displayOrder || 0)}</p>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => openModal(addOn)}>
                                    <FaEdit className="inline mr-1" />Edit
                                </Button>
                                <button
                                    className="px-3 text-red-600 hover:text-red-900"
                                    onClick={() => handleDeactivate(addOn)}
                                    title="Deactivate"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingAddOn ? 'Edit Add-on' : 'Add Add-on'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingAddOn && (
                        <Input
                            label="ID"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            error={errors.id}
                            placeholder="example: extra_cheese"
                        />
                    )}

                    <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="Add-on name"
                    />

                    <Input
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        error={errors.description}
                        placeholder="Optional description"
                    />

                    <Input
                        label="Group"
                        name="addonGroup"
                        value={formData.addonGroup}
                        onChange={handleChange}
                        error={errors.addonGroup}
                        placeholder="Optional grouping label"
                    />

                    <Input
                        label="Price (LKR)"
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        error={errors.price}
                    />

                    <Input
                        label="Max Quantity"
                        name="maxQuantity"
                        type="number"
                        step="1"
                        value={formData.maxQuantity}
                        onChange={handleChange}
                        error={errors.maxQuantity}
                    />

                    <Input
                        label="Display Order"
                        name="displayOrder"
                        type="number"
                        step="1"
                        value={formData.displayOrder}
                        onChange={handleChange}
                    />

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={!!formData.isActive}
                            onChange={handleChange}
                        />
                        Active
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                        <Button type="submit">{editingAddOn ? 'Save Changes' : 'Create Add-on'}</Button>
                    </div>
                </form>
            </Modal>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast((previous) => ({ ...previous, show: false }))}
                />
            )}
        </div>
    );
};

export default AddOnManagement;
