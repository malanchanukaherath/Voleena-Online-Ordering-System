import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import backendApi from '../services/backendApi';
import { getOrders } from '../services/orderApi';

const OrderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
            try {
                setLoading(true);
                const response = await getOrders();
                const apiOrders = response.data?.data || response.data || [];

                const mappedOrders = apiOrders.map((order) => {
                    const itemCount = Array.isArray(order.items)
                        ? order.items.reduce((sum, item) => sum + (item.Quantity || 0), 0)
                        : 0;

                    return {
                        id: order.OrderID,
                        orderNumber: order.OrderNumber,
                        customerName: order.customer?.Name || 'Unknown',
                        customerPhone: order.customer?.Phone || 'N/A',
                        orderType: order.OrderType,
                        status: order.Status,
                        total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                        items: itemCount,
                        createdAt: order.CreatedAt,
                    };
                });

                if (isMounted) {
                    setOrders(mappedOrders);
                    setError('');
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load orders');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, []);

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

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = !statusFilter || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await backendApi.patch(`/api/v1/orders/${orderId}/status`, { status: newStatus });
            setOrders((prev) => prev.map((order) => (
                order.id === orderId ? { ...order, status: newStatus } : order
            )));
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to update status');
        }
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
                                            <div className="text-sm text-gray-500">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
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
