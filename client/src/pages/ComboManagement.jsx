import React, { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendar, FaImage } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Toast from '../components/ui/Toast';
import { comboPackService, menuItemService } from '../services/menuService';

const ComboManagement = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [combos, setCombos] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingCombo, setEditingCombo] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [imageFile, setImageFile] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discount: '',
        startDate: '',
        endDate: '',
        image: null,
        isActive: true,
        items: [{ menuItemId: '', quantity: '1' }]
    });

    const [errors, setErrors] = useState({});
    const [imagePreview, setImagePreview] = useState(null);

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        return `${apiBaseUrl}${imagePath}`;
    };

    const mapComboFromApi = (combo) => ({
        id: combo.ComboID || combo.ComboPackID,
        name: combo.Name,
        description: combo.Description || '',
        price: Number(combo.Price) || 0,
        discount: combo.DiscountPercentage ? Number(combo.DiscountPercentage) : 0,
        startDate: combo.ScheduleStartDate,
        endDate: combo.ScheduleEndDate,
        image: resolveImageUrl(combo.ImageURL || combo.Image_URL || null),
        isActive: !!combo.IsActive,
        items: Array.isArray(combo.items)
            ? combo.items.map((item) => ({
                menuItemId: item.MenuItemID || item.menuItem?.ItemID || item.menuItem?.MenuItemID || '',
                quantity: item.Quantity?.toString() || '1',
                name: item.menuItem?.Name || ''
            }))
            : []
    });

    const fetchCombos = async () => {
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
    };

    const fetchMenuItems = async () => {
        try {
            const response = await menuItemService.getAll({ isActive: 'true' });
            if (response.success && Array.isArray(response.data)) {
                const mapped = response.data.map((item) => ({
                    value: item.MenuItemID || item.ItemID,
                    label: item.Name
                }));
                setMenuItems(mapped);
            } else {
                setMenuItems([]);
            }
        } catch (error) {
            console.error('Error loading menu items:', error);
            setMenuItems([]);
        }
    };

    useEffect(() => {
        fetchCombos();
        fetchMenuItems();
    }, []);

    const handleOpenCreate = () => {
        setEditingCombo(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            discount: '',
            startDate: '',
            endDate: '',
            image: null,
            isActive: true,
            items: [{ menuItemId: '', quantity: '1' }]
        });
        setImagePreview(null);
        setImageFile(null);
        setErrors({});
        setShowModal(true);
    };

    const handleOpenEdit = (combo) => {
        setEditingCombo(combo);
        setFormData({
            name: combo.name,
            description: combo.description,
            price: combo.price.toString(),
            discount: combo.discount.toString(),
            startDate: combo.startDate,
            endDate: combo.endDate,
            image: combo.image,
            isActive: combo.isActive,
            items: combo.items.length ? combo.items : [{ menuItemId: '', quantity: '1' }]
        });
        setImagePreview(combo.image);
        setImageFile(null);
        setErrors({});
        setShowModal(true);
    };

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setImageFile(file);
            setFormData(prev => ({ ...prev, image: previewUrl }));
        }
    };

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

    const handleAddItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { menuItemId: '', quantity: '1' }]
        }));
    };

    const handleRemoveItemRow = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, itemIndex) => itemIndex !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Combo name is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Valid price is required';
        }

        if (formData.discount && (parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)) {
            newErrors.discount = 'Discount must be between 0-100%';
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const payload = {
            Name: formData.name.trim(),
            Description: formData.description.trim(),
            Price: parseFloat(formData.price),
            ScheduleStartDate: formData.startDate,
            ScheduleEndDate: formData.endDate,
            IsActive: formData.isActive,
            items: formData.items
                .filter(item => item.menuItemId && Number(item.quantity) >= 1)
                .map(item => ({
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

            if (comboId && imageFile) {
                await comboPackService.uploadImage(comboId, imageFile);
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
    const isComboActiveNow = (combo) => {
        const now = new Date();
        const start = new Date(combo.startDate);
        const end = new Date(combo.endDate);
        return combo.isActive && now >= start && now <= end;
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Combo Pack Management</h1>
                    <p className="text-gray-600">Manage special combo offers and packages</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <FaPlus className="inline mr-2" />Create Combo
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-6 text-gray-600">Loading combo packs...</div>
                ) : combos.length === 0 ? (
                    <div className="p-6 text-gray-600">No combo packs found.</div>
                ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Combo Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {combos.map(combo => (
                            <tr key={combo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        {combo.image && (
                                            <img src={combo.image} alt={combo.name} className="w-12 h-12 rounded object-cover mr-3" />
                                        )}
                                        <div>
                                            <div className="font-medium">{combo.name}</div>
                                            <div className="text-sm text-gray-500">{combo.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">LKR {combo.price}</td>
                                <td className="px-6 py-4">{combo.discount}%</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <FaCalendar className="mr-1" />
                                            {combo.startDate}
                                        </div>
                                        <div className="text-xs text-gray-500">to {combo.endDate}</div>
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
                                value={formData.price}
                                onChange={handleChange}
                                error={errors.price}
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
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
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

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Combo Image
                            </label>
                            <div className="flex items-center gap-4">
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded object-cover" />
                                )}
                                <label className="cursor-pointer">
                                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                        <FaImage />
                                        <span className="text-sm">Choose Image</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Upload an image for this combo pack</p>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
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
