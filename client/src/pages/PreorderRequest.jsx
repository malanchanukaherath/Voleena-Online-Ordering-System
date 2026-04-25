import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { comboPackService, menuItemService } from '../services/menuService';
import { getCustomerProfile } from '../services/profileService';
import { createPreorderRequest } from '../services/preorderRequestApi';

const itemTypeOptions = [
    { value: 'menu', label: 'Menu Item' },
    { value: 'combo', label: 'Combo Pack' },
    { value: 'custom', label: 'Custom Description' }
];

const createEmptyItem = () => ({
    itemType: 'menu',
    itemId: '',
    requestedName: '',
    quantity: 1,
    notes: ''
});

const PreorderRequest = () => {
    const [formData, setFormData] = useState({
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        requestedFor: '',
        requestDetails: ''
    });
    const [items, setItems] = useState([createEmptyItem()]);
    const [menuOptions, setMenuOptions] = useState([]);
    const [comboOptions, setComboOptions] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successRequest, setSuccessRequest] = useState(null);

    useEffect(() => {
        let isActive = true;

        const loadFormDependencies = async () => {
            try {
                const [profileResponse, menuResponse, comboResponse] = await Promise.all([
                    getCustomerProfile(),
                    menuItemService.getAll({ isActive: 'true' }),
                    comboPackService.getActive()
                ]);

                if (!isActive) {
                    return;
                }

                const profile = profileResponse?.data?.data || profileResponse?.data || {};
                setFormData((previous) => ({
                    ...previous,
                    contactName: profile.Name || '',
                    contactPhone: profile.Phone || '',
                    contactEmail: profile.Email || ''
                }));

                setMenuOptions((Array.isArray(menuResponse?.data) ? menuResponse.data : [])
                    .map((item) => ({
                        value: String(item.MenuItemID || item.ItemID),
                        label: item.Name
                    })));

                setComboOptions((Array.isArray(comboResponse?.data) ? comboResponse.data : [])
                    .map((item) => ({
                        value: String(item.ComboID || item.ComboPackID),
                        label: item.Name
                    })));
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadFormDependencies();

        return () => {
            isActive = false;
        };
    }, []);

    const minRequestedFor = useMemo(
        () => new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16),
        []
    );

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const updateItem = (index, updates) => {
        setItems((previous) => previous.map((item, itemIndex) => (
            itemIndex === index ? { ...item, ...updates } : item
        )));
    };

    const addItem = () => {
        setItems((previous) => [...previous, createEmptyItem()]);
    };

    const removeItem = (index) => {
        setItems((previous) => (
            previous.length === 1
                ? [createEmptyItem()]
                : previous.filter((_, itemIndex) => itemIndex !== index)
        ));
    };

    const buildPayloadItems = () => {
        return items
            .map((item) => {
                const quantity = Number.parseInt(item.quantity, 10) || 0;
                if (quantity < 1) {
                    return null;
                }

                if (item.itemType === 'menu' && item.itemId) {
                    const matchedOption = menuOptions.find((option) => option.value === item.itemId);
                    return {
                        menuItemId: Number.parseInt(item.itemId, 10),
                        requestedName: matchedOption?.label || null,
                        quantity,
                        notes: item.notes.trim() || null
                    };
                }

                if (item.itemType === 'combo' && item.itemId) {
                    const matchedOption = comboOptions.find((option) => option.value === item.itemId);
                    return {
                        comboId: Number.parseInt(item.itemId, 10),
                        requestedName: matchedOption?.label || null,
                        quantity,
                        notes: item.notes.trim() || null
                    };
                }

                if (item.itemType === 'custom' && item.requestedName.trim()) {
                    return {
                        requestedName: item.requestedName.trim(),
                        quantity,
                        notes: item.notes.trim() || null
                    };
                }

                return null;
            })
            .filter(Boolean);
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!formData.contactName.trim()) nextErrors.contactName = 'Contact name is required';
        if (!formData.contactPhone.trim()) nextErrors.contactPhone = 'Contact phone is required';
        if (!formData.contactEmail.trim()) nextErrors.contactEmail = 'Contact email is required';
        if (!formData.requestedFor) {
            nextErrors.requestedFor = 'Requested date and time is required';
        } else {
            const parsedRequestedFor = new Date(formData.requestedFor);
            if (Number.isNaN(parsedRequestedFor.getTime())) {
                nextErrors.requestedFor = 'Requested date and time is invalid';
            } else if (parsedRequestedFor.getTime() < Date.now() + 15 * 60 * 1000) {
                nextErrors.requestedFor = 'Requested date and time must be at least 15 minutes in the future';
            }
        }
        if (!formData.requestDetails.trim()) nextErrors.requestDetails = 'Request details are required';

        items.forEach((item, index) => {
            if (!Number.parseInt(item.quantity, 10) || Number.parseInt(item.quantity, 10) < 1) {
                nextErrors[`item-${index}-quantity`] = 'Quantity must be at least 1';
            }

            if (item.itemType === 'menu' && !item.itemId && (item.notes.trim() || item.requestedName.trim())) {
                nextErrors[`item-${index}-itemId`] = 'Choose a menu item';
            }

            if (item.itemType === 'combo' && !item.itemId && (item.notes.trim() || item.requestedName.trim())) {
                nextErrors[`item-${index}-itemId`] = 'Choose a combo pack';
            }

            if (item.itemType === 'custom' && !item.requestedName.trim() && item.notes.trim()) {
                nextErrors[`item-${index}-requestedName`] = 'Describe the custom item';
            }
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await createPreorderRequest({
                contactName: formData.contactName.trim(),
                contactPhone: formData.contactPhone.trim(),
                contactEmail: formData.contactEmail.trim(),
                requestedFor: new Date(formData.requestedFor).toISOString(),
                requestDetails: formData.requestDetails.trim(),
                items: buildPayloadItems()
            });

            const createdRequest = response.data?.data || null;
            setSuccessRequest(createdRequest);
            setErrors({});
            setItems([createEmptyItem()]);
            setFormData((previous) => ({
                ...previous,
                requestedFor: '',
                requestDetails: ''
            }));
        } catch (error) {
            setErrors((previous) => ({
                ...previous,
                submit: error.response?.data?.message || error.message || 'Failed to submit preorder request'
            }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Preorder Request</h1>
                    <p className="text-gray-600 dark:text-slate-400">
                        Send a separate preorder request for future dates, large quantities, or custom needs without entering checkout.
                    </p>
                </div>
                <Link to="/orders">
                    <Button variant="outline">View My Orders & Requests</Button>
                </Link>
            </div>

            {successRequest && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
                    Preorder request <span className="font-semibold">{successRequest.RequestNumber}</span> was submitted successfully.
                    Admin can now review your requested items, schedule, and details outside the normal checkout flow.
                </div>
            )}

            {errors.submit && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                    {errors.submit}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Contact Snapshot</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="Contact Name"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleFieldChange}
                                    error={errors.contactName}
                                    required
                                    disabled={loading}
                                />
                                <Input
                                    label="Contact Phone"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleFieldChange}
                                    error={errors.contactPhone}
                                    required
                                    disabled={loading}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Contact Email"
                                        name="contactEmail"
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={handleFieldChange}
                                        error={errors.contactEmail}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                            <Input
                                label="Requested Date & Time"
                                name="requestedFor"
                                type="datetime-local"
                                value={formData.requestedFor}
                                onChange={handleFieldChange}
                                error={errors.requestedFor}
                                min={minRequestedFor}
                                required
                                disabled={loading}
                            />
                            <div className="mt-4">
                                <Textarea
                                    label="What do you need?"
                                    name="requestDetails"
                                    value={formData.requestDetails}
                                    onChange={handleFieldChange}
                                    error={errors.requestDetails}
                                    placeholder="Describe quantities, event details, preferred packing, delivery/takeaway preference, timing expectations, and anything else admin should review."
                                    rows={5}
                                    maxLength={1200}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold">Optional Requested Items</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Add menu items, combo packs, or custom item descriptions if you already know what you want.
                                    </p>
                                </div>
                                <Button type="button" variant="outline" onClick={addItem}>
                                    Add Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => {
                                    const isCustom = item.itemType === 'custom';
                                    const selectOptions = item.itemType === 'combo' ? comboOptions : menuOptions;

                                    return (
                                        <div key={`preorder-item-${index}`} className="rounded-xl border border-gray-200 p-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                                <Select
                                                    label="Item Type"
                                                    value={item.itemType}
                                                    onChange={(event) => updateItem(index, {
                                                        itemType: event.target.value,
                                                        itemId: '',
                                                        requestedName: ''
                                                    })}
                                                    options={itemTypeOptions}
                                                    disabled={loading}
                                                />
                                                {isCustom ? (
                                                    <Input
                                                        label="Custom Item"
                                                        value={item.requestedName}
                                                        onChange={(event) => updateItem(index, { requestedName: event.target.value })}
                                                        error={errors[`item-${index}-requestedName`]}
                                                        placeholder="Example: 50 mini meal packs"
                                                        disabled={loading}
                                                    />
                                                ) : (
                                                    <Select
                                                        label={item.itemType === 'combo' ? 'Combo Pack' : 'Menu Item'}
                                                        value={item.itemId}
                                                        onChange={(event) => updateItem(index, { itemId: event.target.value })}
                                                        options={selectOptions}
                                                        error={errors[`item-${index}-itemId`]}
                                                        disabled={loading}
                                                    />
                                                )}
                                                <Input
                                                    label="Quantity"
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(event) => updateItem(index, { quantity: event.target.value })}
                                                    error={errors[`item-${index}-quantity`]}
                                                    disabled={loading}
                                                />
                                                <div className="flex items-end">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="w-full"
                                                        onClick={() => removeItem(index)}
                                                        disabled={loading}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <Textarea
                                                    label="Item Notes"
                                                    value={item.notes}
                                                    onChange={(event) => updateItem(index, { notes: event.target.value })}
                                                    placeholder="Preferred portioning, flavour notes, packaging, or substitutions for this item."
                                                    rows={3}
                                                    maxLength={300}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                            <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                            <div className="space-y-3 text-sm text-gray-600 dark:text-slate-400">
                                <p>Your preorder request goes to admin separately from checkout.</p>
                                <p>It will not reserve stock, create payment, or enter the kitchen and delivery workflow yet.</p>
                                <p>Admin can review your details, requested items, and contact snapshot clearly before responding.</p>
                            </div>
                            <div className="mt-6 border-t border-gray-100 pt-4">
                                <Button type="submit" className="w-full" size="lg" disabled={submitting || loading}>
                                    {submitting ? 'Submitting Request...' : 'Submit Preorder Request'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PreorderRequest;
