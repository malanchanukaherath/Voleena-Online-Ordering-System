import React, { useEffect, useMemo, useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Select from '../components/ui/Select';
import { adminService } from '../services/dashboardService';

const SalesAnalytics = () => {
    const [dateRange, setDateRange] = useState('7days');

    const [salesData, setSalesData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const periodOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    useEffect(() => {
        let isMounted = true;

        const loadAnalytics = async () => {
            try {
                setLoading(true);
                const now = new Date();
                const targetDate = dateRange === 'lastMonth'
                    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    : new Date(now.getFullYear(), now.getMonth(), 1);
                const year = targetDate.getFullYear();
                const month = targetDate.getMonth() + 1;

                const [salesResponse, bestSellingResponse] = await Promise.all([
                    adminService.getMonthlySalesReport(year, month),
                    adminService.getBestSellingItems(10)
                ]);

                const salesRows = salesResponse.data || salesResponse?.data?.data || [];
                const mappedSales = salesRows.map((row) => ({
                    date: row.date,
                    revenue: parseFloat(row.revenue || 0),
                    orders: parseInt(row.orderCount || 0, 10)
                }));

                const bestSelling = bestSellingResponse.data || bestSellingResponse?.data?.data || [];
                const mappedTopItems = bestSelling.map((item) => ({
                    name: item.Name,
                    orders: parseInt(item.totalSold || 0, 10),
                    revenue: parseFloat(item.totalRevenue || 0)
                }));

                const categoryMap = new Map();
                bestSelling.forEach((item) => {
                    const key = item.CategoryName || 'Uncategorized';
                    const current = categoryMap.get(key) || { name: key, value: 0, revenue: 0 };
                    const revenue = parseFloat(item.totalRevenue || 0);
                    current.value += revenue;
                    current.revenue += revenue;
                    categoryMap.set(key, current);
                });

                let filteredSales = mappedSales;
                if (dateRange === '7days' || dateRange === '30days') {
                    const days = dateRange === '7days' ? 7 : 30;
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - days);
                    filteredSales = mappedSales.filter((row) => new Date(row.date) >= cutoff);
                }

                if (isMounted) {
                    setSalesData(filteredSales);
                    setTopItems(mappedTopItems);
                    setCategoryData(Array.from(categoryMap.values()));
                }
            } catch {
                if (isMounted) {
                    setSalesData([]);
                    setTopItems([]);
                    setCategoryData([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadAnalytics();

        return () => {
            isMounted = false;
        };
    }, [dateRange]);

    const totalRevenue = useMemo(() => salesData.reduce((sum, day) => sum + day.revenue, 0), [salesData]);
    const totalOrders = useMemo(() => salesData.reduce((sum, day) => sum + day.orders, 0), [salesData]);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

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
                            <p className="text-xs text-gray-500 mt-1">{loading ? 'Loading...' : 'Updated from orders'}</p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FaChartLine className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                    <p className="text-xs text-gray-500 mt-1">{loading ? 'Loading...' : 'From selected range'}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                    <p className="text-2xl font-bold">LKR {avgOrderValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">{loading ? 'Loading...' : 'Calculated'}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Customer Retention</p>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-xs text-gray-500 mt-1">Needs retention metrics endpoint</p>
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
                        {topItems.length === 0 ? (
                            <div className="text-sm text-gray-500">No sales data available.</div>
                        ) : topItems.map((item, index) => (
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
