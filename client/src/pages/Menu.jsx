// CODEMAP: FRONTEND_PAGE_MENU
// WHAT_THIS_IS: This page renders the Menu screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/Menu.jsx
// - Search text: const Menu
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

// Simple: This cleans or formats the item text.
const normalizeItemText = (value) => String(value || '').trim().toLowerCase();

// Simple: This combines or filters the display items.
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

// Simple: This shows the menu section.
const Menu = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [comboPacks, setComboPacks] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [, setError] = useState(null);

    // Simple: This cleans or formats the image url.
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

        // Simple: This gets the initial menu.
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

        // Simple: This handles refresh visible menu logic.
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
        // Simple: This gets the categories.
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

    useEffect(() => {
        // Support direct links like /menu?category=<id> from Home category cards.
        const params = new URLSearchParams(location.search);
        const queryCategory = params.get('category');
        setSelectedCategory(queryCategory || '');
    }, [location.search]);

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

    const selectedCategoryLabel = useMemo(() => {
        if (!selectedCategory) {
            return '';
        }

        return categoryOptions.find((option) => option.value === selectedCategory)?.label || 'Selected category';
    }, [categoryOptions, selectedCategory]);

    const updateCategoryFilter = useCallback((nextCategory) => {
        const categoryValue = nextCategory || '';
        setSelectedCategory(categoryValue);

        // Keep URL and UI filter state aligned for refresh/share/back-forward behavior.
        const params = new URLSearchParams(location.search);
        if (categoryValue) {
            params.set('category', categoryValue);
        } else {
            params.delete('category');
        }

        const nextSearch = params.toString();
        navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
    }, [location.pathname, location.search, navigate]);

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

    // Simple: This removes or clears the filters.
    const clearFilters = () => {
        setSearchTerm('');
        updateCategoryFilter('');
    };

    // Get stock badge info
    // Simple: This gets the stock badge.
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

    // Simple: This handles what happens when add to cart is triggered.
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

            toast.success(`${item.name} added to cart!`);
        } catch (error) {
            toast.error(error.message || 'Unable to add item to cart');
        }
    };

    const handleOpenItemDetails = useCallback((item) => {
        if (!item?.id) {
            return;
        }

        const isCombo = item.isCombo || item.type === 'combo';
        if (isCombo) {
            navigate(`/menu/combo/${item.id}`);
            return;
        }

        navigate(`/menu/${item.id}`);
    }, [navigate]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight dark:text-slate-100">Our Menu</h1>
                <p className="text-gray-500 text-sm mt-1 dark:text-slate-400">Browse our delicious selection of food items</p>
                {comboPacks.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {comboPacks.length} special combo pack{comboPacks.length > 1 ? 's' : ''} available now!
                    </div>
                )}
                {selectedCategory && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-semibold text-primary-700 dark:bg-primary-950/30 dark:border-primary-900/50 dark:text-primary-400">
                            <span>Showing:</span>
                            <span>{selectedCategoryLabel}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateCategoryFilter('')}
                            className="text-xs font-medium text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                            aria-label="Clear selected category"
                        >
                            Clear category
                        </button>
                    </div>
                )}
            </div>

            {/* Search and Filter Bar */}
            <div className="card p-4 mb-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 dark:text-slate-400">
                            Search
                        </label>
                        <div className="relative">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-gray-300 bg-white transition-all duration-150 placeholder-gray-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:hover:border-slate-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded dark:text-slate-500 dark:hover:text-slate-300"
                                    aria-label="Clear search"
                                >
                                    <FaTimes className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    <Select
                        value={selectedCategory}
                        onChange={(e) => updateCategoryFilter(e.target.value)}
                        options={categoryOptions}
                        label="Category"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredItems.map((item) => {
                        const stockBadge = getStockBadge(item);
                        return (
                            <div
                                key={`${item.type || (item.isCombo ? 'combo' : 'menu')}:${item.id}`}
                                className={`card overflow-hidden motion-surface cursor-pointer ${!item.isAvailable || item.stockQuantity === 0 ? 'opacity-60' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleOpenItemDetails(item)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        handleOpenItemDetails(item);
                                    }
                                }}
                            >
                                <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden dark:bg-slate-700">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <span className="text-gray-400 text-sm dark:text-slate-500">No image</span>
                                    )}

                                    {/* Out of Stock Overlay */}
                                    {(item.stockQuantity === 0 || !item.isAvailable) && (
                                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full">Out of Stock</span>
                                        </div>
                                    )}

                                    {/* Combo Discount Badge */}
                                    {item.isCombo && item.discount > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <FaTag className="w-2.5 h-2.5" />
                                            {item.discount}% OFF
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {stockBadge && item.stockQuantity > 0 && (
                                        <div className={`absolute top-2 left-2 ${stockBadge.className} px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                                            {item.stockQuantity <= 5 && <FaExclamationTriangle className="w-2.5 h-2.5" />}
                                            {stockBadge.text}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-1 gap-2">
                                        <h3 className="font-bold text-gray-900 leading-snug text-sm dark:text-slate-100">{item.name}</h3>
                                        {item.isCombo && (
                                            <span className="shrink-0 bg-primary-100 text-primary-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase dark:bg-primary-900/40 dark:text-primary-400">COMBO</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed dark:text-slate-400">{item.description}</p>

                                    {/* Stock Info */}
                                    {!item.isCombo && item.stockQuantity !== null && (
                                        <p className="text-[11px] text-gray-400 mb-2 dark:text-slate-500">
                                            {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div>
                                            {item.isCombo && item.originalPrice ? (
                                                <div>
                                                    <span className="text-xs text-gray-400 line-through dark:text-slate-500">
                                                        LKR {item.originalPrice.toFixed(2)}
                                                    </span>
                                                    <span className="text-sm font-bold text-primary-600 ml-1.5 dark:text-primary-400">
                                                        LKR {item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                                    LKR {item.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={!item.isAvailable || item.stockQuantity === 0}
                                            title={item.stockQuantity === 0 ? 'Out of stock' : 'Add to cart'}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleAddToCart(item);
                                            }}
                                        >
                                            {item.stockQuantity === 0 || !item.isAvailable ? 'N/A' : 'Add'}
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

