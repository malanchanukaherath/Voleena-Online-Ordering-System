import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import ImageUpload from '../components/ImageUpload';
import { menuItemService, categoryService } from '../services/menuService';
import { resolveAssetUrl } from '../config/api';

const MenuManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [selectedImage, setSelectedImage] = useState(null);

    const [formData, setFormData] = useState({
        Name: '',
        Description: '',
        Price: '',
        CategoryID: '',
        IsActive: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchMenuItems();
        fetchCategories();
    }, [categoryFilter, isActiveFilter, searchTerm]);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const params = {};
            if (categoryFilter) params.categoryId = categoryFilter;
            if (isActiveFilter !== '') params.isActive = isActiveFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await menuItemService.getAll(params);
            setMenuItems(response.data || []);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            showToast('Failed to load menu items', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll();
            const categoryOptions = [
                { value: '', label: 'All Categories' },
                ...(response.data || []).map(cat => ({
                    value: cat.CategoryID,
                    label: cat.Name
                }))
            ];
            setCategories(categoryOptions);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                Name: item.Name,
                Description: item.Description || '',
                Price: item.Price,
                CategoryID: item.CategoryID,
                IsActive: item.IsActive
            });
        } else {
            setEditingItem(null);
            setFormData({
                Name: '',
                Description: '',
                Price: '',
                CategoryID: '',
                IsActive: true
            });
        }
        setSelectedImage(null);
        setErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            Name: '',
            Description: '',
            Price: '',
            CategoryID: '',
            IsActive: true
        });
        setSelectedImage(null);
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.Name || formData.Name.trim().length < 3) {
            newErrors.Name = 'Name must be at least 3 characters';
        }

        if (!formData.Price || parseFloat(formData.Price) <= 0) {
            newErrors.Price = 'Price must be greater than 0';
        }

        if (!formData.CategoryID) {
            newErrors.CategoryID = 'Category is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            let response;
            if (editingItem) {
                response = await menuItemService.update(editingItem.MenuItemID, formData);
                showToast('Menu item updated successfully');
            } else {
                response = await menuItemService.create(formData);
                showToast('Menu item created successfully');
            }

            if (selectedImage && response.data) {
                const itemId = editingItem ? editingItem.MenuItemID : response.data.MenuItemID;
                await menuItemService.uploadImage(itemId, selectedImage);
            }

            handleCloseModal();
            fetchMenuItems();
        } catch (error) {
            console.error('Error saving menu item:', error);
            showToast(error.response?.data?.error || 'Failed to save menu item', 'error');
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await menuItemService.update(item.MenuItemID, { IsActive: !item.IsActive });
            showToast(`Menu item ${!item.IsActive ? 'activated' : 'deactivated'}`);
            fetchMenuItems();
        } catch (error) {
            console.error('Error toggling menu item:', error);
            showToast('Failed to update menu item', 'error');
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Are you sure you want to delete "${item.Name}"?`)) return;

        try {
            await menuItemService.delete(item.MenuItemID);
            showToast('Menu item deleted successfully');
            fetchMenuItems();
        } catch (error) {
            console.error('Error deleting menu item:', error);
            showToast(error.response?.data?.error || 'Failed to delete menu item', 'error');
        }
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

    const filteredItems = menuItems;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
                <p className="text-gray-600">Manage your menu items</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                        <Input
                            label="Search"
                            placeholder="Search menu items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<FaSearch />}
                        />
                    </div>
                    <div>
                        <Select
                            label="Category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={categories}
                        />
                    </div>
                    <div>
                        <Select
                            label="Status"
                            value={isActiveFilter}
                            onChange={(e) => setIsActiveFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'true', label: 'Active' },
                                { value: 'false', label: 'Inactive' }
                            ]}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <Button onClick={() => handleOpenModal()}>
                        <FaPlus className="mr-2" /> Add Menu Item
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                            <div className="animate-pulse">
                                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">No menu items found</p>
                    <Button onClick={() => handleOpenModal()} className="mt-4">
                        <FaPlus className="mr-2" /> Add First Menu Item
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.MenuItemID} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {item.Image_URL ? (
                                <img
                                    src={resolveAssetUrl(item.Image_URL)}
                                    alt={item.Name}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">No Image</span>
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold">{item.Name}</h3>
                                    <button
                                        onClick={() => handleToggleActive(item)}
                                        className={`text-2xl ${item.IsActive ? 'text-green-500' : 'text-gray-400'}`}
                                    >
                                        {item.IsActive ? <FaToggleOn /> : <FaToggleOff />}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{item.Description}</p>
                                <p className="text-xl font-bold text-primary-600 mb-2">
                                    LKR {parseFloat(item.Price).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    {item.category?.Name || 'Uncategorized'}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenModal(item)}
                                        className="flex-1"
                                    >
                                        <FaEdit className="mr-1" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(item)}
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                    >
                                        <FaTrash />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        name="Name"
                        value={formData.Name}
                        onChange={handleChange}
                        error={errors.Name}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="Description"
                            value={formData.Description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            rows="3"
                        />
                    </div>

                    <Input
                        label="Price (LKR)"
                        name="Price"
                        type="number"
                        step="0.01"
                        value={formData.Price}
                        onChange={handleChange}
                        error={errors.Price}
                        required
                    />

                    <Select
                        label="Category"
                        name="CategoryID"
                        value={formData.CategoryID}
                        onChange={handleChange}
                        options={categories.filter(c => c.value !== '')}
                        error={errors.CategoryID}
                        required
                    />

                    <ImageUpload
                        onImageSelect={setSelectedImage}
                        currentImage={editingItem?.Image_URL ? resolveAssetUrl(editingItem.Image_URL) : null}
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="IsActive"
                            checked={formData.IsActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default MenuManagement;
