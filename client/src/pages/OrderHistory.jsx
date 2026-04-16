import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaRedo, FaComments } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import FilterResetButton from '../components/ui/FilterResetButton';
import { getOrders } from '../services/orderApi';

const OrderHistory = () => {
    const [statusFilter, setStatusFilter] = useState('');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await getOrders();
                const mapped = (response.data?.data || []).map((order) => {
                    // Handle both CreatedAt (PascalCase) and createdAt (camelCase) for compatibility
                    const createdAtValue = order.CreatedAt || order.createdAt || order.created_at;
                    const createdAt = createdAtValue ? new Date(createdAtValue) : new Date();
                    const isValidDate = createdAt && !isNaN(createdAt.getTime());

                    return {
                        id: order.OrderID,
                        orderNumber: order.OrderNumber,
                        date: isValidDate ? createdAt.toLocaleDateString() : 'N/A',
                        time: isValidDate ? createdAt.toLocaleTimeString() : 'N/A',
                        items: (order.items || []).map((item) => ({
                            name: item.menuItem?.Name || item.combo?.Name || 'Item',
                            quantity: item.Quantity
                        })),
                        total: parseFloat(order.FinalAmount || order.TotalAmount || 0),
                        status: order.Status,
                        orderType: order.OrderType
                    };
                });
                setOrders(mapped);
                setError(null);
            } catch (err) {
                console.error('Failed to load orders:', err);
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const statusOptions = [
        { value: '', label: 'All Orders' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'PREPARING', label: 'Preparing' },
        { value: 'READY', label: 'Ready' },
        { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ];

    const filteredOrders = statusFilter
        ? orders.filter(order => order.status === statusFilter)
        : orders;

    const hasActiveFilters = Boolean(statusFilter);

    const clearFilters = () => {
        setStatusFilter('');
    };

    const handleReorder = () => {
        alert('Items added to cart!');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Order History</h1>
                <p className="text-gray-600">View your past orders and reorder your favorites</p>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="w-full md:max-w-xs">
                        <Select
                            label="Filter by Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={statusOptions}
                        />
                    </div>
                    <FilterResetButton onClick={clearFilters} disabled={!hasActiveFilters} label="Clear Filter" />
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="bg-white rounded-lg shadow p-6">Loading orders...</div>
            ) : error ? (
                <div className="bg-white rounded-lg shadow p-6 text-red-600">{error}</div>
            ) : filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                                            <StatusBadge status={order.status} type="order" />
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {order.date} at {order.time} · {order.orderType}
                                        </p>
                                    </div>
                                    <div className="mt-4 md:mt-0">
                                        <p className="text-2xl font-bold text-primary-600">
                                            LKR {order.total.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {order.items.map((item, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                                            >
                                                {item.quantity}x {item.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3">
                                    <Link to={`/orders/${order.id}/track`}>
                                        <Button size="sm" variant="outline">
                                            <FaEye className="inline mr-2" />
                                            View Details
                                        </Button>
                                    </Link>
                                    {order.status === 'DELIVERED' && (
                                        <>
                                            <Link to={`/feedback?orderId=${order.id}`}>
                                                <Button size="sm" variant="outline">
                                                    <FaComments className="inline mr-2" />
                                                    Leave Feedback
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                onClick={() => handleReorder(order.id)}
                                            >
                                                <FaRedo className="inline mr-2" />
                                                Reorder
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No orders found"
                    description={statusFilter ? 'No orders match the selected filter' : "You haven't placed any orders yet"}
                    action={
                        hasActiveFilters ? (
                            <FilterResetButton onClick={clearFilters} label="Clear Filter" />
                        ) : (
                            <Link to="/menu">
                                <Button>Browse Menu</Button>
                            </Link>
                        )
                    }
                />
            )}
        </div>
    );
};

export default OrderHistory;
