import React, { useState, useEffect } from 'react';
import { FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const StockManagement = () => {
    const { user } = useAuth();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const isAdmin = user?.role === 'Admin';
    const isKitchen = user?.role === 'Kitchen';

    // Fetch today's stock
    const fetchStock = async () => {
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
    };

    useEffect(() => {
        fetchStock();
        // Refresh stock every 30 seconds
        const interval = setInterval(fetchStock, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateOpening = async (stockId, newQuantity) => {
        if (!isAdmin) {
            toast.error('Only admins can update opening quantities');
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
                        {isAdmin ? 'Monitor and update stock levels' : 'View current stock levels'}
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

            {stock.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No stock data available for today</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Opening</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Sold</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Adjusted</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Closing</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {stock.map(item => (
                                <tr key={item.StockID} className={item.IsLowStock ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 font-medium">{item.menuItem?.Name || 'Unknown Item'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {isAdmin ? (
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
                                    {isAdmin && (
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUpdateOpening(item.StockID, item.OpeningQuantity)}
                                                disabled={updatingId === item.StockID}
                                            >
                                                Update
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StockManagement;
