import React from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const CashierOrders = () => {
    const orders = [
        { id: 1, orderNumber: 'ORD-001', customer: 'John Doe', total: 1450, status: 'PENDING', orderType: 'DELIVERY' },
        { id: 2, orderNumber: 'ORD-002', customer: 'Jane Smith', total: 850, status: 'CONFIRMED', orderType: 'TAKEAWAY' },
    ];

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
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                                <td className="px-6 py-4">{order.customer}</td>
                                <td className="px-6 py-4">{order.orderType}</td>
                                <td className="px-6 py-4">LKR {order.total}</td>
                                <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                <td className="px-6 py-4"><Button size="sm">Confirm</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CashierOrders;
