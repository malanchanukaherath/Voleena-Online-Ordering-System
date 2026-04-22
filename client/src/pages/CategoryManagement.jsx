// CODEMAP: FRONTEND_PAGE_CATEGORYMANAGEMENT
// WHAT_THIS_IS: This page renders the CategoryManagement screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/CategoryManagement.jsx
// - Search text: const CategoryManagement
import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import ImageUpload from '../components/ImageUpload';
import { categoryService, menuItemService } from '../services/menuService';
import { resolveAssetUrl } from '../config/api';

// Simple: This shows the category management section.
const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [formData, setFormData] = useState({
        Name: '',
        Description: '',
        ImageURL: '',
        DisplayOrder: 0,
        IsActive: true
    });
    const [errors, setErrors] = useState({});

    const itemCounts = useMemo(() => {
        const counts = new Map();
        menuItems.forEach(item => {
            const categoryId = item.CategoryID || item.category?.CategoryID;
            if (!categoryId) return;
            const key = String(categoryId);
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return counts;
    }, [menuItems]);

    // Simple: This gets the categories.
    const fetchCategories = async () => {
        const response = await categoryService.getAll({ includeInactive: true });
        setCategories(response.data || []);
    };

    // Simple: This gets the menu items.
    const fetchMenuItems = async () => {
        const response = await menuItemService.getAll();
        setMenuItems(response.data || []);
    };

    useEffect(() => {
        // Simple: This gets the data.
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                await Promise.all([fetchCategories(), fetchMenuItems()]);
            } catch (error) {
                console.error('Error loading categories:', error);
                setError(error.response?.data?.error || 'Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Simple: This shows the toast.
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    // Simple: This creates the modal.
    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                Name: category.Name || '',
                Description: category.Description || '',
                ImageURL: category.ImageURL || category.Image_URL || '',
                DisplayOrder: category.DisplayOrder ?? 0,
                IsActive: category.IsActive !== undefined ? category.IsActive : true
            });
        } else {
            setEditingCategory(null);
            setFormData({
                Name: '',
                Description: '',
                ImageURL: '',
                DisplayOrder: 0,
                IsActive: true
            });
        }
        setErrors({});
        setShowModal(true);
    };

    // Simple: This handles close modal logic.
    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            Name: '',
            Description: '',
            ImageURL: '',
            DisplayOrder: 0,
            IsActive: true
        });
        setErrors({});
    };

    // Simple: This checks if the form is correct.
    const validateForm = () => {
        const newErrors = {};

        if (!formData.Name || formData.Name.trim().length < 2) {
            newErrors.Name = 'Name must be at least 2 characters';
        }

        if (formData.DisplayOrder !== '' && Number.isNaN(Number(formData.DisplayOrder))) {
            newErrors.DisplayOrder = 'Display order must be a number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Simple: This handles what happens when submit is triggered.
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        try {
            if (editingCategory) {
                await categoryService.update(editingCategory.CategoryID, formData);
                showToast('Category updated successfully');
            } else {
                await categoryService.create(formData);
                showToast('Category created successfully');
            }

            closeModal();
            await fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            showToast(error.response?.data?.error || 'Failed to save category', 'error');
        }
    };

    // Simple: This handles what happens when toggle active is triggered.
    const handleToggleActive = async (category) => {
        try {
            await categoryService.update(category.CategoryID, { IsActive: !category.IsActive });
            showToast(`Category ${category.IsActive ? 'deactivated' : 'activated'}`);
            await fetchCategories();
        } catch (error) {
            console.error('Error toggling category:', error);
            showToast('Failed to update category', 'error');
        }
    };

    // Simple: This handles what happens when delete is triggered.
    const handleDelete = async (category) => {
        if (!window.confirm(`Deactivate "${category.Name}"?`)) return;

        try {
            await categoryService.delete(category.CategoryID);
            showToast('Category deactivated successfully');
            await fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Failed to delete category', 'error');
        }
    };

    // Simple: This handles what happens when change is triggered.
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (loading) {
        return <LoadingSkeleton type="card" count={6} />;
    }

    if (error) {
        return (
            <EmptyState
                type="error"
                title="Categories unavailable"
                description={error}
            />
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Category Management</h1>
                    <p className="text-gray-600 dark:text-slate-400">Organize menu items into categories</p>
                </div>
                <Button onClick={() => openModal()}>
                    <FaPlus className="inline mr-2" />Add Category
                </Button>
            </div>

            {categories.length === 0 ? (
                <EmptyState
                    title="No categories yet"
                    description="Create your first category to organize menu items."
                    action={<Button onClick={() => openModal()}>Add Category</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(category => (
                        <div key={category.CategoryID} className="card p-6">
                            {(category.ImageURL || category.Image_URL) && (
                                <img
                                    src={resolveAssetUrl(category.ImageURL || category.Image_URL)}
                                    alt={category.Name}
                                    className="w-full h-40 object-cover rounded-md mb-4"
                                />
                            )}
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{category.Name}</h3>
                                    <p className="text-sm text-gray-600 mb-4 dark:text-slate-400">
                                        {category.Description || 'No description provided'}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-2 dark:text-slate-400">
                                        {itemCounts.get(String(category.CategoryID)) || 0} items
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Display order: {category.DisplayOrder ?? 0}</p>
                                </div>
                                <button
                                    onClick={() => handleToggleActive(category)}
                                    className={`${category.IsActive ? 'text-green-600' : 'text-gray-400'} hover:text-green-700`}
                                    title={category.IsActive ? 'Deactivate' : 'Activate'}
                                >
                                    {category.IsActive ? <FaToggleOn size={22} /> : <FaToggleOff size={22} />}
                                </button>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => openModal(category)}>
                                    <FaEdit className="inline mr-1" />Edit
                                </Button>
                                <button
                                    className="px-3 text-red-600 hover:text-red-900"
                                    onClick={() => handleDelete(category)}
                                    title="Deactivate"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showModal} onClose={closeModal} title={editingCategory ? 'Edit Category' : 'Add Category'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        name="Name"
                        value={formData.Name}
                        onChange={handleChange}
                        error={errors.Name}
                        placeholder="Category name"
                    />
                    <Input
                        label="Description"
                        name="Description"
                        value={formData.Description}
                        onChange={handleChange}
                        placeholder="Short description"
                    />

                    <ImageUpload
                        label="Category Image"
                        folder="category"
                        currentImage={formData.ImageURL ? resolveAssetUrl(formData.ImageURL) : null}
                        onUploadComplete={(imageUrl) => setFormData((prev) => ({
                            ...prev,
                            ImageURL: imageUrl || ''
                        }))}
                    />

                    <Input
                        label="Display Order"
                        name="DisplayOrder"
                        type="number"
                        value={formData.DisplayOrder}
                        onChange={handleChange}
                        error={errors.DisplayOrder}
                        placeholder="0"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            name="IsActive"
                            checked={formData.IsActive}
                            onChange={handleChange}
                        />
                        Active
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                        <Button type="submit">{editingCategory ? 'Save Changes' : 'Create Category'}</Button>
                    </div>
                </form>
            </Modal>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: toast.type })}
                />
            )}
        </div>
    );
};

export default CategoryManagement;

