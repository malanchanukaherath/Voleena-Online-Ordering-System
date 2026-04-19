import React, { useCallback, useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import FilterResetButton from '../components/ui/FilterResetButton';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import ImageUpload from '../components/ImageUpload';
import { menuItemService, categoryService } from '../services/menuService';
import { resolveAssetUrl } from '../config/api';

// Code Review: Function MenuManagement in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/ComboManagement.jsx.
const MenuManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showAddOnModal, setShowAddOnModal] = useState(false);
    const [editingAddOnMenuItem, setEditingAddOnMenuItem] = useState(null);
    const [addOnCatalog, setAddOnCatalog] = useState([]);
    const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
    const [isInheritedAddOns, setIsInheritedAddOns] = useState(false);
    const [loadingAddOnConfig, setLoadingAddOnConfig] = useState(false);
    const [savingAddOnConfig, setSavingAddOnConfig] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        Name: '',
        Description: '',
        Price: '',
        CategoryID: '',
        ImageURL: '',
        IsActive: true
    });

    const [errors, setErrors] = useState({});

    const fetchMenuItems = useCallback(async () => {
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
    }, [categoryFilter, isActiveFilter, searchTerm]);

    const fetchCategories = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchMenuItems();
        fetchCategories();
    }, [fetchMenuItems, fetchCategories]);

    // Code Review: Function showToast in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/ComboManagement.jsx.
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    // Code Review: Function handleOpenModal in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                Name: item.Name,
                Description: item.Description || '',
                Price: item.Price,
                CategoryID: item.CategoryID,
                ImageURL: item.ImageURL || item.Image_URL || '',
                IsActive: item.IsActive
            });
        } else {
            setEditingItem(null);
            setFormData({
                Name: '',
                Description: '',
                Price: '',
                CategoryID: '',
                ImageURL: '',
                IsActive: true
            });
        }
        setErrors({});
        setShowModal(true);
    };

    // Code Review: Function handleCloseModal in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            Name: '',
            Description: '',
            Price: '',
            CategoryID: '',
            ImageURL: '',
            IsActive: true
        });
        setErrors({});
    };

    // Code Review: Function openAddOnModal in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const openAddOnModal = async (item) => {
        setEditingAddOnMenuItem(item);
        setShowAddOnModal(true);
        setLoadingAddOnConfig(true);

        try {
            const response = await menuItemService.getAddOnConfig(item.MenuItemID);
            const payload = response?.data || {};
            const inherited = Boolean(payload.isInherited);
            const explicitIds = Array.isArray(payload.selectedAddOnIds) ? payload.selectedAddOnIds : null;
            const effectiveIds = explicitIds || (Array.isArray(payload.availableAddOns)
                ? payload.availableAddOns.map((entry) => entry.id).filter(Boolean)
                : []);

            setAddOnCatalog(Array.isArray(payload.catalog) ? payload.catalog : []);
            setSelectedAddOnIds(effectiveIds);
            setIsInheritedAddOns(inherited);
        } catch (error) {
            console.error('Error loading add-on config:', error);
            showToast(error.response?.data?.error || 'Failed to load add-on configuration', 'error');
            setShowAddOnModal(false);
            setEditingAddOnMenuItem(null);
        } finally {
            setLoadingAddOnConfig(false);
        }
    };

    // Code Review: Function closeAddOnModal in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const closeAddOnModal = () => {
        setShowAddOnModal(false);
        setEditingAddOnMenuItem(null);
        setAddOnCatalog([]);
        setSelectedAddOnIds([]);
        setIsInheritedAddOns(false);
        setLoadingAddOnConfig(false);
        setSavingAddOnConfig(false);
    };

    // Code Review: Function toggleAddOnSelection in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const toggleAddOnSelection = (addOnId, isSelected) => {
        setSelectedAddOnIds((previous) => {
            if (isSelected) {
                return [...new Set([...previous, addOnId])];
            }

            return previous.filter((entry) => entry !== addOnId);
        });
    };

    // Code Review: Function saveAddOnConfig in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const saveAddOnConfig = async () => {
        if (!editingAddOnMenuItem) {
            return;
        }

        setSavingAddOnConfig(true);
        try {
            await menuItemService.updateAddOnConfig(editingAddOnMenuItem.MenuItemID, selectedAddOnIds);
            showToast('Menu add-ons updated successfully');
            closeAddOnModal();
            fetchMenuItems();
        } catch (error) {
            console.error('Error saving add-on config:', error);
            showToast(error.response?.data?.error || 'Failed to update add-on configuration', 'error');
        } finally {
            setSavingAddOnConfig(false);
        }
    };

    // Code Review: Function resetToInheritedAddOns in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/MenuManagement.jsx.
    const resetToInheritedAddOns = async () => {
        if (!editingAddOnMenuItem) {
            return;
        }

        setSavingAddOnConfig(true);
        try {
            await menuItemService.updateAddOnConfig(editingAddOnMenuItem.MenuItemID, null);
            showToast('Menu add-ons reset to default assignment');
            closeAddOnModal();
            fetchMenuItems();
        } catch (error) {
            console.error('Error resetting add-on config:', error);
            showToast(error.response?.data?.error || 'Failed to reset add-on configuration', 'error');
        } finally {
            setSavingAddOnConfig(false);
        }
    };

    // Code Review: Function validateForm in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/Checkout.jsx.
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

    // Code Review: Function handleSubmit in client\src\pages\MenuManagement.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/components/payment/StripePaymentModal.jsx.
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editingItem) {
                await menuItemService.update(editingItem.MenuItemID, formData);
                showToast('Menu item updated successfully');
            } else {
                await menuItemService.create(formData);
                showToast('Menu item created successfully');
            }

            handleCloseModal();
            fetchMenuItems();
        } catch (error) {
            console.error('Error saving menu item:', error);
            showToast(error.response?.data?.error || 'Failed to save menu item', 'error');
        }
    };

    // Code Review: Function handleToggleActive in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/AddOnManagement.jsx, client/src/pages/CategoryManagement.jsx, client/src/pages/MenuManagement.jsx.
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

    // Code Review: Function handleDelete in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/CategoryManagement.jsx, client/src/pages/ComboManagement.jsx, client/src/pages/MenuManagement.jsx.
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

    // Code Review: Function handleChange in client\src\pages\MenuManagement.jsx. Used in: client/src/components/AddCustomerModal.jsx, client/src/components/AddStaffModal.jsx, client/src/components/ImageUpload.jsx.
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
    const hasActiveFilters = Boolean(searchTerm || categoryFilter || isActiveFilter !== '');

    // Code Review: Function clearFilters in client\src\pages\MenuManagement.jsx. Used in: client/src/pages/Menu.jsx, client/src/pages/MenuManagement.jsx, client/src/pages/OrderHistory.jsx.
    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
        setIsActiveFilter('');
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
                <p className="text-gray-600 dark:text-slate-400">Manage your menu items</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 dark:bg-slate-800 dark:shadow-slate-900/50">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <FilterResetButton
                                onClick={clearFilters}
                                className="w-full justify-center md:w-auto"
                            />
                        </div>
                    )}
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
                        <div key={i} className="bg-white rounded-lg shadow-sm p-6 dark:bg-slate-800">
                            <div className="animate-pulse">
                                <div className="h-48 bg-gray-200 rounded mb-4 dark:bg-slate-700"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-slate-700"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-slate-700"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center dark:bg-slate-800">
                    <p className="text-gray-500 dark:text-slate-400">No menu items found</p>
                    <Button onClick={() => handleOpenModal()} className="mt-4">
                        <FaPlus className="mr-2" /> Add First Menu Item
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.MenuItemID} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-800 dark:shadow-slate-900/50">
                            {(item.ImageURL || item.Image_URL) ? (
                                <img
                                    src={resolveAssetUrl(item.ImageURL || item.Image_URL)}
                                    alt={item.Name}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 flex items-center justify-center dark:bg-slate-700">
                                    <span className="text-gray-400 dark:text-slate-500">No Image</span>
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
                                <p className="text-sm text-gray-600 mb-2 dark:text-slate-400">{item.Description}</p>
                                <p className="text-xl font-bold text-primary-600 mb-2">
                                    LKR {parseFloat(item.Price).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500 mb-4 dark:text-slate-400">
                                    {item.category?.Name || 'Uncategorized'}
                                </p>
                                <p className="text-xs text-gray-500 mb-3 dark:text-slate-400">
                                    Add-ons available: {Array.isArray(item.AvailableAddOns) ? item.AvailableAddOns.length : 0}
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
                                        onClick={() => openAddOnModal(item)}
                                        className="text-primary-700 border-primary-500 hover:bg-primary-50"
                                    >
                                        Add-ons
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
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                            Description
                        </label>
                        <textarea
                            name="Description"
                            value={formData.Description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
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
                        folder="menu"
                        currentImage={formData.ImageURL ? resolveAssetUrl(formData.ImageURL) : null}
                        onUploadComplete={(imageUrl) => setFormData((prev) => ({
                            ...prev,
                            ImageURL: imageUrl || ''
                        }))}
                    />

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="IsActive"
                            checked={formData.IsActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label className="ml-2 text-sm text-gray-700 dark:text-slate-300">
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

            <Modal
                isOpen={showAddOnModal}
                onClose={closeAddOnModal}
                title={editingAddOnMenuItem ? `Configure Add-ons: ${editingAddOnMenuItem.Name}` : 'Configure Add-ons'}
            >
                <div className="space-y-4">
                    {loadingAddOnConfig ? (
                        <p className="text-sm text-gray-500 dark:text-slate-400">Loading add-on configuration...</p>
                    ) : (
                        <>
                            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
                                {isInheritedAddOns
                                    ? 'This menu item currently uses default add-on assignment.'
                                    : 'This menu item has custom add-on assignment.'}
                            </div>

                            {addOnCatalog.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-slate-400">No active add-ons available.</p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                    {addOnCatalog.map((entry) => {
                                        const isSelected = selectedAddOnIds.includes(entry.id);

                                        return (
                                            <label key={entry.id} className="flex items-start gap-3 rounded border border-gray-200 p-3 dark:border-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(event) => toggleAddOnSelection(entry.id, event.target.checked)}
                                                    className="mt-0.5"
                                                />
                                                <span>
                                                    <span className="block text-sm font-medium text-gray-900 dark:text-slate-100">{entry.name}</span>
                                                    <span className="block text-xs text-gray-600 dark:text-slate-300">
                                                        LKR {Number(entry.price || 0).toFixed(2)} each | max {entry.maxQuantity}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={resetToInheritedAddOns} disabled={savingAddOnConfig}>
                                    Use Default
                                </Button>
                                <Button variant="outline" onClick={closeAddOnModal} disabled={savingAddOnConfig}>
                                    Cancel
                                </Button>
                                <Button onClick={saveAddOnConfig} disabled={savingAddOnConfig}>
                                    {savingAddOnConfig ? 'Saving...' : 'Save Add-ons'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
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
