import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { cashierService } from '../services/dashboardService';

const CashierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
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

                if (isMounted) {
                    setOrders(mapped);
                    setError('');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load orders');
                }
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleConfirm = async (orderId) => {
        try {
            await cashierService.confirmOrder(orderId);
            setOrders((prev) => prev.map((order) => (
                order.id === orderId ? { ...order, status: 'CONFIRMED' } : order
            )));
        } catch (err) {
            setError(err.message || 'Failed to confirm order');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Order Management</h1>
            <div className="bg-white rounded-lg shadow">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.length === 0 ? (
                            <tr>
                                <td className="px-6 py-4 text-sm text-gray-500" colSpan={6}>
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
                                <td className="px-6 py-4">
                                    <Button size="sm" onClick={() => handleConfirm(order.id)} disabled={order.status !== 'PENDING'}>
                                        Confirm
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CashierOrders;
