// CODEMAP: FRONTEND_PAGE_MENUITEMDETAIL
// WHAT_THIS_IS: This page renders the MenuItemDetail screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/MenuItemDetail.jsx
// - Search text: const MenuItemDetail
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { addToCart } from '../utils/cartStorage';
import { comboPackService, menuItemService } from '../services/menuService';
import { resolveAssetUrl } from '../config/api';

// Simple: This cleans or formats the detail add on options.
const normalizeDetailAddOnOptions = (entries) => {
    return (Array.isArray(entries) ? entries : [])
        .map((entry) => {
            const id = String(entry?.id || '').trim();
            if (!id) {
                return null;
            }

            const maxQuantity = Number(entry?.maxQuantity);
            return {
                id,
                name: String(entry?.name || id),
                price: Number(entry?.price || 0),
                maxQuantity: Number.isFinite(maxQuantity) && maxQuantity > 0 ? Math.floor(maxQuantity) : 1
            };
        })
        .filter(Boolean);
};

// Simple: This combines or filters the detail add on options.
const intersectDetailAddOnOptions = (collections) => {
    // Simple: This handles safe collections logic.
    const safeCollections = (collections || []).filter((entry) => Array.isArray(entry));
    if (safeCollections.length === 0) {
        return [];
    }

    const [first, ...rest] = safeCollections;
    const accumulator = new Map(
        normalizeDetailAddOnOptions(first).map((entry) => [entry.id, { ...entry }])
    );

    for (const optionList of rest) {
        const currentById = new Map(normalizeDetailAddOnOptions(optionList).map((entry) => [entry.id, entry]));

        for (const [id, normalized] of accumulator.entries()) {
            const matching = currentById.get(id);
            if (!matching) {
                accumulator.delete(id);
                continue;
            }

            normalized.price = Math.min(Number(normalized.price || 0), Number(matching.price || 0));
            normalized.maxQuantity = Math.min(Number(normalized.maxQuantity || 1), Number(matching.maxQuantity || 1));
        }
    }

    return [...accumulator.values()].sort((left, right) => left.id.localeCompare(right.id));
};

// Simple: This shows the menu item detail section.
const MenuItemDetail = () => {
    const { itemId, itemType } = useParams();
    const isComboPath = String(itemType || '').toLowerCase() === 'combo';
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addOnSelections, setAddOnSelections] = useState({});

    const mapMenuItem = useCallback((data) => ({
        id: data.MenuItemID || data.ItemID,
        name: data.Name,
        description: data.Description || 'No description available',
        price: parseFloat(data.Price),
        basePrice: parseFloat(data.Price),
        categoryName: data.category?.Name || 'Other',
        image: resolveAssetUrl(data.ImageURL || data.Image_URL || null),
        stockQuantity: data.StockQuantity ?? null,
        isAvailable: data.IsAvailable !== undefined ? !!data.IsAvailable : !!data.IsActive,
        availableAddOns: Array.isArray(data.AvailableAddOns) ? data.AvailableAddOns.map((entry) => ({
            id: String(entry.id),
            name: String(entry.name || entry.id),
            price: Number(entry.price || 0),
            maxQuantity: Number(entry.maxQuantity || 1)
        })) : []
    }), []);

    const mapComboItem = useCallback((data, availableAddOns = []) => ({
        id: data.ComboID || data.ComboPackID,
        name: data.Name,
        description: data.Description || 'No description available',
        price: parseFloat(data.Price),
        basePrice: parseFloat(data.Price),
        originalPrice: data.OriginalPrice ? parseFloat(data.OriginalPrice) : null,
        discount: data.DiscountPercentage ? parseFloat(data.DiscountPercentage) : 0,
        categoryName: 'Combo Pack',
        image: resolveAssetUrl(data.ImageURL || data.Image_URL || null),
        stockQuantity: null,
        isAvailable: data.IsAvailable !== undefined ? !!data.IsAvailable : true,
        availableAddOns,
        type: 'combo'
    }), []);

    const loadComboAddOnOptions = useCallback(async (comboData) => {
        const comboItems = Array.isArray(comboData?.items) ? comboData.items : [];
        const componentMenuItemIds = [...new Set(
            comboItems
                .map((entry) => entry.MenuItemID || entry.menuItem?.MenuItemID || entry.menuItem?.ItemID)
                .filter(Boolean)
                .map((entry) => String(entry))
        )];

        if (componentMenuItemIds.length === 0) {
            return [];
        }

        const optionCollections = await Promise.all(
            componentMenuItemIds.map(async (menuId) => {
                try {
                    const response = await menuItemService.getById(menuId);
                    return normalizeDetailAddOnOptions(response?.data?.AvailableAddOns);
                } catch {
                    return [];
                }
            })
        );

        return intersectDetailAddOnOptions(optionCollections);
    }, []);

    useEffect(() => {
        let isMounted = true;

        // Simple: This gets the item.
        const fetchItem = async () => {
            setLoading(true);
            setError(null);

            if (isComboPath) {
                try {
                    const comboResponse = await comboPackService.getById(itemId);
                    if (comboResponse.success && comboResponse.data) {
                        const availableAddOns = await loadComboAddOnOptions(comboResponse.data);
                        if (isMounted) {
                            setItem(mapComboItem(comboResponse.data, availableAddOns));
                        }
                        return;
                    }
                    throw new Error('Combo not found');
                } catch {
                    try {
                        const fallbackCombos = await comboPackService.getActive();
                        const foundCombo = fallbackCombos.data?.find(
                            entry => String(entry.ComboID || entry.ComboPackID) === String(itemId)
                        );

                        if (foundCombo && isMounted) {
                            const availableAddOns = await loadComboAddOnOptions(foundCombo);
                            setItem(mapComboItem(foundCombo, availableAddOns));
                            return;
                        }
                    } catch (fallbackError) {
                        if (isMounted) {
                            setError(fallbackError.response?.data?.error || 'Failed to load combo pack');
                        }
                        return;
                    }

                    if (isMounted) {
                        setError('Combo pack not found');
                    }
                    return;
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            }

            try {
                const response = await menuItemService.getById(itemId);
                if (response.success && response.data) {
                    if (isMounted) {
                        setItem(mapMenuItem(response.data));
                    }
                    return;
                }
                throw new Error('Menu item not found');
            } catch {
                try {
                    const fallbackResponse = await menuItemService.getAll();
                    const found = fallbackResponse.data?.find(
                        entry => String(entry.MenuItemID || entry.ItemID) === String(itemId)
                    );
                    if (found && isMounted) {
                        setItem(mapMenuItem(found));
                        return;
                    }
                } catch (fallbackError) {
                    if (isMounted) {
                        setError(fallbackError.response?.data?.error || 'Failed to load menu item');
                    }
                    return;
                }

                if (isMounted) {
                    setError('Menu item not found');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchItem();

        return () => {
            isMounted = false;
        };
    }, [isComboPath, itemId, loadComboAddOnOptions, mapComboItem, mapMenuItem]);

    useEffect(() => {
        setAddOnSelections({});
    }, [item?.id]);

    const availableAddOns = Array.isArray(item?.availableAddOns) ? item.availableAddOns : [];

    const selectedAddOns = availableAddOns
        .filter((entry) => Number(addOnSelections[entry.id] || 0) > 0)
        .map((entry) => {
            const quantity = Number(addOnSelections[entry.id] || 0);
            const unitPrice = Number(entry.price || 0);
            return {
                id: entry.id,
                name: entry.name,
                quantity,
                unitPrice,
                maxQuantity: Number(entry.maxQuantity || 1),
                total: Number((unitPrice * quantity).toFixed(2))
            };
        });

    const addOnsPerUnit = Number(selectedAddOns.reduce((sum, entry) => sum + Number(entry.total || 0), 0).toFixed(2));
    const effectiveUnitPrice = Number((((item?.basePrice || item?.price || 0)) + addOnsPerUnit).toFixed(2));

    // Simple: This updates the add on enabled.
    const setAddOnEnabled = (addOnId, isEnabled) => {
        setAddOnSelections((previous) => {
            const next = { ...previous };
            if (isEnabled) {
                next[addOnId] = Math.max(1, Number(next[addOnId] || 1));
            } else {
                delete next[addOnId];
            }
            return next;
        });
    };

    // Simple: This handles adjust add on quantity logic.
    const adjustAddOnQuantity = (addOnId, requestedQuantity, maxQuantity) => {
        const normalizedMax = Math.max(1, Number(maxQuantity || 1));
        const normalizedNext = Math.min(normalizedMax, Math.max(1, Number(requestedQuantity || 1)));

        setAddOnSelections((previous) => ({
            ...previous,
            [addOnId]: normalizedNext
        }));
    };
    //add to cart
    // Simple: This handles what happens when add to cart is triggered.
    const handleAddToCart = () => {
        if (!item?.isAvailable) {
            toast.error('This item is not available right now');
            return;
        }

        try {
            addToCart({
                id: item.id,
                type: item.type || 'menu',
                menuItemId: item.type === 'combo' ? null : item.id,
                comboId: item.type === 'combo' ? item.id : null,
                name: item.name,
                price: effectiveUnitPrice,
                basePrice: item.basePrice || item.price,
                addOns: selectedAddOns,
                addOnsPerUnit,
                image: item.image,
                stockQuantity: item.stockQuantity,
                isAvailable: item.isAvailable
            }, 1);

            toast.success(`${item.name} added to cart!`);
        } catch (error) {
            toast.error(error.message || 'Unable to add item to cart');
        }
    };

    if (loading) {
        return <LoadingSkeleton type="card" count={1} />;
    }

    if (error || !item) {
        return (
            <EmptyState
                type="error"
                title="Menu item unavailable"
                description={error || 'This menu item could not be found'}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card overflow-hidden">
                <div className="h-96 bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400 dark:text-slate-500">No image available</span>
                    )}
                </div>
                <div className="p-8">
                    <div className="mb-6">
                        <span className="text-sm text-gray-500 dark:text-slate-400 mb-2 block">{item.categoryName}</span>
                        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-slate-100">{item.name}</h1>
                        <p className="text-xl text-gray-700 dark:text-slate-300 mb-6">{item.description}</p>
                        {item.type === 'combo' && item.originalPrice ? (
                            <div className="mb-2">
                                <span className="text-lg text-gray-400 line-through">LKR {item.originalPrice.toFixed(2)}</span>
                                <span className="ml-3 text-sm font-semibold text-red-600">{item.discount || 0}% OFF</span>
                            </div>
                        ) : null}
                        <p className="text-3xl font-bold text-primary-600">LKR {effectiveUnitPrice.toFixed(2)}</p>
                        {addOnsPerUnit > 0 && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                                Base LKR {(item.basePrice || item.price).toFixed(2)} + Add-ons LKR {addOnsPerUnit.toFixed(2)}
                            </p>
                        )}
                    </div>

                    <div className="mb-6 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 p-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Customize Add-ons</h2>
                        {availableAddOns.length > 0 ? (
                            <div className="space-y-3">
                                {availableAddOns.map((addOn) => {
                                    const currentQty = Number(addOnSelections[addOn.id] || 0);
                                    const isEnabled = currentQty > 0;

                                    return (
                                        <div key={addOn.id} className="rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800/60 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <label className="flex items-start gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1"
                                                        checked={isEnabled}
                                                        onChange={(event) => setAddOnEnabled(addOn.id, event.target.checked)}
                                                    />
                                                    <span>
                                                        <span className="block font-medium text-gray-900">{addOn.name}</span>
                                                        <span className="block text-xs text-gray-600">+ LKR {Number(addOn.price || 0).toFixed(2)} each (max {addOn.maxQuantity})</span>
                                                    </span>
                                                </label>

                                                {isEnabled && (
                                                    <div className="flex items-center rounded-xl border border-gray-300 dark:border-slate-600 overflow-hidden">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors"
                                                            onClick={() => adjustAddOnQuantity(addOn.id, currentQty - 1, addOn.maxQuantity)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="border-x border-gray-300 dark:border-slate-600 px-3 py-1 text-sm font-medium text-gray-900 dark:text-slate-100">{currentQty}</span>
                                                        <button
                                                            type="button"
                                                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors disabled:opacity-40"
                                                            onClick={() => adjustAddOnQuantity(addOn.id, currentQty + 1, addOn.maxQuantity)}
                                                            disabled={currentQty >= Number(addOn.maxQuantity || 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                                No add-ons are configured for this item right now.
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!item.isAvailable}
                    >
                        {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItemDetail;

