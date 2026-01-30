import React, { useState } from 'react';
import { FaStar, FaEdit, FaTrash, FaSearch, FaChartLine } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';

const SalesAnalytics = () => {
    const [dateRange, setDateRange] = useState('7days');

    // Mock data
    const salesData = [
        { date: '1/20', revenue: 12450, orders: 24 },
        { date: '1/21', revenue: 15280, orders: 31 },
        { date: '1/22', revenue: 18920, orders: 38 },
        { date: '1/23', revenue: 14670, orders: 29 },
        { date: '1/24', revenue: 21340, orders: 42 },
        { date: '1/25', revenue: 19850, orders: 39 },
    ];

    const categoryData = [
        { name: 'Burgers', value: 35, revenue: 45280 },
        { name: 'Rice & Curry', value: 25, revenue: 32450 },
        { name: 'Pizza', value: 20, revenue: 28920 },
        { name: 'Pasta', value: 12, revenue: 15670 },
        { name: 'Drinks', value: 8, revenue: 8340 },
    ];

    const topItems = [
        { name: 'Chicken Burger', orders: 145, revenue: 65250 },
        { name: 'Rice & Curry', orders: 132, revenue: 46200 },
        { name: 'Margherita Pizza', orders: 89, revenue: 75650 },
        { name: 'Carbonara Pasta', orders: 67, revenue: 40200 },
        { name: 'Garlic Bread', orders: 54, revenue: 8100 },
    ];

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const periodOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
    const avgOrderValue = totalRevenue / totalOrders;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Sales Analytics</h1>
                <p className="text-gray-600">Track performance and insights</p>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white rounded-lg shadow p-4 mb-8">
                <div className="max-w-xs">
                    <Select
                        label="Time Period"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        options={periodOptions}
                    />
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-primary-600">
                                LKR {totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600 mt-1">+12.5% from last period</p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FaChartLine className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                    <p className="text-xs text-green-600 mt-1">+8.3% from last period</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                    <p className="text-2xl font-bold">LKR {avgOrderValue.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">+3.7% from last period</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Customer Retention</p>
                    <p className="text-2xl font-bold">78%</p>
                    <p className="text-xs text-green-600 mt-1">+5.2% from last period</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Revenue Trend */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue (LKR)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Orders Count */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Order Volume</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="orders" fill="#10B981" name="Orders" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Selling Items */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
                    <div className="space-y-3">
                        {topItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-primary-600 font-semibold text-sm">{index + 1}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.orders} orders</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-primary-600">
                                        LKR {item.revenue.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;
