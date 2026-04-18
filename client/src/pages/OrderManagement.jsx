import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FilterResetButton from '../components/ui/FilterResetButton';
import backendApi from '../services/backendApi';
import { getOrders } from '../services/orderApi';
import useDelayedStatusUpdate from '../hooks/useDelayedStatusUpdate';

const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PREORDER_PENDING', label: 'Preorder Pending' },
    { value: 'PREORDER_CONFIRMED', label: 'Preorder Confirmed' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PREPARING', label: 'Preparing' },
    { value: 'READY', label: 'Ready' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const orderStatusOptions = statusOptions.filter((option) => option.value);

const validStatusTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    PREORDER_PENDING: ['PREORDER_CONFIRMED', 'CANCELLED'],
    PREORDER_CONFIRMED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
};

const getStatusOptionsForOrder = (status) => {
    const allowedStatuses = new Set([status, ...(validStatusTransitions[status] || [])]);
    return orderStatusOptions.filter((option) => allowedStatuses.has(option.value));
};

const OrderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [draftStatuses, setDraftStatuses] = useState({});
    const [error, setError] = useState('');

    const loadOrders = useCallback(async ({ showLoading = false } = {}) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await getOrders();
            const apiOrders = response.data?.data || response.data || [];

            const mappedOrders = apiOrders.map((order) => {
                const itemCount = Array.isArray(order.items)
                    ? order.items.reduce((sum, item) => sum + (item.Quantity || 0), 0)
                    : 0;

                const createdAt = order.CreatedAt || order.createdAt || order.created_at || null;
                const updatedAt = order.UpdatedAt || order.updatedAt || order.updated_at || createdAt;

                return {
                    id: order.OrderID,
                    orderNumber: order.OrderNumber,
                    customerName: order.customer?.Name || 'Unknown',
                    customerPhone: order.customer?.Phone || 'N/A',
                    orderType: order.OrderType,
                    status: order.Status,
                    total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                    items: itemCount,
                    createdAt,
                    updatedAt,
                };
            });

            setOrders(mappedOrders);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load orders');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadOrdersSafely = async (options = {}) => {
            if (!isActive) return;
            await loadOrders(options);
        };

        loadOrdersSafely({ showLoading: true });

        // Keep admin order status in sync with kitchen/delivery updates.
        const intervalId = setInterval(() => {
            loadOrdersSafely();
        }, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadOrders]);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = !statusFilter || order.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const aTime = new Date(a.createdAt || 0).getTime();
                const bTime = new Date(b.createdAt || 0).getTime();
                return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
            });
    }, [orders, searchTerm, statusFilter]);

    const hasActiveFilters = Boolean(searchTerm || statusFilter);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await backendApi.patch(`/api/v1/orders/${orderId}/status`, { status: newStatus });
            setOrders((prev) => prev.map((order) => (
                order.id === orderId ? { ...order, status: newStatus } : order
            )));
            setError('');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to update status';
            setError(message);
            throw err;
        }
    };

    const {
        queueStatusUpdate,
        cancelPendingUpdate,
        commitPendingUpdateNow,
        getPendingUpdate,
    } = useDelayedStatusUpdate({
        delayMs: 5000,
        onCommit: async (update) => {
            await handleStatusUpdate(update.itemId, update.toStatus);
            setDraftStatuses((prev) => {
                if (!Object.prototype.hasOwnProperty.call(prev, update.itemId)) {
                    return prev;
                }

                const next = { ...prev };
                delete next[update.itemId];
                return next;
            });
        },
        onError: (err) => {
            setError(err.response?.data?.message || err.message || 'Failed to update status');
        },
    });

    const getSelectedStatus = (order) => {
        const pending = getPendingUpdate(order.id);
        if (pending) return pending.toStatus;
        return draftStatuses[order.id] || order.status;
    };

    const handleDraftStatusChange = (orderId, status) => {
        setDraftStatuses((prev) => ({
            ...prev,
            [orderId]: status,
        }));
    };

    const resetDraftStatus = (order) => {
        setDraftStatuses((prev) => {
            if (!Object.prototype.hasOwnProperty.call(prev, order.id)) {
                return prev;
            }

            const next = { ...prev };
            delete next[order.id];
            return next;
        });
    };

    const queueOrderStatusUpdate = (order) => {
        const selectedStatus = getSelectedStatus(order);
        if (!selectedStatus || selectedStatus === order.status) return;

        queueStatusUpdate(order.id, order.status, selectedStatus);
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Order Management</h1>
                <p className="text-gray-600">View and manage all customer orders</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search by order number or customer name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={FaSearch}
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={statusOptions}
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

            {error && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {error}
                </div>
            )}

            {/* Orders Table */}
            {loading ? (
                <LoadingSkeleton type="table" rows={10} />
            ) : filteredOrders.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                                            <div className="text-xs text-gray-500">{order.items} items</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${order.orderType === 'DELIVERY'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {order.orderType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-2 min-w-[210px]">
                                                <Select
                                                    value={getSelectedStatus(order)}
                                                    onChange={(e) => handleDraftStatusChange(order.id, e.target.value)}
                                                    options={getStatusOptionsForOrder(order.status)}
                                                    className="text-xs"
                                                    disabled={!!getPendingUpdate(order.id)}
                                                />
                                                {getPendingUpdate(order.id) ? (
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                                            Applying
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => commitPendingUpdateNow(order.id)}
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => cancelPendingUpdate(order.id)}
                                                        >
                                                            Undo
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => queueOrderStatusUpdate(order)}
                                                            disabled={getSelectedStatus(order) === order.status}
                                                        >
                                                            Apply
                                                        </Button>
                                                        {getSelectedStatus(order) !== order.status && (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => resetDraftStatus(order)}
                                                            >
                                                                Reset
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                LKR {order.total.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No orders found"
                    description={error || 'No orders match your search criteria'}
                    action={hasActiveFilters ? <FilterResetButton onClick={clearFilters} /> : null}
                />
            )}
        </div>
    );
};

export default OrderManagement;
