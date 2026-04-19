import React, { useCallback, useEffect, useState } from 'react';
import {
    FaChartLine,
    FaClipboardList,
    FaCommentDots,
    FaMoneyBillWave,
    FaFileCsv,
    FaPrint,
    FaTruck
} from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { adminService } from '../services/dashboardService';

const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#9333EA'];
const EMPTY_REPORT = {
    generatedAt: '',
    range: {
        startDate: '',
        endDate: '',
        label: ''
    },
    summary: {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        walkInOrders: 0,
        onlineOrders: 0,
        deliveryOrders: 0,
        takeawayOrders: 0,
        uniqueCustomers: 0,
        newCustomers: 0,
        cancellationRate: 0
    },
    revenueTrend: [],
    orderTypeBreakdown: [],
    orderStatusBreakdown: [],
    paymentBreakdown: [],
    topItems: [],
    categoryBreakdown: [],
    customerRetention: {
        totalCustomers: 0,
        retainedCustomers: 0,
        retentionRate: 0
    },
    deliveryPerformance: {
        totalDeliveries: 0,
        assignedCount: 0,
        activeCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        avgDeliveryMinutes: 0,
        onTimeDeliveries: 0,
        onTimeRate: 0
    },
    stockMovementBreakdown: [],
    feedbackSummary: {
        totalFeedback: 0,
        averageRating: 0,
        respondedCount: 0,
        pendingReplies: 0,
        positiveTagBreakdown: [],
        issueTagBreakdown: []
    }
};

// Code Review: Function toInputDateTime in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const toInputDateTime = (date) => {
    // Code Review: Function pad in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Code Review: Function toApiDateTime in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const toApiDateTime = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

// Code Review: Function formatCurrency in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx, client/src/utils/helpers.js, client/src/utils/posReceiptPrint.js.
const formatCurrency = (value) => `LKR ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})}`;

// Code Review: Function formatPercent in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

// Code Review: Function escapeHtml in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx, client/src/utils/posReceiptPrint.js.
const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Code Review: Function csvValue in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const csvValue = (value) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

// Code Review: Function downloadCsv in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const downloadCsv = (filename, rows) => {
    const csv = rows.map((row) => row.map(csvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Code Review: Function buildCsvRows in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const buildCsvRows = (report) => {
    const rows = [
        ['Business Summary Report'],
        ['Generated At', report.generatedAt || ''],
        ['Range', report.range.label || ''],
        [],
        ['Summary'],
        ['Metric', 'Value'],
        ['Total Revenue', report.summary.totalRevenue],
        ['Total Orders', report.summary.totalOrders],
        ['Average Order Value', report.summary.avgOrderValue],
        ['Delivered Orders', report.summary.deliveredOrders],
        ['Cancelled Orders', report.summary.cancelledOrders],
        ['Walk-in Orders', report.summary.walkInOrders],
        ['Online Orders', report.summary.onlineOrders],
        ['Delivery Orders', report.summary.deliveryOrders],
        ['Takeaway Orders', report.summary.takeawayOrders],
        ['Unique Customers', report.summary.uniqueCustomers],
        ['New Customers', report.summary.newCustomers],
        ['Cancellation Rate', report.summary.cancellationRate],
        [],
        ['Revenue Trend'],
        ['Date', 'Revenue', 'Orders'],
        ...report.revenueTrend.map((row) => [row.date, row.revenue, row.orders]),
        [],
        ['Order Type Breakdown'],
        ['Order Type', 'Orders', 'Revenue'],
        ...report.orderTypeBreakdown.map((row) => [row.orderType, row.orderCount, row.revenue]),
        [],
        ['Order Status Breakdown'],
        ['Status', 'Orders'],
        ...report.orderStatusBreakdown.map((row) => [row.status, row.orderCount]),
        [],
        ['Payment Breakdown'],
        ['Method', 'Status', 'Transactions', 'Amount'],
        ...report.paymentBreakdown.map((row) => [row.method, row.status, row.transactionCount, row.totalAmount]),
        [],
        ['Top Items'],
        ['Item', 'Type', 'Category', 'Quantity', 'Revenue'],
        ...report.topItems.map((row) => [row.itemName, row.itemKind, row.categoryName, row.totalQuantity, row.totalRevenue]),
        [],
        ['Category Breakdown'],
        ['Category', 'Quantity', 'Revenue'],
        ...report.categoryBreakdown.map((row) => [row.categoryName, row.totalQuantity, row.revenue]),
        [],
        ['Delivery Performance'],
        ['Metric', 'Value'],
        ['Total Deliveries', report.deliveryPerformance.totalDeliveries],
        ['Assigned', report.deliveryPerformance.assignedCount],
        ['In Progress', report.deliveryPerformance.activeCount],
        ['Delivered', report.deliveryPerformance.deliveredCount],
        ['Failed', report.deliveryPerformance.failedCount],
        ['Average Minutes', report.deliveryPerformance.avgDeliveryMinutes],
        ['On Time Deliveries', report.deliveryPerformance.onTimeDeliveries],
        ['On Time Rate', report.deliveryPerformance.onTimeRate],
        [],
        ['Feedback Summary'],
        ['Metric', 'Value'],
        ['Total Feedback', report.feedbackSummary.totalFeedback],
        ['Average Rating', report.feedbackSummary.averageRating],
        ['Responded', report.feedbackSummary.respondedCount],
        ['Pending Replies', report.feedbackSummary.pendingReplies],
        [],
        ['Feedback Positive Tags'],
        ['Tag', 'Count'],
        ...report.feedbackSummary.positiveTagBreakdown.map((row) => [row.tag, row.count]),
        [],
        ['Feedback Issue Tags'],
        ['Tag', 'Count'],
        ...report.feedbackSummary.issueTagBreakdown.map((row) => [row.tag, row.count]),
        [],
        ['Stock Movements'],
        ['Change Type', 'Movement Count', 'Quantity Change'],
        ...report.stockMovementBreakdown.map((row) => [row.changeType, row.movementCount, row.quantityChange])
    ];

    return rows;
};

// Code Review: Function openPrintWindow in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
const openPrintWindow = (report) => {
    const printWindow = window.open('', '_blank', 'width=1100,height=900');

    if (!printWindow) {
        return;
    }

    // Code Review: Function renderTableRows in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
    const renderTableRows = (rows) => rows.map((row) => `
        <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Business Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
                h1, h2 { margin-bottom: 8px; }
                p { margin: 4px 0 12px; color: #4B5563; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
                .summary-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
                .summary-card strong { display: block; font-size: 18px; margin-top: 4px; color: #111827; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0 28px; }
                th, td { border: 1px solid #E5E7EB; padding: 8px 10px; text-align: left; font-size: 13px; }
                th { background: #F3F4F6; }
            </style>
        </head>
        <body>
            <h1>Business Summary Report</h1>
            <p>${escapeHtml(report.range.label || 'Selected period')}</p>
            <p>Generated at: ${escapeHtml(report.generatedAt || '')}</p>

            <div class="summary-grid">
                <div class="summary-card">Revenue<strong>${escapeHtml(formatCurrency(report.summary.totalRevenue))}</strong></div>
                <div class="summary-card">Orders<strong>${escapeHtml(report.summary.totalOrders)}</strong></div>
                <div class="summary-card">Avg Order Value<strong>${escapeHtml(formatCurrency(report.summary.avgOrderValue))}</strong></div>
                <div class="summary-card">Unique Customers<strong>${escapeHtml(report.summary.uniqueCustomers)}</strong></div>
                <div class="summary-card">New Customers<strong>${escapeHtml(report.summary.newCustomers)}</strong></div>
                <div class="summary-card">Cancellation Rate<strong>${escapeHtml(formatPercent(report.summary.cancellationRate))}</strong></div>
            </div>

            <h2>Revenue Trend</h2>
            <table>
                <thead><tr><th>Date</th><th>Revenue</th><th>Orders</th></tr></thead>
                <tbody>${renderTableRows(report.revenueTrend.map((row) => [row.date, formatCurrency(row.revenue), row.orders]))}</tbody>
            </table>

            <h2>Payments</h2>
            <table>
                <thead><tr><th>Method</th><th>Status</th><th>Transactions</th><th>Amount</th></tr></thead>
                <tbody>${renderTableRows(report.paymentBreakdown.map((row) => [row.method, row.status, row.transactionCount, formatCurrency(row.totalAmount)]))}</tbody>
            </table>

            <h2>Top Items</h2>
            <table>
                <thead><tr><th>Item</th><th>Type</th><th>Category</th><th>Quantity</th><th>Revenue</th></tr></thead>
                <tbody>${renderTableRows(report.topItems.map((row) => [row.itemName, row.itemKind, row.categoryName, row.totalQuantity, formatCurrency(row.totalRevenue)]))}</tbody>
            </table>

            <h2>Operations</h2>
            <table>
                <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                <tbody>${renderTableRows([
                    ['Walk-in Orders', report.summary.walkInOrders],
                    ['Online Orders', report.summary.onlineOrders],
                    ['Delivery Orders', report.summary.deliveryOrders],
                    ['Takeaway Orders', report.summary.takeawayOrders],
                    ['Delivered Orders', report.summary.deliveredOrders],
                    ['Cancelled Orders', report.summary.cancelledOrders],
                    ['Average Delivery Minutes', report.deliveryPerformance.avgDeliveryMinutes],
                    ['On Time Delivery Rate', formatPercent(report.deliveryPerformance.onTimeRate)],
                    ['Feedback Average Rating', report.feedbackSummary.averageRating],
                    ['Pending Feedback Replies', report.feedbackSummary.pendingReplies]
                ])}</tbody>
            </table>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};

// Code Review: Function SalesAnalytics in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx, client/src/routes/AppRoutes.jsx.
const SalesAnalytics = () => {
    const [dateRange, setDateRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [reportData, setReportData] = useState(EMPTY_REPORT);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const periodOptions = [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const resolveDateRange = useCallback(() => {
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
    }, [customEnd, customStart, dateRange]);

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

        // Code Review: Function loadAnalytics in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
        const loadAnalytics = async () => {
            try {
                setLoading(true);
                setErrorMessage('');
                const resolvedRange = resolveDateRange();

                if (!resolvedRange) {
                    if (isMounted) {
                        setReportData(EMPTY_REPORT);
                        setErrorMessage('Please select both start and end date/time for custom range.');
                    }
                    return;
                }

                if (resolvedRange.error) {
                    if (isMounted) {
                        setReportData(EMPTY_REPORT);
                        setErrorMessage(resolvedRange.error);
                    }
                    return;
                }

                const businessSummaryResponse = await adminService.getBusinessSummaryReport(resolvedRange);
                const nextReport = businessSummaryResponse?.data || EMPTY_REPORT;

                if (isMounted) {
                    setReportData({
                        ...EMPTY_REPORT,
                        ...nextReport,
                        summary: {
                            ...EMPTY_REPORT.summary,
                            ...(nextReport.summary || {})
                        },
                        range: {
                            ...EMPTY_REPORT.range,
                            ...(nextReport.range || {})
                        },
                        customerRetention: {
                            ...EMPTY_REPORT.customerRetention,
                            ...(nextReport.customerRetention || {})
                        },
                        deliveryPerformance: {
                            ...EMPTY_REPORT.deliveryPerformance,
                            ...(nextReport.deliveryPerformance || {})
                        },
                        feedbackSummary: {
                            ...EMPTY_REPORT.feedbackSummary,
                            ...(nextReport.feedbackSummary || {})
                        }
                    });
                }
            } catch (error) {
                if (isMounted) {
                    setReportData(EMPTY_REPORT);
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
    }, [resolveDateRange]);

    const categoryData = reportData.categoryBreakdown.map((item) => ({
        name: item.categoryName,
        value: item.revenue,
        totalQuantity: item.totalQuantity
    }));
    const topItems = reportData.topItems.map((item) => ({
        name: item.itemName,
        orders: item.totalQuantity,
        revenue: item.totalRevenue,
        category: item.categoryName
    }));
    // Code Review: Function sanitizeFileLabel in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
    const sanitizeFileLabel = (value) => (value || 'report').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

    // Code Review: Function handleExportCsv in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
    const handleExportCsv = () => {
        downloadCsv(
            `${sanitizeFileLabel(reportData.range.label)}-business-summary.csv`,
            buildCsvRows(reportData)
        );
    };

    // Code Review: Function handlePrintReport in client\src\pages\SalesAnalytics.jsx. Used in: client/src/pages/SalesAnalytics.jsx.
    const handlePrintReport = () => {
        openPrintWindow(reportData);
    };

    return (
        <div className="p-6">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="mb-2 text-3xl font-bold">Analytics & Reports</h1>
                    <p className="text-gray-600 dark:text-slate-400">Track sales, operations, payments, and customer performance from one admin report.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={handleExportCsv} disabled={loading}>
                        <FaFileCsv className="mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={handlePrintReport} disabled={loading}>
                        <FaPrint className="mr-2" />
                        Print Report
                    </Button>
                </div>
            </div>

            {errorMessage && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {errorMessage}
                </div>
            )}

            {/* Filter Bar */}
            <div className="mb-8 card p-5">
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
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-slate-300">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700 px-4 py-2.5 text-sm text-gray-600 dark:text-slate-400">
                    <span className="font-semibold text-gray-900 dark:text-slate-200">Report period:</span>{' '}
                    {loading ? 'Loading report...' : reportData.range.label || 'Selected period'}
                </div>
            </div>

            {/* Summary cards */}
            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
                <div className="card p-6 xl:col-span-2 border-l-4 border-l-primary-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Total Revenue</p>
                            <p className="text-2xl font-bold tabular-nums text-primary-600">{formatCurrency(reportData.summary.totalRevenue)}</p>
                            <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">{loading ? 'Loading...' : 'From paid & completed orders'}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 shrink-0">
                            <FaChartLine className="h-5 w-5 text-primary-600" />
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Total Orders</p>
                    <p className="text-2xl font-bold tabular-nums">{reportData.summary.totalOrders}</p>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Delivered: {reportData.summary.deliveredOrders}</p>
                </div>
                <div className="card p-6">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Avg Order Value</p>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(reportData.summary.avgOrderValue)}</p>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Cancel rate: {formatPercent(reportData.summary.cancellationRate)}</p>
                </div>
                <div className="card p-6">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Customer Retention</p>
                    <p className="text-2xl font-bold tabular-nums">{formatPercent(reportData.customerRetention.retentionRate)}</p>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                        {reportData.customerRetention.retainedCustomers} of {reportData.customerRetention.totalCustomers} placed 2+ orders
                    </p>
                </div>
                <div className="card p-6">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">New Customers</p>
                    <p className="text-2xl font-bold tabular-nums">{reportData.summary.newCustomers}</p>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Unique ordering: {reportData.summary.uniqueCustomers}</p>
                </div>
            </div>

            {/* Charts row 1 */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="card p-6">
                    <h3 className="mb-4 text-base font-semibold tracking-tight">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} name="Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="card p-6">
                    <h3 className="mb-4 text-base font-semibold tracking-tight">Order Volume</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="orders" fill="#16A34A" name="Orders" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="card p-6">
                    <h3 className="mb-4 text-base font-semibold tracking-tight">Sales by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={88}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={entry.name || index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="card p-6">
                    <h3 className="mb-4 text-base font-semibold tracking-tight">Top Selling Items</h3>
                    <div className="space-y-2">
                        {topItems.length === 0 ? (
                            <div className="text-sm text-gray-400 dark:text-slate-500">No sales data available for this range.</div>
                        ) : topItems.map((item, index) => (
                            <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100/80 dark:border-slate-700 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-[11px] font-bold text-primary-600">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500">{item.category || 'Uncategorized'} &bull; {item.orders} sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold tabular-nums text-primary-600">{formatCurrency(item.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Operational metrics */}
            <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="card p-6">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <FaClipboardList className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="text-base font-semibold tracking-tight">Order Mix</h3>
                    </div>
                    <div className="space-y-3">
                        {reportData.orderTypeBreakdown.map((item) => (
                            <div key={item.orderType} className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-3 last:border-b-0 last:pb-0">
                                <div>
                                    <p className="font-medium">{item.orderType}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-500">{item.orderCount} orders</p>
                                </div>
                                <p className="font-semibold">{formatCurrency(item.revenue)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">Walk-in</p>
                            <p className="font-semibold">{reportData.summary.walkInOrders}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">Online</p>
                            <p className="font-semibold">{reportData.summary.onlineOrders}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">Delivery</p>
                            <p className="font-semibold">{reportData.summary.deliveryOrders}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">Takeaway</p>
                            <p className="font-semibold">{reportData.summary.takeawayOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <FaMoneyBillWave className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="text-base font-semibold tracking-tight">Payment Reconciliation</h3>
                    </div>
                    <div className="space-y-3">
                        {reportData.paymentBreakdown.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-slate-500">No payment records found for this range.</p>
                        ) : reportData.paymentBreakdown.map((payment) => (
                            <div key={`${payment.method}-${payment.status}`} className="rounded-lg border border-gray-100 dark:border-slate-700 p-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{payment.method}</p>
                                    <span className="rounded-full bg-gray-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-300">{payment.status}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
                                    <span>{payment.transactionCount} transactions</span>
                                    <span className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(payment.totalAmount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <FaTruck className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="text-base font-semibold tracking-tight">Delivery Performance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">Total Deliveries</p>
                            <p className="text-lg font-semibold">{reportData.deliveryPerformance.totalDeliveries}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">On Time Rate</p>
                            <p className="text-lg font-semibold">{formatPercent(reportData.deliveryPerformance.onTimeRate)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">In Progress</p>
                            <p className="text-lg font-semibold">{reportData.deliveryPerformance.activeCount}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">Avg Minutes</p>
                            <p className="text-lg font-semibold">{reportData.deliveryPerformance.avgDeliveryMinutes.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="card p-6">
                    <h3 className="mb-4 text-base font-semibold tracking-tight">Order Status Snapshot</h3>
                    <div className="space-y-3">
                        {reportData.orderStatusBreakdown.map((item) => (
                            <div key={item.status} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-slate-700/50 px-4 py-3">
                                <span className="font-medium">{item.status}</span>
                                <span className="text-lg font-semibold">{item.orderCount}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <FaCommentDots className="h-4 w-4 text-primary-600" />
                        </div>
                        <h3 className="text-base font-semibold tracking-tight">Feedback Summary</h3>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">Total Feedback</p>
                            <p className="text-lg font-semibold">{reportData.feedbackSummary.totalFeedback}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">Average Rating</p>
                            <p className="text-lg font-semibold">{reportData.feedbackSummary.averageRating.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">Responded</p>
                            <p className="text-lg font-semibold">{reportData.feedbackSummary.respondedCount}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-3">
                            <p className="text-gray-500 dark:text-slate-400">Pending Replies</p>
                            <p className="text-lg font-semibold">{reportData.feedbackSummary.pendingReplies}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="font-medium text-gray-700 dark:text-slate-300">Top Issue Tags</p>
                        {reportData.feedbackSummary.issueTagBreakdown.slice(0, 4).map((tag) => (
                            <div key={tag.tag} className="flex items-center justify-between">
                                <span>{tag.tag}</span>
                                <span className="font-semibold">{tag.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="mb-4 text-base font-semibold tracking-tight">Stock Movements</h3>
                    <div className="space-y-3">
                        {reportData.stockMovementBreakdown.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-slate-500">No stock movements found for this range.</p>
                        ) : reportData.stockMovementBreakdown.map((movement) => (
                            <div key={movement.changeType} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-slate-700/50 px-4 py-3">
                                <div>
                                    <p className="font-medium">{movement.changeType}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-500">{movement.movementCount} movements</p>
                                </div>
                                <span className="font-semibold">{movement.quantityChange}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;
