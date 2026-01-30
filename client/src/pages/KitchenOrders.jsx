import React from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const KitchenOrders = () => {
    const orders = [
        { id: 1, orderNumber: 'ORD-001', items: ['2x Chicken Burger', '1x Fries'], time: '5 mins ago', status: 'CONFIRMED', priority: 'high' },
        { id: 2, orderNumber: 'ORD-002', items: ['1x Rice & Curry'], time: '8 mins ago', status: 'PREPARING', priority: 'normal' },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Kitchen Orders</h1>
            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className={`bg-white rounded-lg shadow p-6 ${order.priority === 'high' ? 'border-l-4 border-red-500' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                                <p className="text-sm text-gray-500">{order.time}</p>
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
                            <Button size="sm">Start Preparing</Button>
                            <Button size="sm" variant="outline">Mark Ready</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KitchenOrders;
