// CODEMAP: FRONTEND_PAGE_ORDERHISTORY
// WHAT_THIS_IS: This page renders the OrderHistory screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/OrderHistory.jsx
// - Search text: const OrderHistory
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaRedo, FaComments } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import FilterResetButton from '../components/ui/FilterResetButton';
import { getOrders } from '../services/orderApi';
import { getPreorderRequests } from '../services/preorderRequestApi';

// Simple: This shows the order history section.
const OrderHistory = () => {
    const [statusFilter, setStatusFilter] = useState('');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preorderRequests, setPreorderRequests] = useState([]);
    const [preorderError, setPreorderError] = useState('');

    const fetchOrders = useCallback(async ({ showLoading = false } = {}) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await getOrders();
            // Simple: This handles mapped logic.
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
                    orderType: order.OrderType,
                    isPreorder: Boolean(order.IsPreorder || order.isPreorder || String(order.Status || '').startsWith('PREORDER_') || order.ScheduledDatetime || order.scheduledDatetime),
                    scheduledDatetime: order.ScheduledDatetime || order.scheduledDatetime || order.scheduled_datetime || null
                };
            });

            setOrders(mapped);
            setError(null);

            try {
                const preorderResponse = await getPreorderRequests({ limit: 50, offset: 0 });
                setPreorderRequests((preorderResponse.data?.data || []).map((request) => ({
                    id: request.PreorderRequestID,
                    requestNumber: request.RequestNumber,
                    requestedFor: request.RequestedFor,
                    status: request.Status,
                    requestDetails: request.RequestDetails,
                    contactName: request.ContactName,
                    items: Array.isArray(request.items) ? request.items.map((item) => ({
                        name: item.menuItem?.Name || item.combo?.Name || item.RequestedName || 'Custom item',
                        quantity: item.Quantity || item.quantity || 1
                    })) : []
                })));
                setPreorderError(null);
            } catch (preorderRequestError) {
                console.error('Failed to load preorder requests:', preorderRequestError);
                setPreorderRequests([]);
                setPreorderError(preorderRequestError.response?.data?.message || 'Preorder requests are temporarily unavailable.');
            }
        } catch (err) {
            console.error('Failed to load orders:', err);
            setError('Failed to load orders');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        // Simple: This gets the orders safely.
        const fetchOrdersSafely = async (options = {}) => {
            if (!isActive) return;
            await fetchOrders(options);
        };

        fetchOrdersSafely({ showLoading: true });

        // Keep customer history synced with status changes from kitchen/delivery.
        const intervalId = setInterval(() => {
            fetchOrdersSafely();
        }, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [fetchOrders]);

    const statusOptions = [
        { value: '', label: 'All Orders' },
        { value: 'PREORDER_PENDING', label: 'Preorder Pending' },
        { value: 'PREORDER_CONFIRMED', label: 'Preorder Confirmed' },
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

    // Simple: This removes or clears the filters.
    const clearFilters = () => {
        setStatusFilter('');
    };

    // Simple: This handles what happens when reorder is triggered.
    const handleReorder = () => {
        alert('Items added to cart!');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Order History</h1>
                <p className="text-gray-600 dark:text-slate-400">View your past orders and reorder your favorites</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 dark:bg-indigo-950/40 dark:border-indigo-800">
                <p className="text-sm text-indigo-800 dark:text-indigo-300">
                    <span className="font-semibold">Need advance or bulk ordering?</span> Use the separate preorder request flow so admin can review your request before anything enters the normal order workflow.
                </p>
                <p className="text-xs text-indigo-700 mt-1 dark:text-indigo-400">
                    Preorder requests stay outside checkout until they are reviewed.
                </p>
                <div className="mt-3">
                    <Link to="/preorder-request">
                        <Button size="sm">New Preorder Request</Button>
                    </Link>
                </div>
            </div>

            <div className="card p-6 mb-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">My Preorder Requests</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            These requests are tracked separately from normal orders.
                        </p>
                    </div>
                    <Link to="/preorder-request">
                        <Button variant="outline" size="sm">Create Request</Button>
                    </Link>
                </div>
                {preorderError && (
                    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                        {preorderError}
                    </div>
                )}
                {preorderRequests.length > 0 ? (
                    <div className="space-y-3">
                        {preorderRequests.map((request) => (
                            <div key={request.id} className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-slate-100">{request.requestNumber}</p>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                            Requested for {request.requestedFor ? new Date(request.requestedFor).toLocaleString() : 'Not set'}
                                        </p>
                                    </div>
                                    <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
                                        {request.status}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{request.requestDetails}</p>
                                {request.items.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {request.items.map((item, index) => (
                                            <span
                                                key={`${request.id}-${item.name}-${index}`}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                                            >
                                                {item.quantity}x {item.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400">No preorder requests submitted yet.</p>
                )}
            </div>

            {/* Filter */}
            <div className="card p-4 mb-6">
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
                <div className="card p-6 text-gray-500 dark:text-slate-400">Loading orders...</div>
            ) : error ? (
                <div className="card p-6 text-red-600 dark:text-red-400">{error}</div>
            ) : filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="card hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                                            <StatusBadge status={order.status} type="order" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                            {order.date} at {order.time} | {order.orderType}
                                        </p>
                                        {order.isPreorder && order.scheduledDatetime && (
                                            <p className="text-xs text-indigo-700 mt-1 dark:text-indigo-400">
                                                Scheduled for {new Date(order.scheduledDatetime).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4 md:mt-0">
                                        <p className="text-2xl font-bold text-primary-600">
                                            LKR {order.total.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">Items:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {order.items.map((item, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
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

