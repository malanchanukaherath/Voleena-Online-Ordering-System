import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCalendar, FaImage } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Toast from '../components/ui/Toast';

const ComboManagement = () => {
    const [combos, setCombos] = useState([
        {
            id: 1,
            name: 'Sunday Special',
            description: 'Rice, curry, and drink',
            price: 750,
            discount: 15,
            startDate: '2024-01-21',
            endDate: '2024-12-31',
            image: null,
            isActive: true
        },
        {
            id: 2,
            name: 'Family Pack',
            description: '2 burgers, fries, 2 drinks',
            price: 1200,
            discount: 20,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            image: null,
            isActive: true
        },
    ]);

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
        image: null,
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [imagePreview, setImagePreview] = useState(null);

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
            isActive: true
        });
        setImagePreview(null);
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
            isActive: combo.isActive
        });
        setImagePreview(combo.image);
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
            // Mock image upload - create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
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

        if (!formData.discount || parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100) {
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const comboData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            discount: parseFloat(formData.discount),
            startDate: formData.startDate,
            endDate: formData.endDate,
            image: formData.image,
            isActive: formData.isActive
        };

        if (editingCombo) {
            // Update existing combo
            setCombos(prev => prev.map(combo =>
                combo.id === editingCombo.id
                    ? { ...combo, ...comboData }
                    : combo
            ));
            setToastMessage('Combo updated successfully!');
        } else {
            // Create new combo
            const newCombo = {
                id: Date.now(),
                ...comboData
            };
            setCombos(prev => [...prev, newCombo]);
            setToastMessage('Combo created successfully!');
        }

        setToastType('success');
        setShowToast(true);
        setShowModal(false);
    };

    const handleDelete = (comboId) => {
        if (confirm('Are you sure you want to delete this combo pack?')) {
            setCombos(prev => prev.filter(c => c.id !== comboId));
            setToastMessage('Combo deleted successfully!');
            setToastType('success');
            setShowToast(true);
        }
    };

    const handleToggleStatus = (comboId) => {
        setCombos(prev => prev.map(combo =>
            combo.id === comboId
                ? { ...combo, isActive: !combo.isActive }
                : combo
        ));
        setToastMessage('Combo status updated!');
        setToastType('success');
        setShowToast(true);
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
                                            onClick={() => handleToggleStatus(combo.id)}
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
                                required
                            />
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

            {/* Export combos to localStorage for customer menu */}
            {typeof window !== 'undefined' && localStorage.setItem('voleena_combos', JSON.stringify(combos.filter(c => c.isActive)))}
        </div>
    );
};

export default ComboManagement;
