import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaCashRegister,
    FaCalculator,
    FaClipboardList,
    FaLayerGroup,
    FaDollarSign,
    FaExclamationCircle,
    FaUsers
} from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import { cashierService } from '../services/dashboardService';

const parseApiArray = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.menuItems)) {
        return response.menuItems;
    }

    return [];
};

const parseApiObject = (response) => {
    if (response && typeof response === 'object' && !Array.isArray(response)) {
        if (response.stats && typeof response.stats === 'object') {
            return response.stats;
        }
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            return response.data;
        }
        return response;
    }

    return {};
};

const getMenuItemId = (menuItem) => Number.parseInt(menuItem?.MenuItemID ?? menuItem?.menuItemId, 10);
const getMenuItemName = (menuItem) => menuItem?.Name ?? menuItem?.name ?? 'Unknown Item';
const getMenuItemPrice = (menuItem) => Number.parseFloat(menuItem?.Price ?? menuItem?.price ?? 0);
const getMenuItemStockQuantity = (menuItem) => {
    const stockQuantity = menuItem?.StockQuantity ?? menuItem?.stockQuantity;
    return Number.isFinite(stockQuantity) ? stockQuantity : null;
};

const isMenuItemActive = (menuItem) => {
    const isActive = menuItem?.IsActive ?? menuItem?.isActive;
    return isActive !== false;
};

const isMenuItemAvailable = (menuItem) => {
    const availability = menuItem?.IsAvailable ?? menuItem?.isAvailable;
    return availability !== false;
};

const normalizeMenuItemsForPos = (menuResponse) => {
    const items = parseApiArray(menuResponse);

    return items
        .map((item) => ({
            ...item,
            MenuItemID: getMenuItemId(item),
            Name: getMenuItemName(item),
            Price: getMenuItemPrice(item),
            StockQuantity: getMenuItemStockQuantity(item),
            IsActive: isMenuItemActive(item),
            IsAvailable: isMenuItemAvailable(item)
        }))
        .filter((item) => Number.isInteger(item.MenuItemID))
        .filter((item) => item.IsActive && item.IsAvailable);
};

const getComboPackId = (combo) => Number.parseInt(combo?.ComboID ?? combo?.ComboPackID ?? combo?.comboId, 10);
const normalizeComboPacksForPos = (comboResponse) => {
    const combos = parseApiArray(comboResponse);

    return combos
        .map((combo) => ({
            ...combo,
            ComboID: getComboPackId(combo),
            Name: combo?.Name ?? combo?.name ?? 'Combo Pack',
            Price: Number.parseFloat(combo?.Price ?? combo?.price ?? 0),
            OriginalPrice: Number.parseFloat(combo?.OriginalPrice ?? combo?.originalPrice ?? 0),
            DiscountPercentage: Number.parseFloat(combo?.DiscountPercentage ?? combo?.discountPercentage ?? 0),
            IsActive: combo?.IsActive !== false
        }))
        .filter((combo) => Number.isInteger(combo.ComboID))
        .filter((combo) => combo.IsActive);
};

const createPosEntryKey = (item) => {
    if (item.type === 'combo') {
        return `combo:${item.ComboID}`;
    }

    return `menu:${item.MenuItemID}`;
};

const createOrderEntryKey = (item) => {
    if (item.type === 'combo' || item.comboId) {
        return `combo:${item.comboId}`;
    }

    return `menu:${item.menuItemId}`;
};

const getCatalogStockLimit = (item) => {
    if (item?.type !== 'menu') {
        return null;
    }

    return Number.isFinite(item?.StockQuantity) ? item.StockQuantity : null;
};

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
    const [posItems, setPosItems] = useState([]);
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

    const reconcileWalkInOrderWithCatalog = useCallback((catalogItems) => {
        const catalogByKey = new Map(catalogItems.map((item) => [createPosEntryKey(item), item]));

        setCurrentWalkInOrder((previousOrder) => previousOrder
            .flatMap((orderItem) => {
                const catalogItem = catalogByKey.get(createOrderEntryKey(orderItem));
                if (!catalogItem) {
                    return [];
                }

                const currentQuantity = Number.parseInt(orderItem.quantity, 10) || 0;
                const maxStock = catalogItem.type === 'menu' && Number.isFinite(catalogItem.StockQuantity)
                    ? catalogItem.StockQuantity
                    : null;
                const cappedQuantity = maxStock !== null
                    ? Math.min(Math.max(currentQuantity, 1), Math.max(maxStock, 0))
                    : Math.max(currentQuantity, 1);

                if (cappedQuantity <= 0) {
                    return [];
                }

                return [{
                    ...orderItem,
                    name: catalogItem.Name,
                    price: catalogItem.Price,
                    quantity: cappedQuantity
                }];
            }));
    }, []);

    const loadPosCatalog = useCallback(async () => {
        const [menuResponse, comboResponse] = await Promise.all([
            cashierService.getMenuItemsForPos(),
            cashierService.getComboPacksForPos()
        ]);

        const availableMenuItems = normalizeMenuItemsForPos(menuResponse).map((item) => ({
            ...item,
            type: 'menu'
        }));
        const activeComboPacks = normalizeComboPacksForPos(comboResponse).map((combo) => ({
            ...combo,
            type: 'combo'
        }));
        const nextCatalog = [...activeComboPacks, ...availableMenuItems];

        setPosItems(nextCatalog);
        reconcileWalkInOrderWithCatalog(nextCatalog);
    }, [reconcileWalkInOrderWithCatalog]);

    const loadData = useCallback(async () => {
        const [statsResult, ordersResult, menuResult, comboResult] = await Promise.allSettled([
            cashierService.getDashboardStats(),
            cashierService.getAllOrders({ limit: 5 }),
            cashierService.getMenuItemsForPos(),
            cashierService.getComboPacksForPos()
        ]);

        if (statsResult.status === 'fulfilled') {
            const statsData = parseApiObject(statsResult.value);
            setStats((prev) => ({
                ...prev,
                ...statsData,
                todayRevenue: Number.parseFloat(statsData.todayRevenue || 0),
                walkInOrders: Number.parseInt(statsData.walkInOrders || 0, 10),
                onlineOrders: Number.parseInt(statsData.onlineOrders || 0, 10)
            }));
        }

        if (ordersResult.status === 'fulfilled') {
            const orders = parseApiArray(ordersResult.value);
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
        } else {
            setRecentOrders([]);
        }

        const availableMenuItems = menuResult.status === 'fulfilled'
            ? normalizeMenuItemsForPos(menuResult.value).map((item) => ({ ...item, type: 'menu' }))
            : [];
        const activeComboPacks = comboResult.status === 'fulfilled'
            ? normalizeComboPacksForPos(comboResult.value).map((combo) => ({ ...combo, type: 'combo' }))
            : [];

        if (availableMenuItems.length > 0 || activeComboPacks.length > 0) {
            const nextCatalog = [...activeComboPacks, ...availableMenuItems];
            setPosItems(nextCatalog);
            reconcileWalkInOrderWithCatalog(nextCatalog);
        } else {
            setPosItems([]);
        }
    }, [reconcileWalkInOrderWithCatalog]);

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
                    setPosItems([]);
                }
            }
        };

        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, [loadData]);

    useEffect(() => {
        if (!isWalkInOpen) {
            return undefined;
        }

        let isActive = true;

        const refreshMenu = async () => {
            try {
                if (!isActive) {
                    return;
                }
                await loadPosCatalog();
            } catch (error) {
                if (isActive) {
                    setWalkInError(error.message || 'Failed to refresh POS items for walk-in orders');
                }
            }
        };

        refreshMenu();
        const menuRefreshInterval = setInterval(refreshMenu, 15000);

        return () => {
            isActive = false;
            clearInterval(menuRefreshInterval);
        };
    }, [isWalkInOpen, loadPosCatalog]);

    const addToWalkInOrder = (catalogItem) => {
        setWalkInError('');
        setWalkInSuccess('');

        const stockLimit = getCatalogStockLimit(catalogItem);
        if (stockLimit !== null && stockLimit <= 0) {
            setWalkInError(`${catalogItem.Name} is out of stock today.`);
            return;
        }

        setCurrentWalkInOrder((prev) => {
            const orderEntryKey = createPosEntryKey(catalogItem);
            const existing = prev.find((item) => createOrderEntryKey(item) === orderEntryKey);
            if (existing) {
                if (stockLimit !== null && existing.quantity >= stockLimit) {
                    setWalkInError(`Only ${stockLimit} item(s) available for ${catalogItem.Name} today.`);
                    return prev;
                }

                return prev.map((item) => (
                    createOrderEntryKey(item) === orderEntryKey
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ));
            }

            return [
                ...prev,
                {
                    type: catalogItem.type,
                    menuItemId: catalogItem.type === 'menu' ? catalogItem.MenuItemID : null,
                    comboId: catalogItem.type === 'combo' ? catalogItem.ComboID : null,
                    name: catalogItem.Name,
                    price: Number.parseFloat(catalogItem.Price || 0),
                    quantity: 1
                }
            ];
        });
    };

    const updateWalkInQuantity = (entryKey, delta) => {
        setWalkInError('');
        setCurrentWalkInOrder((prev) => prev
            .map((item) => {
                if (createOrderEntryKey(item) !== entryKey) {
                    return item;
                }

                const catalogItem = posItems.find((catalogEntry) => createPosEntryKey(catalogEntry) === entryKey);
                const stockLimit = getCatalogStockLimit(catalogItem);
                const requestedQuantity = Math.max(item.quantity + delta, 0);

                if (delta > 0 && stockLimit !== null && requestedQuantity > stockLimit) {
                    setWalkInError(`Only ${stockLimit} item(s) available for ${item.name} today.`);
                    return item;
                }

                return { ...item, quantity: requestedQuantity };
            })
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
                    ...(item.menuItemId ? { menu_item_id: item.menuItemId } : {}),
                    ...(item.comboId ? { combo_id: item.comboId } : {}),
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
                            <h4 className="font-semibold mb-3">Available Items</h4>
                            <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
                                {posItems.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">No menu items or combo packs available.</div>
                                ) : posItems.map((item) => (
                                    <button
                                        key={createPosEntryKey(item)}
                                        type="button"
                                        onClick={() => addToWalkInOrder(item)}
                                        className="w-full text-left p-3 hover:bg-gray-50"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.Name}</span>
                                                {item.type === 'combo' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                                                        <FaLayerGroup className="h-3 w-3" /> Combo
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold">LKR {Number(item.Price || 0).toFixed(2)}</span>
                                        </div>
                                        {item.type === 'menu' && Number.isFinite(item.StockQuantity) && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                {item.StockQuantity > 0
                                                    ? `Available today: ${item.StockQuantity}`
                                                    : 'Out of stock today'}
                                            </p>
                                        )}
                                        {item.type === 'combo' && item.OriginalPrice > item.Price && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Save LKR {(item.OriginalPrice - item.Price).toFixed(2)}
                                            </p>
                                        )}
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
                                    <div key={createOrderEntryKey(item)} className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{item.name}</p>
                                                {item.type === 'combo' && (
                                                    <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                                                        Combo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">LKR {item.price.toFixed(2)} each</p>
                                            {item.type === 'menu' && (() => {
                                                const catalogItem = posItems.find((catalogEntry) => createPosEntryKey(catalogEntry) === createOrderEntryKey(item));
                                                const stockLimit = getCatalogStockLimit(catalogItem);
                                                return stockLimit !== null ? (
                                                    <p className="text-xs text-gray-500">Available today: {stockLimit}</p>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateWalkInQuantity(createOrderEntryKey(item), -1)}
                                                className="w-7 h-7 border rounded"
                                            >
                                                -
                                            </button>
                                            <span className="w-7 text-center">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateWalkInQuantity(createOrderEntryKey(item), 1)}
                                                className="w-7 h-7 border rounded disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={(() => {
                                                    const catalogItem = posItems.find((catalogEntry) => createPosEntryKey(catalogEntry) === createOrderEntryKey(item));
                                                    const stockLimit = getCatalogStockLimit(catalogItem);
                                                    return stockLimit !== null && item.quantity >= stockLimit;
                                                })()}
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
