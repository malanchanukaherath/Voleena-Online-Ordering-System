import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaRedo } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

const OrderHistory = () => {
    const [statusFilter, setStatusFilter] = useState('');

    // Mock order data - will be replaced with real API call
    const orders = [
        {
            id: 1,
            orderNumber: 'ORD-2024-001',
            date: '2024-01-20',
            time: '14:30',
            items: [
                { name: 'Chicken Burger', quantity: 2 },
                { name: 'Fries', quantity: 1 },
            ],
            total: 1450.00,
            status: 'DELIVERED',
            orderType: 'DELIVERY',
        },
        {
            id: 2,
            orderNumber: 'ORD-2024-002',
            date: '2024-01-18',
            time: '19:15',
            items: [
                { name: 'Rice & Curry', quantity: 1 },
                { name: 'Iced Tea', quantity: 2 },
            ],
            total: 850.00,
            status: 'DELIVERED',
            orderType: 'TAKEAWAY',
        },
        {
            id: 3,
            orderNumber: 'ORD-2024-003',
            date: '2024-01-15',
            time: '12:00',
            items: [
                { name: 'Margherita Pizza', quantity: 1 },
                { name: 'Garlic Bread', quantity: 1 },
            ],
            total: 1250.00,
            status: 'CANCELLED',
            orderType: 'DELIVERY',
        },
    ];

    const statusOptions = [
        { value: '', label: 'All Orders' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'PREPARING', label: 'Preparing' },
        { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ];

    const filteredOrders = statusFilter
        ? orders.filter(order => order.status === statusFilter)
        : orders;

    const handleReorder = (orderId) => {
        console.log('Reordering:', orderId);
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
                <div className="max-w-xs">
                    <Select
                        label="Filter by Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={statusOptions}
                    />
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
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
                                    <Link to={`/orders/${order.orderNumber}/track`}>
                                        <Button size="sm" variant="outline">
                                            <FaEye className="inline mr-2" />
                                            View Details
                                        </Button>
                                    </Link>
                                    {order.status === 'DELIVERED' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleReorder(order.id)}
                                        >
                                            <FaRedo className="inline mr-2" />
                                            Reorder
                                        </Button>
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
                        statusFilter ? (
                            <Button onClick={() => setStatusFilter('')}>Clear Filter</Button>
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
