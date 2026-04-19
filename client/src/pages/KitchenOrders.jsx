import React, { useCallback, useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { kitchenService } from '../services/dashboardService';
import useDelayedStatusUpdate from '../hooks/useDelayedStatusUpdate';

// Code Review: Function KitchenOrders in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/ActiveDeliveries.jsx, client/src/pages/CashierOrders.jsx, client/src/pages/DeliveryDashboard.jsx.
const KitchenOrders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');

    // Code Review: Function getOrderTimestamp in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/KitchenOrders.jsx.
    const getOrderTimestamp = (value) => {
        const timestamp = new Date(value || 0).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    // Code Review: Function normalizeSpecialInstructions in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/ActiveDeliveries.jsx, client/src/pages/CashierOrders.jsx, client/src/pages/DeliveryDashboard.jsx.
    const normalizeSpecialInstructions = (order) => {
        const rawValue = order?.SpecialInstructions ?? order?.specialInstructions ?? order?.special_instructions ?? '';
        const normalized = String(rawValue || '').trim();
        return normalized || '';
    };

    const loadOrders = useCallback(async () => {
        try {
            const response = await kitchenService.getAssignedOrders();
            const data = response.data || response?.data?.data || [];
            const mapped = data
                .map((order) => ({
                    id: order.OrderID,
                    orderNumber: order.OrderNumber,
                    items: (order.items || []).map((item) => `${item.Quantity}x ${item.menuItem?.Name || 'Item'}`),
                    time: order.created_at || order.CreatedAt || order.createdAt,
                    status: order.Status,
                    orderType: order.OrderType,
                    specialInstructions: normalizeSpecialInstructions(order),
                    priority: order.Status === 'CONFIRMED' ? 'high' : 'normal'
                }))
                .sort((a, b) => getOrderTimestamp(b.time) - getOrderTimestamp(a.time));

            setOrders(mapped);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load kitchen orders');
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        // Code Review: Function loadOrdersSafely in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/CashierOrders.jsx, client/src/pages/KitchenOrders.jsx, client/src/pages/OrderManagement.jsx.
        const loadOrdersSafely = async () => {
            if (!isActive) return;
            await loadOrders();
        };

        loadOrdersSafely();

        // Poll periodically so newly confirmed orders appear without manual refresh.
        const intervalId = setInterval(loadOrdersSafely, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadOrders]);

    // Code Review: Function getNextStatus in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/ActiveDeliveries.jsx, client/src/pages/DeliveryDashboard.jsx, client/src/pages/KitchenOrders.jsx.
    const getNextStatus = (status) => {
        const map = {
            CONFIRMED: 'PREPARING',
            PREPARING: 'READY'
        };
        return map[status];
    };

    // Code Review: Function getActionLabel in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/ActiveDeliveries.jsx, client/src/pages/DeliveryDashboard.jsx, client/src/pages/KitchenOrders.jsx.
    const getActionLabel = (status) => {
        if (status === 'CONFIRMED') return 'Start Preparing';
        if (status === 'PREPARING') return 'Mark Ready';
        return 'Update Status';
    };

    const {
        queueStatusUpdate,
        cancelPendingUpdate,
        commitPendingUpdateNow,
        getPendingUpdate,
    } = useDelayedStatusUpdate({
        delayMs: 5000,
        onCommit: async (update) => {
            await kitchenService.updateOrderStatus(update.itemId, update.toStatus);
            await loadOrders();
        },
        onError: (err) => {
            setError(err.message || 'Failed to update order status');
        },
    });

    // Code Review: Function handleQueueStatusUpdate in client\src\pages\KitchenOrders.jsx. Used in: client/src/pages/KitchenOrders.jsx.
    const handleQueueStatusUpdate = (order) => {
        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) return;

        queueStatusUpdate(order.id, order.status, nextStatus);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100">Kitchen Orders</h1>
            {error && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-sm text-gray-500 dark:text-slate-400">
                        {error || 'No kitchen orders assigned.'}
                    </div>
                ) : orders.map(order => (
                    <div key={order.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow p-6 ${order.priority === 'high' ? 'border-l-4 border-red-500' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">{order.orderNumber}</h3>
                                    {order.orderType === 'WALK_IN' && (
                                        <span className="text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded">
                                            WALK-IN
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {order.time ? new Date(order.time).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="mb-4">
                            <p className="font-medium mb-2 text-gray-900 dark:text-slate-100">Items:</p>
                            <ul className="list-disc list-inside">
                                {order.items.map((item, idx) => <li key={idx} className="text-gray-700 dark:text-slate-300">{item}</li>)}
                            </ul>
                        </div>
                        {order.specialInstructions && (
                            <div className="mb-4 rounded border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">Special Instructions</p>
                                <p className="mt-1 text-sm text-amber-900 dark:text-amber-300 whitespace-pre-wrap break-words">{order.specialInstructions}</p>
                            </div>
                        )}
                        <div className="flex gap-2">
                            {getPendingUpdate(order.id) ? (
                                <>
                                    <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded px-2 py-1 flex items-center">
                                        Status update pending
                                    </div>
                                    <Button size="sm" variant="success" onClick={() => commitPendingUpdateNow(order.id)}>
                                        Confirm Now
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => cancelPendingUpdate(order.id)}>
                                        Undo
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" onClick={() => handleQueueStatusUpdate(order)} disabled={!getNextStatus(order.status)}>
                                    {getActionLabel(order.status)}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KitchenOrders;
