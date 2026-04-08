import React, { useCallback, useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import { cashierService } from '../services/dashboardService';

const CashierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');

    const loadOrders = useCallback(async () => {
        try {
            const response = await cashierService.getAllOrders();
            const data = response.data || response?.data?.data || [];
            const mapped = data.map((order) => ({
                id: order.OrderID,
                orderNumber: order.OrderNumber,
                customer: order.customer?.Name || 'Unknown',
                total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                status: order.Status,
                orderType: order.OrderType
            }));

            setOrders(mapped);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load orders');
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadOrdersSafely = async () => {
            if (!isActive) return;
            await loadOrders();
        };

        loadOrdersSafely();

        // Poll periodically so customer-created orders appear without manual refresh.
        const intervalId = setInterval(loadOrdersSafely, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadOrders]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Order Management</h1>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Orders are now automatically confirmed when created and sent directly to the kitchen to prevent delays.
                </p>
            </div>
            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={5}>
                                        {error || 'No orders available.'}
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                                    <td className="px-6 py-4">{order.customer}</td>
                                    <td className="px-6 py-4">{order.orderType}</td>
                                    <td className="px-6 py-4">LKR {order.total.toFixed(2)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashierOrders;
