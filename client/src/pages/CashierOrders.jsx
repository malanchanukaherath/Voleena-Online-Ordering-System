import React, { useCallback, useEffect, useState } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import { cashierService } from '../services/dashboardService';
import authService from '../services/authService';
import { buildReceiptFromOrder, openReceiptPrintWindow } from '../utils/posReceiptPrint';

const CashierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');
    const [reprintOrderId, setReprintOrderId] = useState('');
    const [reprintStatus, setReprintStatus] = useState('');
    const [reprintError, setReprintError] = useState('');
    const [isReprinting, setIsReprinting] = useState(false);

    const getTerminalId = useCallback(() => {
        const terminalId = String(localStorage.getItem('posTerminalId') || import.meta.env.VITE_POS_TERMINAL_ID || 'WEB-POS-1').trim();
        return terminalId || 'WEB-POS-1';
    }, []);

    const getCashierName = useCallback(() => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.name || currentUser?.Name || currentUser?.email || 'Cashier';
    }, []);

    const reprintReceiptByOrderId = useCallback(async (orderId) => {
        const parsedOrderId = Number.parseInt(orderId, 10);

        if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
            setReprintError('Enter a valid numeric Order ID to reprint.');
            return;
        }

        setIsReprinting(true);
        setReprintError('');
        setReprintStatus('');

        try {
            const receiptResponse = await cashierService.getOrderReceipt(parsedOrderId, getTerminalId());
            const order = receiptResponse?.data || null;
            const receiptPayload = receiptResponse?.receipt || buildReceiptFromOrder(order, {
                terminalId: getTerminalId(),
                cashierName: getCashierName()
            });

            if (!receiptPayload) {
                throw new Error('No receipt data found for this order.');
            }

            openReceiptPrintWindow(receiptPayload);
            setReprintStatus(`Receipt sent to printer for Order ID ${parsedOrderId}.`);
        } catch (reprintErr) {
            setReprintError(reprintErr.message || 'Failed to reprint receipt.');
        } finally {
            setIsReprinting(false);
        }
    }, [getCashierName, getTerminalId]);

    const loadOrders = useCallback(async () => {
        try {
            const response = await cashierService.getAllOrders();
            const data = response.data || response?.data?.data || [];
            const mapped = data.map((order) => ({
                id: order.OrderID,
                orderNumber: order.OrderNumber,
                customer: order.customer?.Name || 'Unknown',
                total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
                status: order.Status,
                orderType: order.OrderType
            }));

            setOrders(mapped);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load orders');
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadOrdersSafely = async () => {
            if (!isActive) return;
            await loadOrders();
        };

        loadOrdersSafely();

        // Poll periodically so customer-created orders appear without manual refresh.
        const intervalId = setInterval(loadOrdersSafely, 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadOrders]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Order Management</h1>
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h2 className="text-lg font-semibold mb-3">Manual Receipt Reprint</h2>
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={reprintOrderId}
                        onChange={(event) => setReprintOrderId(event.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter Order ID"
                        className="border rounded px-3 py-2 text-sm md:w-64"
                    />
                    <button
                        type="button"
                        onClick={() => reprintReceiptByOrderId(reprintOrderId)}
                        disabled={isReprinting || !reprintOrderId}
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                        {isReprinting ? 'Reprinting...' : 'Reprint by Order ID'}
                    </button>
                </div>
                {reprintStatus && <p className="text-sm text-green-700 mt-2">{reprintStatus}</p>}
                {reprintError && <p className="text-sm text-red-600 mt-2">{reprintError}</p>}
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Orders are now automatically confirmed when created and sent directly to the kitchen to prevent delays.
                </p>
            </div>
            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.length === 0 ? (
                                <tr>
                                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={7}>
                                        {error || 'No orders available.'}
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                                    <td className="px-6 py-4">{order.id}</td>
                                    <td className="px-6 py-4">{order.customer}</td>
                                    <td className="px-6 py-4">{order.orderType}</td>
                                    <td className="px-6 py-4">LKR {order.total.toFixed(2)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={() => reprintReceiptByOrderId(order.id)}
                                            disabled={isReprinting}
                                            className="px-3 py-1.5 border rounded text-sm hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            Reprint
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashierOrders;
