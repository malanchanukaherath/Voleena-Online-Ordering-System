import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaCashRegister,
    FaCalculator,
    FaClipboardList,
    FaDollarSign,
    FaExclamationCircle,
    FaUsers
} from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import { cashierService } from '../services/dashboardService';

const CashierDashboard = () => {
    const [stats, setStats] = useState({
        pendingOrders: 0,
        todayOrders: 0,
        todayRevenue: 0,
        walkInOrders: 0,
        onlineOrders: 0,
        newCustomers: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isWalkInOpen, setIsWalkInOpen] = useState(false);
    const [currentWalkInOrder, setCurrentWalkInOrder] = useState([]);
    const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('CASH');
    const [walkInSubmitting, setWalkInSubmitting] = useState(false);
    const [walkInError, setWalkInError] = useState('');
    const [walkInSuccess, setWalkInSuccess] = useState('');

    const [calcPrice, setCalcPrice] = useState('');
    const [calcQuantity, setCalcQuantity] = useState('1');

    const [changeBillTotal, setChangeBillTotal] = useState('');
    const [changePaidAmount, setChangePaidAmount] = useState('');

    const walkInTotal = useMemo(() => {
        return currentWalkInOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [currentWalkInOrder]);

    const quickCalcTotal = useMemo(() => {
        const price = Number.parseFloat(calcPrice) || 0;
        const qty = Number.parseInt(calcQuantity, 10) || 0;
        return price * qty;
    }, [calcPrice, calcQuantity]);

    const changeAmount = useMemo(() => {
        const bill = Number.parseFloat(changeBillTotal) || 0;
        const paid = Number.parseFloat(changePaidAmount) || 0;
        return paid - bill;
    }, [changeBillTotal, changePaidAmount]);

    const loadData = useCallback(async () => {
        const [statsResponse, ordersResponse, menuResponse] = await Promise.all([
            cashierService.getDashboardStats(),
            cashierService.getAllOrders({ limit: 5 }),
            cashierService.getMenuItemsForPos()
        ]);

        const statsData = statsResponse.stats || statsResponse.data?.stats || statsResponse.data || {};
        setStats((prev) => ({
            ...prev,
            ...statsData,
            todayRevenue: Number.parseFloat(statsData.todayRevenue || 0),
            walkInOrders: Number.parseInt(statsData.walkInOrders || 0, 10),
            onlineOrders: Number.parseInt(statsData.onlineOrders || 0, 10)
        }));

        const orders = ordersResponse.data || ordersResponse?.data?.data || [];
        const mappedOrders = orders.map((order) => ({
            id: order.OrderID,
            orderNumber: order.OrderNumber,
            customer: order.customer?.Name || 'Unknown',
            total: parseFloat(order.FinalAmount ?? order.TotalAmount ?? 0),
            status: order.Status,
            orderType: order.OrderType,
            isPending: order.Status === 'PENDING'
        }));
        setRecentOrders(mappedOrders);

        const menu = menuResponse.data || menuResponse?.data?.data || [];
        const availableMenuItems = menu.filter((item) => item.IsActive && item.IsAvailable !== false);
        setMenuItems(availableMenuItems);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadDashboardData = async () => {
            try {
                if (isMounted) {
                    await loadData();
                }
            } catch (error) {
                if (isMounted) {
                    setRecentOrders([]);
                    setMenuItems([]);
                }
            }
        };

        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, [loadData]);

    const addToWalkInOrder = (menuItem) => {
        setWalkInError('');
        setWalkInSuccess('');
        setCurrentWalkInOrder((prev) => {
            const existing = prev.find((item) => item.menuItemId === menuItem.MenuItemID);
            if (existing) {
                return prev.map((item) => (
                    item.menuItemId === menuItem.MenuItemID
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ));
            }

            return [
                ...prev,
                {
                    menuItemId: menuItem.MenuItemID,
                    name: menuItem.Name,
                    price: Number.parseFloat(menuItem.Price || 0),
                    quantity: 1
                }
            ];
        });
    };

    const updateWalkInQuantity = (menuItemId, delta) => {
        setCurrentWalkInOrder((prev) => prev
            .map((item) => item.menuItemId === menuItemId
                ? { ...item, quantity: Math.max(item.quantity + delta, 0) }
                : item)
            .filter((item) => item.quantity > 0));
    };

    const clearWalkInOrder = () => {
        setCurrentWalkInOrder([]);
        setWalkInError('');
        setWalkInSuccess('');
    };

    const sendWalkInOrder = async () => {
        if (currentWalkInOrder.length === 0) {
            setWalkInError('Add at least one item before sending to kitchen.');
            return;
        }

        setWalkInSubmitting(true);
        setWalkInError('');
        setWalkInSuccess('');

        try {
            const payload = {
                items: currentWalkInOrder.map((item) => ({
                    menu_item_id: item.menuItemId,
                    quantity: item.quantity
                })),
                payment_method: walkInPaymentMethod
            };

            const response = await cashierService.createWalkInOrder(payload);
            const orderNumber = response?.data?.OrderNumber || response?.data?.data?.OrderNumber || 'N/A';

            setWalkInSuccess(`Walk-in order ${orderNumber} sent to kitchen.`);
            setCurrentWalkInOrder([]);
            await loadData();
        } catch (error) {
            setWalkInError(error.message || 'Failed to create walk-in order');
        } finally {
            setWalkInSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Cashier Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClipboardList className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Today's Orders</p>
                    <p className="text-3xl font-bold">{stats.todayOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaDollarSign className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-gray-600">Today's Revenue</p>
                    <p className="text-3xl font-bold">LKR {Number(stats.todayRevenue || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaCashRegister className="w-8 h-8 text-orange-600 mb-2" />
                    <p className="text-sm text-gray-600">Walk-in Orders</p>
                    <p className="text-3xl font-bold">{stats.walkInOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaUsers className="w-8 h-8 text-purple-600 mb-2" />
                    <p className="text-sm text-gray-600">Online Orders</p>
                    <p className="text-3xl font-bold">{stats.onlineOrders}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        {recentOrders.some(o => o.isPending) && (
                            <FaExclamationCircle className="text-red-600 mr-2" />
                        )}
                        Recent Orders
                    </h3>
                    {recentOrders.some(o => o.isPending) && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                            <p className="text-xs text-yellow-700">
                                Unusual: Pending order detected (orders are normally auto-confirmed)
                            </p>
                        </div>
                    )}
                    <div className="space-y-3">
                        {recentOrders.length === 0 ? (
                            <div className="text-sm text-gray-500">No recent orders.</div>
                        ) : recentOrders.map(order => (
                            <div
                                key={order.id}
                                className={`flex justify-between items-center p-3 rounded border-2 ${order.isPending
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{order.orderNumber}</p>
                                        <p className="text-sm text-gray-600">{order.customer}</p>
                                        <p className="text-xs text-gray-500 mt-1">Type: {order.orderType}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={order.status} type="order" />
                                    <p className="font-semibold">LKR {order.total.toFixed(2)}</p>
                                </div>
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
                        <button
                            type="button"
                            onClick={() => setIsWalkInOpen((prev) => !prev)}
                            className="p-4 border-2 rounded-lg hover:border-primary-500 text-center"
                        >
                            <FaCashRegister className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">New Walk-In Order</p>
                        </button>
                        <Link to="/cashier/customers/new" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaUsers className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">New Customer</p>
                        </Link>
                    </div>
                </div>
            </div>

            {isWalkInOpen && (
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <h3 className="text-lg font-semibold">Walk-In POS</h3>
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600">Payment Method</label>
                            <select
                                value={walkInPaymentMethod}
                                onChange={(e) => setWalkInPaymentMethod(e.target.value)}
                                className="border rounded px-3 py-2 text-sm"
                            >
                                <option value="CASH">CASH</option>
                                <option value="CARD">CARD</option>
                                <option value="ONLINE">ONLINE</option>
                                <option value="WALLET">WALLET</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-3">Menu Items</h4>
                            <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
                                {menuItems.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No menu items available.</div>
                                ) : menuItems.map((item) => (
                                    <button
                                        key={item.MenuItemID}
                                        type="button"
                                        onClick={() => addToWalkInOrder(item)}
                                        className="w-full text-left p-3 hover:bg-gray-50"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{item.Name}</span>
                                            <span className="text-sm font-semibold">LKR {Number(item.Price || 0).toFixed(2)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Current Order</h4>
                            <div className="border rounded-lg p-3 space-y-3 min-h-[220px]">
                                {currentWalkInOrder.length === 0 ? (
                                    <p className="text-sm text-gray-500">No items selected.</p>
                                ) : currentWalkInOrder.map((item) => (
                                    <div key={item.menuItemId} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-500">LKR {item.price.toFixed(2)} each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateWalkInQuantity(item.menuItemId, -1)}
                                                className="w-7 h-7 border rounded"
                                            >
                                                -
                                            </button>
                                            <span className="w-7 text-center">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateWalkInQuantity(item.menuItemId, 1)}
                                                className="w-7 h-7 border rounded"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-gray-600">Total</span>
                                <span className="text-xl font-bold">LKR {walkInTotal.toFixed(2)}</span>
                            </div>

                            {walkInError && <p className="text-sm text-red-600 mt-3">{walkInError}</p>}
                            {walkInSuccess && <p className="text-sm text-green-700 mt-3">{walkInSuccess}</p>}

                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={clearWalkInOrder}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Clear Order
                                </button>
                                <button
                                    type="button"
                                    onClick={sendWalkInOrder}
                                    disabled={walkInSubmitting || currentWalkInOrder.length === 0}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {walkInSubmitting ? 'Sending...' : 'Send to Kitchen'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaCalculator className="text-primary-600" /> Quick Bill Calculator
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600">Item Price</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={calcPrice}
                                onChange={(e) => setCalcPrice(e.target.value)}
                                className="w-full mt-1 border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Quantity</label>
                            <input
                                type="number"
                                min="0"
                                value={calcQuantity}
                                onChange={(e) => setCalcQuantity(e.target.value)}
                                className="w-full mt-1 border rounded px-3 py-2"
                            />
                        </div>
                        <p className="text-lg font-bold">Total = LKR {quickCalcTotal.toFixed(2)}</p>
                        <button
                            type="button"
                            onClick={() => {
                                setCalcPrice('');
                                setCalcQuantity('1');
                            }}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Clear Calculation
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Change Calculator</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600">Bill Total</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={changeBillTotal}
                                onChange={(e) => setChangeBillTotal(e.target.value)}
                                className="w-full mt-1 border rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Customer Paid</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={changePaidAmount}
                                onChange={(e) => setChangePaidAmount(e.target.value)}
                                className="w-full mt-1 border rounded px-3 py-2"
                            />
                        </div>
                        <p className={`text-lg font-bold ${changeAmount < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            Change = LKR {changeAmount.toFixed(2)}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setChangeBillTotal('');
                                setChangePaidAmount('');
                            }}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CashierDashboard;
