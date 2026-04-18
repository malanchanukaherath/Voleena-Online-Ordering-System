import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/dashboardService';
import { getOrders } from '../services/orderApi';
import StatusBadge from '../components/ui/StatusBadge';
import {
    FaClipboardList,
    FaUsers,
    FaUserTie,
    FaChartLine,
    FaShoppingBag,
    FaTruck,
    FaCheckCircle,
    FaArrowRight,
} from 'react-icons/fa';

const RevenueCurrencyIcon = ({ className = '' }) => (
    <span className={`${className} inline-flex items-center justify-center text-sm font-bold leading-none`}>LKR</span>
);

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);

    const loadDashboard = useCallback(async () => {
        try {
            const [statsResponse, ordersResponse] = await Promise.all([
                adminService.getDashboardStats(),
                getOrders()
            ]);

            const stats = statsResponse?.stats || statsResponse?.data?.stats || statsResponse?.data || {};
            const apiOrders = ordersResponse.data?.data || ordersResponse.data || [];
            const mappedOrders = apiOrders
                .map((order) => ({
                    id: order.OrderID,
                    orderNumber: order.OrderNumber,
                    customer: order.customer?.Name || 'Unknown',
                    total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                    status: order.Status,
                    time: order.CreatedAt || order.createdAt || order.created_at
                }))
                .sort((a, b) => {
                    const aTime = new Date(a.time || 0).getTime();
                    const bTime = new Date(b.time || 0).getTime();
                    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
                })
                .slice(0, 4);

            setStatsData(stats);
            setRecentOrders(mappedOrders);
        } catch {
            // Keep current dashboard data if a refresh attempt fails.
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadDashboardSafely = async () => {
            if (!isActive) return;
            await loadDashboard();
        };

        loadDashboardSafely();

        // Keep dashboard KPIs and recent order statuses in sync.
        const intervalId = setInterval(loadDashboardSafely, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadDashboard]);

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
            icon: RevenueCurrencyIcon,
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
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={index}
                            to={stat.link}
                            className="card p-5 motion-surface group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                                    <p className="text-xs text-secondary-600 mt-1 font-medium">{stat.change}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-xl shrink-0 ml-3 shadow-sm`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
                            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center gap-1">
                                View All <FaArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {recentOrders.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">No recent orders yet.</div>
                        ) : recentOrders.map((order) => (
                            <div key={order.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 shrink-0">
                                            {getStatusIcon(order.status)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 truncate">{order.orderNumber}</p>
                                            <p className="text-xs text-gray-500 truncate">{order.customer}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-sm text-gray-900">LKR {order.total.toFixed(2)}</p>
                                        <StatusBadge status={order.status} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { to: '/admin/menu', icon: FaShoppingBag, label: 'Manage Menu' },
                            { to: '/admin/orders', icon: FaClipboardList, label: 'View Orders' },
                            { to: '/admin/customers', icon: FaUsers, label: 'Customers' },
                            { to: '/admin/analytics', icon: FaChartLine, label: 'Analytics' },
                            { to: '/delivery/map', icon: FaTruck, label: 'Live Map' },
                        ].map(({ to, icon: Icon, label }) => (
                            <Link
                                key={to}
                                to={to}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/60 transition-all duration-150 text-center group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                    <Icon className="w-5 h-5 text-primary-600" />
                                </div>
                                <p className="text-xs font-semibold text-gray-700 group-hover:text-primary-700">{label}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Today's Summary */}
            <div className="mt-6 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 rounded-2xl text-white p-6" style={{ boxShadow: '0 4px 24px -4px rgba(220,38,38,0.25)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold">Today's Summary</h2>
                    <span className="text-xs text-primary-200 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <p className="text-primary-200 text-xs font-semibold uppercase tracking-wide">Orders Today</p>
                        <p className="text-3xl font-bold mt-1">{statsData?.todayOrders ?? 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <p className="text-primary-200 text-xs font-semibold uppercase tracking-wide">Revenue Today</p>
                        <p className="text-3xl font-bold mt-1">LKR {(statsData?.todayRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <p className="text-primary-200 text-xs font-semibold uppercase tracking-wide">Active Orders</p>
                        <p className="text-3xl font-bold mt-1">{statsData?.activeOrders ?? 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
