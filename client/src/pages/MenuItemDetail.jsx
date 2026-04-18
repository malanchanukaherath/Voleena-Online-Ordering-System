import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { addToCart } from '../utils/cartStorage';
import { comboPackService, menuItemService } from '../services/menuService';
import { resolveAssetUrl } from '../config/api';

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

    const mapComboItem = useCallback((data) => ({
        id: data.ComboID || data.ComboPackID,
        name: data.Name,
        description: data.Description || 'No description available',
        price: parseFloat(data.Price),
        originalPrice: data.OriginalPrice ? parseFloat(data.OriginalPrice) : null,
        discount: data.DiscountPercentage ? parseFloat(data.DiscountPercentage) : 0,
        categoryName: 'Combo Pack',
        image: resolveAssetUrl(data.ImageURL || data.Image_URL || null),
        stockQuantity: null,
        isAvailable: data.IsAvailable !== undefined ? !!data.IsAvailable : true,
        type: 'combo'
    }), []);

    useEffect(() => {
        let isMounted = true;

        const fetchItem = async () => {
            setLoading(true);
            setError(null);

            if (isComboPath) {
                try {
                    const comboResponse = await comboPackService.getById(itemId);
                    if (comboResponse.success && comboResponse.data) {
                        if (isMounted) {
                            setItem(mapComboItem(comboResponse.data));
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
                            setItem(mapComboItem(foundCombo));
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
    }, [isComboPath, itemId, mapComboItem, mapMenuItem]);

    useEffect(() => {
        setAddOnSelections({});
    }, [item?.id]);

    const availableAddOns = item?.type === 'combo'
        ? []
        : (Array.isArray(item?.availableAddOns) ? item.availableAddOns : []);

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
    const effectiveUnitPrice = Number(((item?.type === 'combo' ? item?.price : (item?.basePrice || item?.price || 0)) + addOnsPerUnit).toFixed(2));

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

    const adjustAddOnQuantity = (addOnId, requestedQuantity, maxQuantity) => {
        const normalizedMax = Math.max(1, Number(maxQuantity || 1));
        const normalizedNext = Math.min(normalizedMax, Math.max(1, Number(requestedQuantity || 1)));

        setAddOnSelections((previous) => ({
            ...previous,
            [addOnId]: normalizedNext
        }));
    };

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

            toast.success(`✓ ${item.name} added to cart!`);
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400">No image available</span>
                    )}
                </div>
                <div className="p-8">
                    <div className="mb-6">
                        <span className="text-sm text-gray-500 mb-2 block">{item.categoryName}</span>
                        <h1 className="text-4xl font-bold mb-4">{item.name}</h1>
                        <p className="text-xl text-gray-700 mb-6">{item.description}</p>
                        {item.type === 'combo' && item.originalPrice ? (
                            <div className="mb-2">
                                <span className="text-lg text-gray-400 line-through">LKR {item.originalPrice.toFixed(2)}</span>
                                <span className="ml-3 text-sm font-semibold text-red-600">{item.discount || 0}% OFF</span>
                            </div>
                        ) : null}
                        <p className="text-3xl font-bold text-primary-600">LKR {effectiveUnitPrice.toFixed(2)}</p>
                        {item.type !== 'combo' && addOnsPerUnit > 0 && (
                            <p className="mt-2 text-sm text-gray-600">
                                Base LKR {(item.basePrice || item.price).toFixed(2)} + Add-ons LKR {addOnsPerUnit.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {item.type !== 'combo' && (
                        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Customize Add-ons</h2>
                            {availableAddOns.length > 0 ? (
                                <div className="space-y-3">
                                    {availableAddOns.map((addOn) => {
                                        const currentQty = Number(addOnSelections[addOn.id] || 0);
                                        const isEnabled = currentQty > 0;

                                        return (
                                            <div key={addOn.id} className="rounded border border-gray-200 bg-white p-3">
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
                                                        <div className="flex items-center rounded border border-gray-300">
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1 hover:bg-gray-100"
                                                                onClick={() => adjustAddOnQuantity(addOn.id, currentQty - 1, addOn.maxQuantity)}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="border-x border-gray-300 px-3 py-1 text-sm">{currentQty}</span>
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1 hover:bg-gray-100"
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
                                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    No add-ons are configured for this menu item right now.
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
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
