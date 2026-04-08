import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Select from '../components/ui/Select';
import { menuItemService } from '../services/menuService';
import { API_BASE_URL } from '../config/api';

const StockManagement = () => {
    const { user } = useAuth();
    const apiBaseUrl = API_BASE_URL;
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [adjustments, setAdjustments] = useState({});
    const [menuItems, setMenuItems] = useState([]);
    const [newItemId, setNewItemId] = useState('');
    const [newOpeningQty, setNewOpeningQty] = useState('');

    const isAdmin = user?.role === 'Admin';
    const isKitchen = user?.role === 'Kitchen';
    const canEditStock = isAdmin || isKitchen;

    // Fetch today's stock
    const fetchStock = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/v1/stock/today`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch stock: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setStock(data.data);
            } else {
                setError('Failed to load stock data');
                toast.error('Failed to load stock data');
            }
        } catch (err) {
            console.error('Stock fetch error:', err);
            setError(err.message || 'Failed to load stock');
            toast.error(err.message || 'Failed to load stock');
        } finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);

    useEffect(() => {
        fetchStock();
        // Refresh stock every 30 seconds
        const interval = setInterval(fetchStock, 30000);
        return () => clearInterval(interval);
    }, [fetchStock]);

    useEffect(() => {
        const loadMenuItems = async () => {
            try {
                const response = await menuItemService.getAll({ isActive: 'true' });
                if (response.success && Array.isArray(response.data)) {
                    setMenuItems(response.data);
                } else {
                    setMenuItems([]);
                }
            } catch (err) {
                console.error('Menu items fetch error:', err);
                setMenuItems([]);
            }
        };

        if (canEditStock) {
            loadMenuItems();
        }
    }, [canEditStock]);

    const handleUpdateOpening = async (stockId, newQuantity) => {
        if (!canEditStock) {
            toast.error('Only admins or kitchen staff can update stock');
            return;
        }

        try {
            setUpdatingId(stockId);
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBaseUrl}/api/v1/stock/update/${stockId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ openingQuantity: parseInt(newQuantity) })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Opening quantity updated');
                fetchStock();
            } else {
                toast.error(data.message || 'Failed to update');
            }
        } catch (err) {
            console.error('Update error:', err);
            toast.error(err.message || 'Failed to update');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleManualAdjust = async (stockId, adjustment, reason) => {
        if (!canEditStock) {
            toast.error('Only admins or kitchen staff can update stock');
            return;
        }

        if (!reason || !reason.trim()) {
            toast.error('Adjustment reason is required');
            return;
        }

        try {
            setUpdatingId(stockId);
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBaseUrl}/api/v1/stock/manual-adjust/${stockId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adjustment: parseInt(adjustment, 10),
                    reason: reason.trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Stock adjusted');
                setAdjustments((prev) => ({
                    ...prev,
                    [stockId]: { adjustment: 0, reason: '' }
                }));
                fetchStock();
            } else {
                toast.error(data.message || 'Failed to adjust');
            }
        } catch (err) {
            console.error('Adjust error:', err);
            toast.error(err.message || 'Failed to adjust');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddStockItem = async () => {
        if (!canEditStock) {
            toast.error('Only admins or kitchen staff can update stock');
            return;
        }

        if (!newItemId) {
            toast.error('Select a menu item');
            return;
        }

        const openingQty = parseInt(newOpeningQty, 10);
        if (!Number.isInteger(openingQty) || openingQty < 0) {
            toast.error('Opening quantity must be a non-negative integer');
            return;
        }

        try {
            setUpdatingId('add');
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/v1/stock/daily`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    menuItemId: parseInt(newItemId, 10),
                    quantity: openingQty
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Stock item added');
                setNewItemId('');
                setNewOpeningQty('');
                fetchStock();
            } else {
                toast.error(data.message || 'Failed to add stock item');
            }
        } catch (err) {
            console.error('Add stock item error:', err);
            toast.error(err.message || 'Failed to add stock item');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemoveStockItem = async (stockId) => {
        if (!canEditStock) {
            toast.error('Only admins or kitchen staff can update stock');
            return;
        }

        const confirmed = window.confirm('Remove this stock record? This only works if no sales are recorded for today.');
        if (!confirmed) {
            return;
        }

        try {
            setUpdatingId(stockId);
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/api/v1/stock/${stockId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Stock item removed');
                fetchStock();
            } else {
                toast.error(data.message || 'Failed to remove stock item');
            }
        } catch (err) {
            console.error('Remove stock item error:', err);
            toast.error(err.message || 'Failed to remove stock item');
        } finally {
            setUpdatingId(null);
        }
    };

    const stockMenuIds = useMemo(() => new Set(stock.map(item => item.MenuItemID)), [stock]);
    const availableMenuOptions = useMemo(() => {
        return menuItems
            .filter(item => !stockMenuIds.has(item.MenuItemID))
            .map(item => ({ value: String(item.MenuItemID), label: item.Name }));
    }, [menuItems, stockMenuIds]);

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">Stock Management</h1>
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Daily Stock</h1>
                    <p className="text-gray-600">
                        {canEditStock ? 'Monitor and update stock levels' : 'View current stock levels'}
                    </p>
                </div>
                <Button onClick={fetchStock} variant="outline">
                    <FaSyncAlt className="inline mr-2" /> Refresh
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-900">Error Loading Stock</h3>
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {canEditStock && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Add Item to Today&apos;s Stock</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <Select
                            label="Menu Item"
                            name="menuItem"
                            value={newItemId}
                            onChange={(e) => setNewItemId(e.target.value)}
                            options={availableMenuOptions}
                            placeholder="Select item"
                        />
                        <Input
                            label="Opening Quantity"
                            type="number"
                            value={newOpeningQty}
                            onChange={(e) => setNewOpeningQty(e.target.value)}
                            min="0"
                        />
                        <Button
                            onClick={handleAddStockItem}
                            loading={updatingId === 'add'}
                            disabled={availableMenuOptions.length === 0}
                        >
                            Add Stock Item
                        </Button>
                    </div>
                    {availableMenuOptions.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">All active items already have stock records for today.</p>
                    )}
                </div>
            )}

            {stock.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No stock data available for today</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Opening</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Sold</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Adjusted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Closing</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    {canEditStock && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stock.map(item => (
                                    <tr key={item.StockID} className={item.IsLowStock ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 font-medium">{item.menuItem?.Name || 'Unknown Item'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {canEditStock ? (
                                                <Input
                                                    type="number"
                                                    defaultValue={item.OpeningQuantity}
                                                    onBlur={(e) => handleUpdateOpening(item.StockID, e.target.value)}
                                                    disabled={updatingId === item.StockID}
                                                    className="w-20 text-center"
                                                />
                                            ) : (
                                                item.OpeningQuantity
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-red-600 font-semibold">-{item.SoldQuantity}</td>
                                        <td className="px-6 py-4 text-center text-orange-600">{item.AdjustedQuantity >= 0 ? '+' : ''}{item.AdjustedQuantity}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={item.IsLowStock ? 'text-red-700 font-bold text-lg' : 'font-semibold'}>
                                                {item.ClosingQuantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.IsLowStock ? (
                                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                                                    <FaExclamationTriangle /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                                                    ✓ In Stock
                                                </span>
                                            )}
                                        </td>
                                        {canEditStock && (
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="Adj"
                                                            className="w-20 text-center"
                                                            value={adjustments[item.StockID]?.adjustment ?? 0}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setAdjustments((prev) => ({
                                                                    ...prev,
                                                                    [item.StockID]: {
                                                                        adjustment: value,
                                                                        reason: prev[item.StockID]?.reason ?? ''
                                                                    }
                                                                }));
                                                            }}
                                                            disabled={updatingId === item.StockID}
                                                        />
                                                        <Input
                                                            type="text"
                                                            placeholder="Reason"
                                                            className="min-w-[160px]"
                                                            value={adjustments[item.StockID]?.reason ?? ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setAdjustments((prev) => ({
                                                                    ...prev,
                                                                    [item.StockID]: {
                                                                        adjustment: prev[item.StockID]?.adjustment ?? 0,
                                                                        reason: value
                                                                    }
                                                                }));
                                                            }}
                                                            disabled={updatingId === item.StockID}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpdateOpening(item.StockID, item.OpeningQuantity)}
                                                            disabled={updatingId === item.StockID}
                                                        >
                                                            Save Opening
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                const adjustment = adjustments[item.StockID]?.adjustment ?? 0;
                                                                const reason = adjustments[item.StockID]?.reason ?? '';
                                                                handleManualAdjust(item.StockID, adjustment, reason);
                                                            }}
                                                            disabled={updatingId === item.StockID}
                                                        >
                                                            Adjust
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveStockItem(item.StockID)}
                                                            disabled={updatingId === item.StockID}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockManagement;
