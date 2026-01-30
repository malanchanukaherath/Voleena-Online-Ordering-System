import React, { useState } from 'react';
import { FaSearch, FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const OrderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock orders data
    const orders = [
        {
            id: 1,
            orderNumber: 'ORD-2024-001',
            customerName: 'John Doe',
            customerPhone: '+94 71 234 5678',
            orderType: 'DELIVERY',
            status: 'PENDING',
            total: 1450.00,
            items: 3,
            createdAt: '2024-01-25 10:30 AM',
            assignedStaff: null,
        },
        {
            id: 2,
            orderNumber: 'ORD-2024-002',
            customerName: 'Jane Smith',
            customerPhone: '+94 77 345 6789',
            orderType: 'TAKEAWAY',
            status: 'PREPARING',
            total: 850.00,
            items: 2,
            createdAt: '2024-01-25 10:15 AM',
            assignedStaff: 'Kitchen Staff 1',
        },
        {
            id: 3,
            orderNumber: 'ORD-2024-003',
            customerName: 'Bob Wilson',
            customerPhone: '+94 76 456 7890',
            orderType: 'DELIVERY',
            status: 'OUT_FOR_DELIVERY',
            total: 2150.00,
            items: 5,
            createdAt: '2024-01-25 09:45 AM',
            assignedStaff: 'Delivery Person 2',
        },
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'PREPARING', label: 'Preparing' },
        { value: 'READY', label: 'Ready' },
        { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ];

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusUpdate = (orderId, newStatus) => {
        console.log(`Updating order ${orderId} to ${newStatus}`);
        // In production, call API to update status
    };

    const handleAssignStaff = (orderId) => {
        console.log(`Assigning staff to order ${orderId}`);
        // In production, open modal to select staff
    };

    const handleViewDetails = (orderId) => {
        console.log(`Viewing order details ${orderId}`);
        // In production, navigate to order details page or open modal
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Order Management</h1>
                <p className="text-gray-600">View and manage all customer orders</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
            </div>

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
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
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
                                            <Select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                options={statusOptions.slice(1)}
                                                className="text-xs"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                LKR {order.total.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{order.createdAt}</div>
                                            {order.assignedStaff && (
                                                <div className="text-xs text-gray-400">{order.assignedStaff}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(order.id)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                {!order.assignedStaff && (
                                                    <button
                                                        onClick={() => handleAssignStaff(order.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Assign Staff"
                                                    >
                                                        <FaPlus />
                                                    </button>
                                                )}
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
                    description="No orders match your search criteria"
                    action={
                        <Button onClick={() => { setSearchTerm(''); setStatusFilter(''); }}>
                            Clear Filters
                        </Button>
                    }
                />
            )}
        </div>
    );
};

export default OrderManagement;
