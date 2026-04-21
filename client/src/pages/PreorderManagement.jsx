// CODEMAP: FRONTEND_PAGE_PREORDERMANAGEMENT
// WHAT_THIS_IS: This page renders the PreorderManagement screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/PreorderManagement.jsx
// - Search text: const PreorderManagement
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FilterResetButton from '../components/ui/FilterResetButton';
import backendApi from '../services/backendApi';
import { getOrders } from '../services/orderApi';
import useDelayedStatusUpdate from '../hooks/useDelayedStatusUpdate';

const statusFilterOptions = [
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

const approvalFilterOptions = [
    { value: '', label: 'All Approval States' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'NOT_REQUIRED', label: 'Not Required' },
];

const orderStatusOptions = statusFilterOptions.filter((option) => option.value);

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

// This chooses the next statuses that are allowed for an order.
const getStatusOptionsForOrder = (status) => {
    const allowedStatuses = new Set([status, ...(validStatusTransitions[status] || [])]);
    return orderStatusOptions.filter((option) => allowedStatuses.has(option.value));
};

// This formats a saved date so people can read it easily.
const formatDateTime = (value) => {
    if (!value) return 'Not scheduled';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Invalid date';

    return parsed.toLocaleString();
};

// This turns preorder items into a short readable summary.
const getPreorderItemsSummary = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return 'No items';
    }

    return items
        .map((item) => {
            const name = item.menuItem?.Name || item.combo?.Name || item.itemName || 'Item';
            const quantity = Number(item.Quantity || item.quantity || 0);
            return `${quantity > 0 ? quantity : 1}x ${name}`;
        })
        .join(', ');
};

// This checks whether an order is a preorder.
const isPreorderRecord = (order) => {
    return Boolean(order.IsPreorder || order.isPreorder || order.is_preorder)
        || String(order.Status || '').startsWith('PREORDER_')
        || Boolean(order.ScheduledDatetime || order.scheduledDatetime || order.scheduled_datetime);
};

// Simple: This shows the preorder management section.
const PreorderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [approvalFilter, setApprovalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [preorders, setPreorders] = useState([]);
    const [draftStatuses, setDraftStatuses] = useState({});
    const [error, setError] = useState('');

    const loadPreorders = useCallback(async ({ showLoading = false } = {}) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await getOrders({
                isPreorder: true,
                limit: 200,
                offset: 0,
            });
            const apiOrders = response.data?.data || response.data || [];

            const preorderOrders = apiOrders
                .filter(isPreorderRecord)
                .map((order) => {
                    const createdAt = order.CreatedAt || order.createdAt || order.created_at || null;
                    const updatedAt = order.UpdatedAt || order.updatedAt || order.updated_at || createdAt;

                    return {
                        id: order.OrderID,
                        orderNumber: order.OrderNumber,
                        customerName: order.customer?.Name || 'Unknown',
                        customerPhone: order.customer?.Phone || 'N/A',
                        status: order.Status,
                        approvalStatus: order.ApprovalStatus || 'NOT_REQUIRED',
                        scheduledDatetime: order.ScheduledDatetime || order.scheduledDatetime || order.scheduled_datetime || null,
                        isPreorder: Boolean(order.IsPreorder || order.isPreorder || order.is_preorder),
                        itemsSummary: getPreorderItemsSummary(order.items),
                        total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                        createdAt,
                        updatedAt,
                    };
                });

            setPreorders(preorderOrders);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load preorder orders');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        // This loads preorders only while this page is still open.
        const loadPreordersSafely = async (options = {}) => {
            if (!isActive) return;
            await loadPreorders(options);
        };

        loadPreordersSafely({ showLoading: true });

        const intervalId = setInterval(() => {
            loadPreordersSafely();
        }, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadPreorders]);

    const filteredPreorders = useMemo(() => {
        return preorders
            .filter((order) => {
                const query = searchTerm.trim().toLowerCase();
                const matchesSearch = !query
                    || order.orderNumber?.toLowerCase().includes(query)
                    || order.customerName?.toLowerCase().includes(query)
                    || order.itemsSummary?.toLowerCase().includes(query);

                const matchesStatus = !statusFilter || order.status === statusFilter;
                const matchesApproval = !approvalFilter || order.approvalStatus === approvalFilter;

                return matchesSearch && matchesStatus && matchesApproval;
            })
            .sort((a, b) => {
                const aTime = new Date(a.scheduledDatetime || a.createdAt || 0).getTime();
                const bTime = new Date(b.scheduledDatetime || b.createdAt || 0).getTime();
                return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
            });
    }, [approvalFilter, preorders, searchTerm, statusFilter]);

    const hasActiveFilters = Boolean(searchTerm || statusFilter || approvalFilter);

    // This clears all filters and shows the full list again.
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setApprovalFilter('');
    };

    // This sends an order status change to the backend.
    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await backendApi.patch(`/api/v1/orders/${orderId}/status`, { status: newStatus });
            setPreorders((prev) => prev.map((order) => (
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
        // This runs after a delayed change is confirmed.
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
        // This shows the error when a delayed change fails.
        onError: (err) => {
            setError(err.response?.data?.message || err.message || 'Failed to update status');
        },
    });

    // This gets the status currently selected for an order.
    const getSelectedStatus = (order) => {
        const pending = getPendingUpdate(order.id);
        if (pending) return pending.toStatus;
        return draftStatuses[order.id] || order.status;
    };

    // This saves the status the user picked before sending it.
    const handleDraftStatusChange = (orderId, status) => {
        setDraftStatuses((prev) => ({
            ...prev,
            [orderId]: status,
        }));
    };

    // This resets a changed status back to the saved order status.
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

    // This waits briefly before sending an order status change.
    const queueOrderStatusUpdate = (order) => {
        const selectedStatus = getSelectedStatus(order);
        if (!selectedStatus || selectedStatus === order.status) return;

        queueStatusUpdate(order.id, order.status, selectedStatus);
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Preorder Management</h1>
                <p className="text-gray-600 dark:text-slate-400">
                    Monitor and manage preorder requests, schedules, and item details.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 dark:bg-slate-800 dark:shadow-slate-900/50">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search by order, customer, or item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={FaSearch}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={statusFilterOptions}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Select
                            value={approvalFilter}
                            onChange={(e) => setApprovalFilter(e.target.value)}
                            options={approvalFilterOptions}
                        />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        {hasActiveFilters ? (
                            <FilterResetButton
                                onClick={clearFilters}
                                className="w-full justify-center"
                            />
                        ) : (
                            <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                {filteredPreorders.length} matching
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingSkeleton type="table" rows={8} />
            ) : filteredPreorders.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-slate-800 dark:shadow-slate-900/50">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Scheduled For
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Preordered Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Approval
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700">
                                {filteredPreorders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 align-top">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-slate-200">{order.orderNumber}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">Updated: {formatDateTime(order.updatedAt)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-slate-200">{order.customerName}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-slate-200">{formatDateTime(order.scheduledDatetime)}</div>
                                        </td>
                                        <td className="px-6 py-4 min-w-[280px]">
                                            <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-3">{order.itemsSummary}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={order.approvalStatus} />
                                        </td>
                                        <td className="px-6 py-4 min-w-[230px]">
                                            <div className="space-y-2">
                                                <Select
                                                    value={getSelectedStatus(order)}
                                                    onChange={(e) => handleDraftStatusChange(order.id, e.target.value)}
                                                    options={getStatusOptionsForOrder(order.status)}
                                                    className="text-xs"
                                                    disabled={!!getPendingUpdate(order.id)}
                                                />
                                                {getPendingUpdate(order.id) ? (
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800">
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
                                            <div className="text-sm font-medium text-gray-900 dark:text-slate-200">
                                                LKR {order.total.toFixed(2)}
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
                    title="No preorders found"
                    description={hasActiveFilters ? 'No preorder records match your current filters.' : 'No preorder records are available yet.'}
                    action={hasActiveFilters ? <FilterResetButton onClick={clearFilters} /> : null}
                />
            )}
        </div>
    );
};

export default PreorderManagement;

