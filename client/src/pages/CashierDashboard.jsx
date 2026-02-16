import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaTruck, FaUsers, FaDollarSign } from 'react-icons/fa';
import { cashierService } from '../services/dashboardService';

const CashierDashboard = () => {
    const [stats, setStats] = useState({
        pendingOrders: 0,
        todayOrders: 0,
        todayRevenue: 0,
        newCustomers: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const [statsResponse, ordersResponse] = await Promise.all([
                    cashierService.getDashboardStats(),
                    cashierService.getAllOrders({ status: 'PENDING', limit: 5 })
                ]);

                if (isMounted) {
                    setStats(statsResponse.stats || statsResponse.data?.stats || statsResponse.data || stats);
                    const orders = ordersResponse.data || ordersResponse?.data?.data || [];
                    const mappedOrders = orders.map((order) => ({
                        id: order.OrderID,
                        orderNumber: order.OrderNumber,
                        customer: order.customer?.Name || 'Unknown',
                        total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                        status: order.Status
                    }));
                    setRecentOrders(mappedOrders);
                }
            } catch (error) {
                if (isMounted) {
                    setRecentOrders([]);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Cashier Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClipboardList className="w-8 h-8 text-yellow-600 mb-2" />
                    <p className="text-sm text-gray-600">Pending Orders</p>
                    <p className="text-3xl font-bold">{stats.pendingOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClipboardList className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Today's Orders</p>
                    <p className="text-3xl font-bold">{stats.todayOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaDollarSign className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-gray-600">Today's Revenue</p>
                    <p className="text-3xl font-bold">LKR {stats.todayRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaUsers className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="text-sm text-gray-600">New Customers</p>
                    <p className="text-3xl font-bold">{stats.newCustomers}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Pending Orders</h3>
                    <div className="space-y-3">
                        {recentOrders.length === 0 ? (
                            <div className="text-sm text-gray-500">No pending orders.</div>
                        ) : recentOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <div>
                                    <p className="font-medium">{order.orderNumber}</p>
                                    <p className="text-sm text-gray-600">{order.customer}</p>
                                </div>
                                <p className="font-semibold">LKR {order.total.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                    <Link to="/cashier/orders" className="block mt-4 text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/cashier/orders" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaClipboardList className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">Manage Orders</p>
                        </Link>
                        <Link to="/cashier/customers/new" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaUsers className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">New Customer</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashierDashboard;
