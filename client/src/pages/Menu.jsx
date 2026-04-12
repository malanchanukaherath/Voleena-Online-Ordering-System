import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaSearch, FaTimes, FaTag, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FilterResetButton from '../components/ui/FilterResetButton';
import { categoryService, comboPackService, menuItemService } from '../services/menuService';
import { toast } from 'react-toastify';
import { addToCart } from '../utils/cartStorage';
import { resolveAssetUrl } from '../config/api';

const normalizeItemText = (value) => String(value || '').trim().toLowerCase();

const dedupeDisplayItems = (items) => {
    const seenEntityKeys = new Set();
    const seenSignatures = new Set();

    return items.filter((item) => {
        const itemType = item.type || (item.isCombo ? 'combo' : 'menu');
        const entityId = item.id ?? item.menuItemId ?? item.comboId ?? null;
        const entityKey = entityId !== null ? `${itemType}:${entityId}` : null;
        const signature = [
            itemType,
            normalizeItemText(item.name),
            normalizeItemText(item.description),
            String(item.categoryId ?? item.categoryName ?? ''),
            Number.isFinite(item.price) ? item.price.toFixed(2) : String(item.price ?? ''),
            Number.isFinite(item.originalPrice) ? item.originalPrice.toFixed(2) : String(item.originalPrice ?? ''),
            Number.isFinite(item.discount) ? item.discount.toFixed(2) : String(item.discount ?? ''),
            String(item.stockQuantity ?? ''),
            item.image || ''
        ].join('|');

        if (entityKey && seenEntityKeys.has(entityKey)) {
            return false;
        }

        if (seenSignatures.has(signature)) {
            return false;
        }

        if (entityKey) {
            seenEntityKeys.add(entityKey);
        }
        seenSignatures.add(signature);
        return true;
    });
};

const Menu = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [comboPacks, setComboPacks] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [, setError] = useState(null);

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }
        return resolveAssetUrl(imagePath);
    };

    const fetchMenuItems = useCallback(async ({ showLoading = false } = {}) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await menuItemService.getAll({
                isActive: 'true',
                _: Date.now()
            });

            if (response.success && Array.isArray(response.data)) {
                const transformedItems = response.data.map(item => ({
                    id: item.MenuItemID || item.ItemID,
                    type: 'menu',
                    menuItemId: item.MenuItemID || item.ItemID,
                    name: item.Name,
                    description: item.Description || 'No description available',
                    price: parseFloat(item.Price),
                    categoryId: item.CategoryID || item.category?.CategoryID || null,
                    categoryName: item.category?.Name || 'Other',
                    image: resolveImageUrl(item.ImageURL || item.Image_URL || null),
                    stockQuantity: item.StockQuantity ?? null,
                    isAvailable: item.IsAvailable !== undefined ? !!item.IsAvailable : !!item.IsActive,
                }));

                setMenuItems(dedupeDisplayItems(transformedItems));
                setError(null);
                return;
            }

            throw new Error('Failed to load menu items');
        } catch (fetchError) {
            console.error('Error fetching menu items:', fetchError);
            setError(fetchError.message || 'Failed to load menu items');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    const fetchCombos = useCallback(async () => {
        try {
            const response = await comboPackService.getActive({ _: Date.now() });
            if (response.success && Array.isArray(response.data)) {
                const mapped = response.data.map(combo => ({
                    id: combo.ComboID || combo.ComboPackID,
                    type: 'combo',
                    name: combo.Name,
                    description: combo.Description || 'No description available',
                    price: parseFloat(combo.Price),
                    originalPrice: combo.OriginalPrice ? parseFloat(combo.OriginalPrice) : null,
                    discount: combo.DiscountPercentage ? parseFloat(combo.DiscountPercentage) : 0,
                    image: resolveImageUrl(combo.ImageURL || combo.Image_URL || null),
                    isActive: !!combo.IsActive,
                    scheduleStartDate: combo.ScheduleStartDate,
                    scheduleEndDate: combo.ScheduleEndDate
                }));
                setComboPacks(dedupeDisplayItems(mapped));
                return;
            }

            setComboPacks([]);
        } catch (fetchError) {
            console.error('Error loading combos:', fetchError);
            setComboPacks([]);
        }
    }, []);

    // Load menu items from API
    useEffect(() => {
        let isActive = true;

        const loadInitialMenu = async () => {
            if (!isActive) {
                return;
            }

            await Promise.allSettled([
                fetchMenuItems({ showLoading: true }),
                fetchCombos()
            ]);
        };

        loadInitialMenu();

        const refreshVisibleMenu = async () => {
            if (!isActive || document.hidden) {
                return;
            }

            await Promise.allSettled([
                fetchMenuItems(),
                fetchCombos()
            ]);
        };

        const intervalId = setInterval(refreshVisibleMenu, 15000);
        window.addEventListener('focus', refreshVisibleMenu);
        document.addEventListener('visibilitychange', refreshVisibleMenu);

        return () => {
            isActive = false;
            clearInterval(intervalId);
            window.removeEventListener('focus', refreshVisibleMenu);
            document.removeEventListener('visibilitychange', refreshVisibleMenu);
        };
    }, [fetchCombos, fetchMenuItems]);

    useEffect(() => {
        const fetchCategories = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setCategories([]);
                return;
            }

            try {
                const response = await categoryService.getAll();
                if (response.success && Array.isArray(response.data)) {
                    setCategories(response.data);
                }
            } catch (error) {
                if (error?.response?.status !== 401) {
                    console.warn('Categories not available for menu:', error);
                }
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    const categoryOptions = useMemo(() => {
        const sourceCategories = categories.length > 0
            ? categories.map(cat => ({
                value: String(cat.CategoryID),
                label: cat.Name
            }))
            : Array.from(new Map(menuItems
                .filter(item => item.categoryId && item.categoryName)
                .map(item => [String(item.categoryId), item.categoryName]))
                .entries())
                .map(([value, label]) => ({ value, label }));

        const comboOption = comboPacks.length > 0
            ? [{ value: 'combos', label: 'Combo Packs' }]
            : [];

        return [...sourceCategories, ...comboOption];
    }, [categories, menuItems, comboPacks]);

    // Convert combo packs to menu item format
    const comboMenuItems = useMemo(() => comboPacks.map(combo => ({
        id: combo.id,
        type: 'combo',
        comboId: combo.id,
        name: combo.name,
        description: combo.description,
        price: combo.price,
        originalPrice: combo.originalPrice,
        discount: combo.discount,
        categoryId: null,
        categoryName: 'Combo Packs',
        category: 'combos',
        image: combo.image,
        stockQuantity: null,
        isAvailable: true,
        isCombo: true
    })), [comboPacks]);

    // Combine regular items and combos
    const allItems = useMemo(
        () => dedupeDisplayItems([...menuItems, ...comboMenuItems]),
        [menuItems, comboMenuItems]
    );

    const filteredItems = useMemo(() => allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory
            || (selectedCategory === 'combos' && item.isCombo)
            || (selectedCategory !== 'combos' && String(item.categoryId || '') === selectedCategory);
        return matchesSearch && matchesCategory;
    }), [allItems, searchTerm, selectedCategory]);

    const hasActiveFilters = Boolean(searchTerm || selectedCategory);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
    };

    // Get stock badge info
    const getStockBadge = (item) => {
        if (item.stockQuantity === null || item.stockQuantity === undefined) {
            return null;
        }
        if (item.stockQuantity === 0) {
            return { text: 'Out of Stock', className: 'bg-red-500 text-white' };
        }
        if (item.stockQuantity <= 5) {
            return { text: `Only ${item.stockQuantity} left!`, className: 'bg-yellow-500 text-white' };
        }
        return null;
    };

    const handleAddToCart = (item) => {
        if (!item.isAvailable) {
            toast.error('This item is not available right now');
            return;
        }

        try {
            addToCart({
                id: item.id,
                type: item.type || (item.isCombo ? 'combo' : 'menu'),
                menuItemId: item.menuItemId || null,
                comboId: item.comboId || null,
                name: item.name,
                price: item.price,
                image: item.image || null,
                stockQuantity: item.type === 'menu' ? item.stockQuantity : undefined,
                isAvailable: item.isAvailable
            }, 1);

            toast.success(`✓ ${item.name} added to cart!`);
        } catch (error) {
            toast.error(error.message || 'Unable to add item to cart');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Our Menu</h1>
                <p className="text-gray-600">Browse our delicious selection of food items</p>
                {comboPacks.length > 0 && (
                    <p className="text-sm text-primary-600 mt-2">
                        🎉 {comboPacks.length} special combo pack{comboPacks.length > 1 ? 's' : ''} available now!
                    </p>
                )}
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </div>

                    <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        options={categoryOptions}
                        label="Filter by category"
                        name="category"
                        placeholder="All categories"
                        helperText={categoryOptions.length > 0 ? 'Showing menu items and combo packs' : 'Categories load from available menu items'}
                    />
                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <FilterResetButton
                                onClick={clearFilters}
                                className="w-full justify-center md:w-auto"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Items Grid */}
            {loading ? (
                <LoadingSkeleton type="card" count={8} />
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => {
                        const stockBadge = getStockBadge(item);
                        return (
                            <div
                                key={`${item.type || (item.isCombo ? 'combo' : 'menu')}:${item.id}`}
                                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${!item.isAvailable || item.stockQuantity === 0 ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No image available</span>
                                    )}

                                    {/* Out of Stock Overlay */}
                                    {(item.stockQuantity === 0 || !item.isAvailable) && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-semibold">Out of Stock</span>
                                        </div>
                                    )}

                                    {/* Combo Discount Badge */}
                                    {item.isCombo && item.discount > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                            <FaTag />
                                            {item.discount}% OFF
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {stockBadge && item.stockQuantity > 0 && (
                                        <div className={`absolute top-2 left-2 ${stockBadge.className} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                                            {item.stockQuantity <= 5 && <FaExclamationTriangle />}
                                            {stockBadge.text}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        {item.isCombo && (
                                            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded">COMBO</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                                    {/* Stock Info */}
                                    {!item.isCombo && item.stockQuantity !== null && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            Stock: {item.stockQuantity > 0 ? `${item.stockQuantity} available` : 'Out of stock'}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div>
                                            {item.isCombo && item.originalPrice ? (
                                                <div>
                                                    <span className="text-sm text-gray-400 line-through">
                                                        LKR {item.originalPrice.toFixed(2)}
                                                    </span>
                                                    <span className="text-lg font-bold text-primary-600 ml-2">
                                                        LKR {item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-lg font-bold text-primary-600">
                                                    LKR {item.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={!item.isAvailable || item.stockQuantity === 0}
                                            title={item.stockQuantity === 0 ? 'Out of stock' : 'Add to cart'}
                                            onClick={() => handleAddToCart(item)}
                                        >
                                            {item.stockQuantity === 0 || !item.isAvailable ? 'Unavailable' : 'Add to Cart'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No items found"
                    description="Try a different search, choose all categories, or browse today's available items."
                    action={
                        hasActiveFilters ? (
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <FilterResetButton onClick={clearFilters} />
                                <Button onClick={clearFilters}>Show All Items</Button>
                            </div>
                        ) : null
                    }
                />
            )}
        </div>
    );
};

export default Menu;
