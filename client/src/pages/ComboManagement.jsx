import React, { useCallback, useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendar } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Toast from '../components/ui/Toast';
import ImageUpload from '../components/ImageUpload';
import { comboPackService, menuItemService } from '../services/menuService';
import { resolveAssetUrl } from '../config/api';

// Simple: This shows the combo management section.
const ComboManagement = () => {
    const [combos, setCombos] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [menuItemPriceLookup, setMenuItemPriceLookup] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingCombo, setEditingCombo] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discount: '',
        startDate: '',
        endDate: '',
        imageUrl: '',
        isActive: true,
        items: [{ menuItemId: '', quantity: '1' }]
    });

    const [errors, setErrors] = useState({});

    const mapComboFromApi = useCallback((combo) => ({
        id: combo.ComboID || combo.ComboPackID,
        name: combo.Name,
        description: combo.Description || '',
        price: Number(combo.Price) || 0,
        discount: Math.max(Number(combo.DiscountPercentage) || 0, 0),
        originalPrice: Math.max(Number(combo.OriginalPrice) || 0, 0),
        startDate: combo.ScheduleStartDate,
        endDate: combo.ScheduleEndDate,
        image: resolveAssetUrl(combo.ImageURL || combo.Image_URL || null),
        isActive: !!combo.IsActive,
        items: Array.isArray(combo.items)
            ? combo.items.map((item) => ({
                menuItemId: item.MenuItemID || item.menuItem?.ItemID || item.menuItem?.MenuItemID || '',
                quantity: item.Quantity?.toString() || '1',
                name: item.menuItem?.Name || ''
            }))
            : []
    }), []);

    const fetchCombos = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await comboPackService.getAll();
            if (response.success && Array.isArray(response.data)) {
                setCombos(response.data.map(mapComboFromApi));
            } else {
                setCombos([]);
            }
        } catch (error) {
            console.error('Error loading combos:', error);
            setCombos([]);
        } finally {
            setIsLoading(false);
        }
    }, [mapComboFromApi]);

    const fetchMenuItems = useCallback(async () => {
        try {
            const response = await menuItemService.getAll({ isActive: 'true' });
            if (response.success && Array.isArray(response.data)) {
                const mapped = response.data.map((item) => ({
                    value: item.MenuItemID || item.ItemID,
                    label: item.Name
                }));
                const priceLookup = response.data.reduce((acc, item) => {
                    const itemId = Number(item.MenuItemID || item.ItemID);
                    const itemPrice = Number(item.Price);
                    if (Number.isInteger(itemId) && Number.isFinite(itemPrice)) {
                        acc[itemId] = itemPrice;
                    }
                    return acc;
                }, {});
                setMenuItems(mapped);
                setMenuItemPriceLookup(priceLookup);
            } else {
                setMenuItems([]);
                setMenuItemPriceLookup({});
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
            setMenuItems([]);
            setMenuItemPriceLookup({});
        }
    }, []);

    const calculateOriginalPrice = useCallback((items) => {
        if (!Array.isArray(items)) {
            return 0;
        }

        return items.reduce((sum, item) => {
            const menuItemId = Number(item.menuItemId);
            const quantity = Number(item.quantity);
            const unitPrice = menuItemPriceLookup[menuItemId];

            if (!Number.isInteger(menuItemId) || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice)) {
                return sum;
            }

            return sum + (unitPrice * quantity);
        }, 0);
    }, [menuItemPriceLookup]);

    useEffect(() => {
        fetchCombos();
        fetchMenuItems();
    }, [fetchCombos, fetchMenuItems]);

    // Simple: This handles what happens when open create is triggered.
    const handleOpenCreate = () => {
        setEditingCombo(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            discount: '',
            startDate: '',
            endDate: '',
            imageUrl: '',
            isActive: true,
            items: [{ menuItemId: '', quantity: '1' }]
        });
        setErrors({});
        setShowModal(true);
    };

    // Simple: This handles what happens when open edit is triggered.
    const handleOpenEdit = (combo) => {
        setEditingCombo(combo);
        setFormData({
            name: combo.name,
            description: combo.description,
            price: combo.price.toString(),
            discount: combo.discount.toString(),
            startDate: combo.startDate,
            endDate: combo.endDate,
            imageUrl: combo.image,
            isActive: combo.isActive,
            items: combo.items.length ? combo.items : [{ menuItemId: '', quantity: '1' }]
        });
        setErrors({});
        setShowModal(true);
    };

    // Simple: This handles what happens when change is triggered.
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Simple: This handles what happens when item change is triggered.
    const handleItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item
            )
        }));
        if (errors.items) {
            setErrors(prev => ({ ...prev, items: '' }));
        }
    };

    // Simple: This handles what happens when add item row is triggered.
    const handleAddItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { menuItemId: '', quantity: '1' }]
        }));
    };

    // Simple: This handles what happens when remove item row is triggered.
    const handleRemoveItemRow = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, itemIndex) => itemIndex !== index)
        }));
    };

    // Simple: This checks if the form is correct.
    const validateForm = () => {
        const newErrors = {};
        const parsedDiscount = formData.discount === '' ? 0 : parseFloat(formData.discount);
        const hasDiscountInValidation = Number.isFinite(parsedDiscount) && parsedDiscount > 0;

        if (!formData.name.trim()) {
            newErrors.name = 'Combo name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!hasDiscountInValidation && (!formData.price || parseFloat(formData.price) <= 0)) {
            newErrors.price = 'Valid price is required';
        }

        if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0 || parsedDiscount >= 100) {
            newErrors.discount = 'Discount must be between 0 and less than 100%';
        }

        if (!newErrors.discount && parsedDiscount > 0) {
            const originalPrice = calculateOriginalPrice(formData.items);
            if (originalPrice <= 0) {
                newErrors.discount = 'Discount requires valid combo items with prices';
            }
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        }

        if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
            newErrors.endDate = 'End date must be after start date';
        }

        const validItems = formData.items.filter(item => item.menuItemId && Number(item.quantity) >= 1);
        if (validItems.length < 2) {
            newErrors.items = 'Combo must include at least 2 items with quantities';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Simple: This handles what happens when submit is triggered.
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const validItems = formData.items.filter(item => item.menuItemId && Number(item.quantity) >= 1);
        const parsedDiscount = formData.discount === '' ? 0 : parseFloat(formData.discount);
        let effectivePrice = parseFloat(formData.price);

        if (Number.isFinite(parsedDiscount) && parsedDiscount > 0) {
            const originalPrice = calculateOriginalPrice(validItems);
            effectivePrice = Number((originalPrice * (1 - (parsedDiscount / 100))).toFixed(2));
        }

        if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
            setErrors((prev) => ({ ...prev, price: 'Calculated combo price must be greater than 0' }));
            return;
        }

        const payload = {
            Name: formData.name.trim(),
            Description: formData.description.trim(),
            Price: effectivePrice,
            ScheduleStartDate: formData.startDate,
            ScheduleEndDate: formData.endDate,
            ImageURL: formData.imageUrl || null,
            IsActive: formData.isActive,
            items: validItems.map(item => ({
                    MenuItemID: Number(item.menuItemId),
                    ItemID: Number(item.menuItemId),
                    Quantity: Number(item.quantity)
                }))
        };

        try {
            let comboId = editingCombo?.id;

            if (editingCombo) {
                await comboPackService.update(comboId, payload);
                setToastMessage('Combo updated successfully!');
            } else {
                const response = await comboPackService.create(payload);
                comboId = response?.data?.ComboID || response?.data?.ComboPackID;
                setToastMessage('Combo created successfully!');
            }

            await fetchCombos();
            setToastType('success');
            setShowToast(true);
            setShowModal(false);
        } catch (error) {
            console.error('Combo save error:', error);
            setToastMessage(error.response?.data?.error || 'Failed to save combo');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Simple: This handles what happens when delete is triggered.
    const handleDelete = async (comboId) => {
        if (!confirm('Are you sure you want to delete this combo pack?')) return;
        try {
            await comboPackService.delete(comboId);
            await fetchCombos();
            setToastMessage('Combo deleted successfully!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            console.error('Combo delete error:', error);
            setToastMessage(error.response?.data?.error || 'Failed to delete combo');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Simple: This handles what happens when toggle status is triggered.
    const handleToggleStatus = async (comboId, nextActive) => {
        try {
            await comboPackService.update(comboId, { IsActive: nextActive });
            await fetchCombos();
            setToastMessage('Combo status updated!');
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            console.error('Combo status error:', error);
            setToastMessage(error.response?.data?.error || 'Failed to update status');
            setToastType('error');
            setShowToast(true);
        }
    };

    // Check if combo is currently active based on dates
    // Simple: This checks whether combo active now is true.
    const isComboActiveNow = (combo) => {
        const now = new Date();
        const start = new Date(combo.startDate);
        const end = new Date(combo.endDate);
        return combo.isActive && now >= start && now <= end;
    };

    const formDiscountValue = formData.discount === '' ? 0 : Number(formData.discount);
    const hasDiscountOverride = Number.isFinite(formDiscountValue) && formDiscountValue > 0;
    const computedOriginalPrice = calculateOriginalPrice(formData.items);
    const computedDiscountedPrice = hasDiscountOverride && computedOriginalPrice > 0
        ? Number((computedOriginalPrice * (1 - (formDiscountValue / 100))).toFixed(2))
        : null;
    const displayPriceValue = computedDiscountedPrice !== null
        ? computedDiscountedPrice.toFixed(2)
        : formData.price;

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Combo Pack Management</h1>
                    <p className="text-gray-600 dark:text-slate-400">Manage special combo offers and packages</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <FaPlus className="inline mr-2" />Create Combo
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-slate-800 dark:shadow-slate-900/50">
                {isLoading ? (
                    <div className="p-6 text-gray-600 dark:text-slate-400">Loading combo packs...</div>
                ) : combos.length === 0 ? (
                    <div className="p-6 text-gray-600 dark:text-slate-400">No combo packs found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-slate-400">Combo Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-slate-400">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-slate-400">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-slate-400">Schedule</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-slate-400">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {combos.map(combo => (
                                    <tr key={combo.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                {combo.image && (
                                                    <img src={combo.image} alt={combo.name} className="w-12 h-12 rounded object-cover mr-3" />
                                                )}
                                                <div>
                                                    <div className="font-medium">{combo.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-slate-400">{combo.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">LKR {combo.price.toFixed(2)}</td>
                                        <td className="px-6 py-4">{combo.discount > 0 ? `${combo.discount.toFixed(2)}%` : '0%'}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="flex items-center text-gray-600 dark:text-slate-400">
                                                    <FaCalendar className="mr-1" />
                                                    {combo.startDate}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-500">to {combo.endDate}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {combo.isActive ? (
                                                    <span className="text-green-600 text-sm">● Active</span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">● Inactive</span>
                                                )}
                                                {isComboActiveNow(combo) && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Live Now</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(combo)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(combo.id, !combo.isActive)}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title={combo.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {combo.isActive ? '⏸' : '▶'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(combo.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editingCombo ? 'Edit Combo Pack' : 'Create Combo Pack'}
                    size="lg"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Combo Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            required
                        />

                        <Textarea
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            error={errors.description}
                            rows={3}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Price (LKR)"
                                name="price"
                                type="number"
                                step="0.01"
                                value={displayPriceValue}
                                onChange={handleChange}
                                error={errors.price}
                                disabled={computedDiscountedPrice !== null}
                                helperText={computedDiscountedPrice !== null
                                    ? `Locked while discount is set. Auto-calculated price: LKR ${computedDiscountedPrice.toFixed(2)}`
                                    : 'Manual combo price when discount is 0%.'}
                                required
                            />

                            <Input
                                label="Discount (%)"
                                name="discount"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.discount}
                                onChange={handleChange}
                                error={errors.discount}
                                helperText="When above 0%, discount recalculates combo price from selected item prices."
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Combo Items
                                </label>
                                <Button type="button" variant="outline" onClick={handleAddItemRow}>
                                    Add Item
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                        <div className="md:col-span-7">
                                            <Select
                                                label="Menu Item"
                                                name={`menuItem-${index}`}
                                                value={item.menuItemId}
                                                onChange={(e) => handleItemChange(index, 'menuItemId', e.target.value)}
                                                options={menuItems}
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <Input
                                                label="Quantity"
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleRemoveItemRow(index)}
                                                className="w-full"
                                                disabled={formData.items.length <= 1}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.items && <p className="mt-2 text-sm text-red-600">{errors.items}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Start Date"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                error={errors.startDate}
                                required
                            />

                            <Input
                                label="End Date"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleChange}
                                error={errors.endDate}
                                required
                            />
                        </div>

                        <ImageUpload
                            label="Combo Image"
                            folder="combo"
                            currentImage={formData.imageUrl}
                            onUploadComplete={(imageUrl) => setFormData((prev) => ({
                                ...prev,
                                imageUrl: imageUrl || ''
                            }))}
                        />

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">
                                Active (visible to customers)
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1">
                                {editingCombo ? 'Update Combo' : 'Create Combo'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
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

export default ComboManagement;
