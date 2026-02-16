import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/dashboardService';
import { getOrders } from '../services/orderApi';
import {
    FaClipboardList,
    FaUsers,
    FaUserTie,
    FaChartLine,
    FaDollarSign,
    FaShoppingBag,
    FaTruck,
    FaCheckCircle,
} from 'react-icons/fa';

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            try {
                const [statsResponse, ordersResponse] = await Promise.all([
                    adminService.getDashboardStats(),
                    getOrders()
                ]);

                const stats = statsResponse?.stats || statsResponse?.data?.stats || statsResponse?.data || {};
                const apiOrders = ordersResponse.data?.data || ordersResponse.data || [];
                const mappedOrders = apiOrders.slice(0, 4).map((order) => ({
                    id: order.OrderID,
                    orderNumber: order.OrderNumber,
                    customer: order.customer?.Name || 'Unknown',
                    total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                    status: order.Status,
                    time: order.CreatedAt
                }));

                if (isMounted) {
                    setStatsData(stats);
                    setRecentOrders(mappedOrders);
                }
            } catch (error) {
                if (isMounted) {
                    setStatsData(null);
                    setRecentOrders([]);
                }
            }
        };

        loadDashboard();

        return () => {
            isMounted = false;
        };
    }, []);

    const stats = useMemo(() => ([
        {
            title: 'Total Orders',
            value: statsData?.totalOrders ?? 0,
            change: statsData?.todayOrders ? `+${statsData.todayOrders} today` : '—',
            icon: FaClipboardList,
            color: 'bg-blue-500',
            link: '/admin/orders',
        },
        {
            title: 'Active Customers',
            value: statsData?.activeCustomers ?? 0,
            change: '—',
            icon: FaUsers,
            color: 'bg-green-500',
            link: '/admin/customers',
        },
        {
            title: 'Total Revenue',
            value: `LKR ${(statsData?.totalRevenue ?? 0).toLocaleString()}`,
            change: statsData?.todayRevenue ? `+LKR ${statsData.todayRevenue.toLocaleString()} today` : '—',
            icon: FaDollarSign,
            color: 'bg-yellow-500',
            link: '/admin/analytics',
        },
        {
            title: 'Staff Members',
            value: statsData?.totalStaff ?? 0,
            change: '—',
            icon: FaUserTie,
            color: 'bg-purple-500',
            link: '/admin/staff',
        },
    ]), [statsData]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return <FaClipboardList className="text-yellow-500" />;
            case 'PREPARING':
                return <FaShoppingBag className="text-orange-500" />;
            case 'OUT_FOR_DELIVERY':
                return <FaTruck className="text-indigo-500" />;
            case 'DELIVERED':
                return <FaCheckCircle className="text-green-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={index}
                            to={stat.link}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Recent Orders</h2>
                            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                View All→
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y">
                        {recentOrders.length === 0 ? (
                            <div className="p-6 text-sm text-gray-500">No recent orders yet.</div>
                        ) : recentOrders.map((order) => (
                            <div key={order.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 flex items-center justify-center">
                                            {getStatusIcon(order.status)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{order.orderNumber}</p>
                                            <p className="text-sm text-gray-600">{order.customer}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">LKR {order.total.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">
                                            {order.time ? new Date(order.time).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/admin/menu"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                        >
                            <FaShoppingBag className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">Manage Menu</p>
                        </Link>
                        <Link
                            to="/admin/orders"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                        >
                            <FaClipboardList className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">View Orders</p>
                        </Link>
                        <Link
                            to="/admin/customers"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                        >
                            <FaUsers className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">Customers</p>
                        </Link>
                        <Link
                            to="/admin/analytics"
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                        >
                            <FaChartLine className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">View Analytics</p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Today's Summary */}
            <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow text-white p-6">
                <h2 className="text-xl font-semibold mb-4">Today's Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-primary-200 text-sm">Orders Today</p>
                        <p className="text-3xl font-bold">{statsData?.todayOrders ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-primary-200 text-sm">Revenue Today</p>
                        <p className="text-3xl font-bold">LKR {(statsData?.todayRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-primary-200 text-sm">Pending Orders</p>
                        <p className="text-3xl font-bold">{statsData?.pendingOrders ?? 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
