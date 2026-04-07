import React, { useEffect, useMemo, useState } from 'react';
import { FaChartLine } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Select from '../components/ui/Select';
import { adminService } from '../services/dashboardService';

const SalesAnalytics = () => {
    const [dateRange, setDateRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const [salesData, setSalesData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [retentionStats, setRetentionStats] = useState({
        retentionRate: 0,
        retainedCustomers: 0,
        totalCustomers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const periodOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const toInputDateTime = (date) => {
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const toApiDateTime = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    };

    const resolveDateRange = () => {
        const now = new Date();

        if (dateRange === 'custom') {
            const startIso = toApiDateTime(customStart);
            const endIso = toApiDateTime(customEnd);

            if (!startIso || !endIso) {
                return null;
            }

            if (new Date(endIso) < new Date(startIso)) {
                return { error: 'End date must be after start date.' };
            }

            return { startDate: startIso, endDate: endIso };
        }

        let startDate;
        let endDate = new Date(now);

        if (dateRange === '7days') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30days') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
        } else if (dateRange === 'thisMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    };

    useEffect(() => {
        const now = new Date();
        const defaultEnd = new Date(now);
        const defaultStart = new Date(now);
        defaultStart.setDate(defaultStart.getDate() - 7);

        setCustomStart(toInputDateTime(defaultStart));
        setCustomEnd(toInputDateTime(defaultEnd));
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadAnalytics = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const resolvedRange = resolveDateRange();

                if (!resolvedRange) {
                    if (isMounted) {
                        setSalesData([]);
                        setTopItems([]);
                        setCategoryData([]);
                        setRetentionStats({ retentionRate: 0, retainedCustomers: 0, totalCustomers: 0 });
                        setErrorMessage('Please select both start and end date/time for custom range.');
                    }
                    return;
                }

                if (resolvedRange.error) {
                    if (isMounted) {
                        setSalesData([]);
                        setTopItems([]);
                        setCategoryData([]);
                        setRetentionStats({ retentionRate: 0, retainedCustomers: 0, totalCustomers: 0 });
                        setErrorMessage(resolvedRange.error);
                    }
                    return;
                }

                const [salesResponse, bestSellingResponse, retentionResponse] = await Promise.all([
                    adminService.getSalesReport(resolvedRange),
                    adminService.getBestSellingItems(10, resolvedRange.startDate, resolvedRange.endDate),
                    adminService.getCustomerRetention(resolvedRange)
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

                if (isMounted) {
                    setSalesData(mappedSales);
                    setTopItems(mappedTopItems);
                    setCategoryData(Array.from(categoryMap.values()));
                    setRetentionStats({
                        retentionRate: Number(retentionResponse?.data?.retentionRate || 0),
                        retainedCustomers: Number(retentionResponse?.data?.retainedCustomers || 0),
                        totalCustomers: Number(retentionResponse?.data?.totalCustomers || 0),
                    });
                }
            } catch (error) {
                if (isMounted) {
                    setSalesData([]);
                    setTopItems([]);
                    setCategoryData([]);
                    setRetentionStats({ retentionRate: 0, retainedCustomers: 0, totalCustomers: 0 });
                    setErrorMessage(error?.message || 'Failed to load analytics for selected range.');
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
    }, [dateRange, customStart, customEnd]);

    const totalRevenue = useMemo(() => salesData.reduce((sum, day) => sum + day.revenue, 0), [salesData]);
    const totalOrders = useMemo(() => salesData.reduce((sum, day) => sum + day.orders, 0), [salesData]);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Sales Analytics</h1>
                <p className="text-gray-600">Track performance and insights</p>
            </div>

            {errorMessage && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-4 mb-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Select
                        label="Time Period"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        options={periodOptions}
                    />

                    {dateRange === 'custom' && (
                        <>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

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
                    <p className="text-2xl font-bold">{retentionStats.retentionRate.toFixed(2)}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {loading
                            ? 'Loading...'
                            : `${retentionStats.retainedCustomers} of ${retentionStats.totalCustomers} customers placed 2+ delivered orders`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
