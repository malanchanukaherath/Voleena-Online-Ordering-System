import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { kitchenService } from '../services/dashboardService';

const KitchenOrders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
            try {
                const response = await kitchenService.getAssignedOrders();
                const data = response.data || response?.data?.data || [];
                const mapped = data.map((order) => ({
                    id: order.OrderID,
                    orderNumber: order.OrderNumber,
                    items: (order.orderItems || []).map((item) => `${item.Quantity}x ${item.menuItem?.Name || 'Item'}`),
                    time: order.CreatedAt,
                    status: order.Status,
                    priority: order.Status === 'CONFIRMED' ? 'high' : 'normal'
                }));

                if (isMounted) {
                    setOrders(mapped);
                    setError('');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load kitchen orders');
                }
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, []);

    const getNextStatus = (status) => {
        const map = {
            CONFIRMED: 'PREPARING',
            PREPARING: 'READY'
        };
        return map[status];
    };

    const handleStatusUpdate = async (orderId, status) => {
        const nextStatus = getNextStatus(status);
        if (!nextStatus) return;

        try {
            await kitchenService.updateOrderStatus(orderId, nextStatus);
            setOrders((prev) => prev.map((order) => (
                order.id === orderId ? { ...order, status: nextStatus } : order
            )));
        } catch (err) {
            setError(err.message || 'Failed to update order status');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Kitchen Orders</h1>
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                        {error || 'No kitchen orders assigned.'}
                    </div>
                ) : orders.map(order => (
                    <div key={order.id} className={`bg-white rounded-lg shadow p-6 ${order.priority === 'high' ? 'border-l-4 border-red-500' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                                <p className="text-sm text-gray-500">
                                    {order.time ? new Date(order.time).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="mb-4">
                            <p className="font-medium mb-2">Items:</p>
                            <ul className="list-disc list-inside">
                                {order.items.map((item, idx) => <li key={idx} className="text-gray-700">{item}</li>)}
                            </ul>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleStatusUpdate(order.id, order.status)} disabled={!getNextStatus(order.status)}>
                                {order.status === 'CONFIRMED' ? 'Start Preparing' : 'Mark Ready'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KitchenOrders;
