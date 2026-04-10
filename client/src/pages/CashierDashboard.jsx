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
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
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

const DEFAULT_GUEST_CUSTOMER_NAME = 'Walk-in Customer';
const getCustomerId = (customer) => Number.parseInt(customer?.CustomerID ?? customer?.customerId, 10);
const normalizeCustomersForLookup = (customerResponse) => {
    const customers = parseApiArray(customerResponse);

    return customers
        .map((customer) => ({
            ...customer,
            CustomerID: getCustomerId(customer),
            Name: customer?.Name ?? customer?.name ?? 'Unknown Customer',
            Email: customer?.Email ?? customer?.email ?? '',
            Phone: customer?.Phone ?? customer?.phone ?? '',
            AccountStatus: customer?.AccountStatus ?? customer?.accountStatus ?? 'ACTIVE',
            IsActive: customer?.IsActive ?? customer?.isActive ?? true
        }))
        .filter((customer) => Number.isInteger(customer.CustomerID))
        .filter((customer) => customer.Name !== DEFAULT_GUEST_CUSTOMER_NAME);
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

const CALCULATOR_KEYPAD_ROWS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '00', '.']
];

const sanitizeNumericInput = (rawValue, allowDecimal = true) => {
    let sanitized = String(rawValue ?? '').replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');

    if (allowDecimal) {
        const decimalIndex = sanitized.indexOf('.');
        if (decimalIndex !== -1) {
            sanitized = `${sanitized.slice(0, decimalIndex + 1)}${sanitized.slice(decimalIndex + 1).replace(/\./g, '')}`;
        }

        if (sanitized.startsWith('.')) {
            sanitized = `0${sanitized}`;
        }
    }

    return sanitized;
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
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
    const [customerSearchError, setCustomerSearchError] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [calcPrice, setCalcPrice] = useState('');
    const [calcQuantity, setCalcQuantity] = useState('1');

    const [changeBillTotal, setChangeBillTotal] = useState('');
    const [changePaidAmount, setChangePaidAmount] = useState('');
    const [activeCalculatorModal, setActiveCalculatorModal] = useState(null);
    const [activeCalculatorField, setActiveCalculatorField] = useState(null);

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

    const getCalculatorFieldLabel = useCallback((fieldKey) => {
        switch (fieldKey) {
            case 'calcPrice':
                return 'Item Price';
            case 'calcQuantity':
                return 'Quantity';
            case 'changeBillTotal':
                return 'Bill Total';
            case 'changePaidAmount':
                return 'Customer Paid';
            default:
                return 'Calculator';
        }
    }, []);

    const getCalculatorFieldValue = useCallback((fieldKey) => {
        switch (fieldKey) {
            case 'calcPrice':
                return calcPrice;
            case 'calcQuantity':
                return calcQuantity;
            case 'changeBillTotal':
                return changeBillTotal;
            case 'changePaidAmount':
                return changePaidAmount;
            default:
                return '';
        }
    }, [calcPrice, calcQuantity, changeBillTotal, changePaidAmount]);

    const isDecimalCalculatorField = useCallback((fieldKey) => fieldKey !== 'calcQuantity', []);

    const setCalculatorFieldValue = useCallback((fieldKey, nextValue) => {
        const sanitizedValue = sanitizeNumericInput(nextValue, isDecimalCalculatorField(fieldKey));

        switch (fieldKey) {
            case 'calcPrice':
                setCalcPrice(sanitizedValue);
                break;
            case 'calcQuantity':
                setCalcQuantity(sanitizedValue);
                break;
            case 'changeBillTotal':
                setChangeBillTotal(sanitizedValue);
                break;
            case 'changePaidAmount':
                setChangePaidAmount(sanitizedValue);
                break;
            default:
                break;
        }
    }, [isDecimalCalculatorField]);

    const openCalculatorModal = useCallback((modalKey) => {
        setActiveCalculatorModal(modalKey);
        setActiveCalculatorField(modalKey === 'quickBill' ? 'calcPrice' : 'changeBillTotal');
    }, []);

    const handleCalculatorInputChange = useCallback((fieldKey) => (event) => {
        setCalculatorFieldValue(fieldKey, event.target.value);
    }, [setCalculatorFieldValue]);

    const closeCalculatorModal = useCallback(() => {
        setActiveCalculatorModal(null);
        setActiveCalculatorField(null);
    }, []);

    const handleCalculatorKeyPress = useCallback((key) => {
        if (!activeCalculatorField) {
            return;
        }

        const allowDecimal = isDecimalCalculatorField(activeCalculatorField);
        const currentValue = getCalculatorFieldValue(activeCalculatorField);

        if (key === '.' && !allowDecimal) {
            return;
        }

        if (key === '.') {
            if (String(currentValue || '').includes('.')) {
                return;
            }

            setCalculatorFieldValue(activeCalculatorField, currentValue ? `${currentValue}.` : '0.');
            return;
        }

        if (key === '00' && !currentValue) {
            setCalculatorFieldValue(activeCalculatorField, '0');
            return;
        }

        setCalculatorFieldValue(activeCalculatorField, `${currentValue || ''}${key}`);
    }, [activeCalculatorField, getCalculatorFieldValue, isDecimalCalculatorField, setCalculatorFieldValue]);

    const renderCalculatorFieldInput = useCallback((fieldKey) => {
        const isActive = activeCalculatorField === fieldKey;
        const allowDecimal = isDecimalCalculatorField(fieldKey);

        return (
            <div
                className={`rounded-lg border px-4 py-3 transition-colors ${isActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'} `}
            >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{getCalculatorFieldLabel(fieldKey)}</p>
                <input
                    type="text"
                    inputMode={allowDecimal ? 'decimal' : 'numeric'}
                    value={getCalculatorFieldValue(fieldKey)}
                    onFocus={() => setActiveCalculatorField(fieldKey)}
                    onClick={() => setActiveCalculatorField(fieldKey)}
                    onChange={handleCalculatorInputChange(fieldKey)}
                    placeholder="0"
                    className="mt-2 w-full bg-transparent text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                />
            </div>
        );
    }, [activeCalculatorField, getCalculatorFieldLabel, getCalculatorFieldValue, handleCalculatorInputChange, isDecimalCalculatorField]);

    const renderCalculatorKeypad = useCallback(() => {
        if (!activeCalculatorField) {
            return null;
        }

        const allowDecimal = isDecimalCalculatorField(activeCalculatorField);
        const keypadRows = allowDecimal
            ? CALCULATOR_KEYPAD_ROWS
            : CALCULATOR_KEYPAD_ROWS.map((row) => row.filter((key) => key !== '.'));

        return (
            <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-right text-3xl font-semibold text-gray-900">
                    {getCalculatorFieldValue(activeCalculatorField) || '0'}
                </div>
                {keypadRows.map((row) => (
                    <div key={row.join('-')} className="grid grid-cols-3 gap-3">
                        {row.map((key) => (
                            <Button
                                key={key}
                                type="button"
                                variant="outline"
                                size="lg"
                                className="min-h-[56px] text-lg"
                                onClick={() => handleCalculatorKeyPress(key)}
                            >
                                {key}
                            </Button>
                        ))}
                    </div>
                ))}
                <div className="grid grid-cols-3 gap-3">
                    <Button type="button" variant="secondary" onClick={() => setCalculatorFieldValue(activeCalculatorField, '')}>
                        Clear
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setCalculatorFieldValue(activeCalculatorField, String(getCalculatorFieldValue(activeCalculatorField) || '').slice(0, -1))}
                        disabled={!getCalculatorFieldValue(activeCalculatorField)}
                    >
                        Backspace
                    </Button>
                    <Button type="button" onClick={closeCalculatorModal}>
                        Done
                    </Button>
                </div>
            </div>
        );
    }, [activeCalculatorField, closeCalculatorModal, getCalculatorFieldValue, handleCalculatorKeyPress, isDecimalCalculatorField, setCalculatorFieldValue]);

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
            } catch {
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

    useEffect(() => {
        if (!isWalkInOpen) {
            return undefined;
        }

        const searchValue = customerSearchTerm.trim();

        if (!searchValue) {
            setCustomerSearchResults([]);
            setCustomerSearchError('');
            setCustomerSearchLoading(false);
            return undefined;
        }

        let isActive = true;

        const searchTimer = setTimeout(async () => {
            setCustomerSearchLoading(true);
            setCustomerSearchError('');

            try {
                const response = await cashierService.getAllCustomers(searchValue, 8);

                if (!isActive) {
                    return;
                }

                const nextResults = normalizeCustomersForLookup(response)
                    .filter((customer) => customer.CustomerID !== selectedCustomer?.CustomerID);

                setCustomerSearchResults(nextResults);
            } catch (error) {
                if (isActive) {
                    setCustomerSearchResults([]);
                    setCustomerSearchError(error.message || 'Failed to search customers');
                }
            } finally {
                if (isActive) {
                    setCustomerSearchLoading(false);
                }
            }
        }, 250);

        return () => {
            isActive = false;
            clearTimeout(searchTimer);
        };
    }, [customerSearchTerm, isWalkInOpen, selectedCustomer?.CustomerID]);

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

    const selectCustomerForWalkInOrder = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
        setCustomerSearchError('');
        setWalkInError('');
        setWalkInSuccess('');
    };

    const resetWalkInCustomer = () => {
        setSelectedCustomer(null);
        setCustomerSearchTerm('');
        setCustomerSearchResults([]);
        setCustomerSearchError('');
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
                payment_method: walkInPaymentMethod,
                ...(selectedCustomer?.CustomerID ? { customer_id: selectedCustomer.CustomerID } : {})
            };

            const response = await cashierService.createWalkInOrder(payload);
            const orderNumber = response?.data?.OrderNumber || response?.data?.data?.OrderNumber || 'N/A';

            setWalkInSuccess(
                selectedCustomer
                    ? `Walk-in order ${orderNumber} sent to kitchen for ${selectedCustomer.Name}.`
                    : `Walk-in order ${orderNumber} sent to kitchen.`
            );
            setCurrentWalkInOrder([]);
            resetWalkInCustomer();
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

                    <div className="mb-6 rounded-lg border border-gray-200 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-900">Customer Record</h4>
                                <p className="text-sm text-gray-600">
                                    Search by name, email, or phone to attach this walk-in order to a registered customer.
                                </p>
                            </div>
                            {selectedCustomer ? (
                                <button
                                    type="button"
                                    onClick={resetWalkInCustomer}
                                    className="self-start rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    Use Walk-In Guest
                                </button>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                    Using default walk-in guest
                                </span>
                            )}
                        </div>

                        <div className="mt-4">
                            <input
                                type="text"
                                value={customerSearchTerm}
                                onChange={(event) => setCustomerSearchTerm(event.target.value)}
                                placeholder="Search registered customer by name, email, or phone"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                            />
                        </div>

                        {selectedCustomer ? (
                            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                                <p className="font-semibold">{selectedCustomer.Name}</p>
                                <p className="mt-1 text-green-800">
                                    {selectedCustomer.Phone}
                                    {selectedCustomer.Email ? ` • ${selectedCustomer.Email}` : ''}
                                </p>
                                <p className="mt-1 text-xs text-green-700">
                                    This order will be stored under the selected customer account.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                Orders without a selected customer will continue to use the default walk-in guest profile.
                            </div>
                        )}

                        {customerSearchError && (
                            <p className="mt-3 text-sm text-red-600">{customerSearchError}</p>
                        )}

                        {(customerSearchLoading || customerSearchResults.length > 0 || customerSearchTerm.trim()) && (
                            <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-gray-200 divide-y">
                                {customerSearchLoading ? (
                                    <div className="p-3 text-sm text-gray-500">Searching customers...</div>
                                ) : customerSearchResults.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500">
                                        No registered customers matched "{customerSearchTerm.trim()}".
                                    </div>
                                ) : customerSearchResults.map((customer) => {
                                    const isSelectable = customer.AccountStatus === 'ACTIVE' && customer.IsActive !== false;

                                    return (
                                        <button
                                            key={customer.CustomerID}
                                            type="button"
                                            onClick={() => selectCustomerForWalkInOrder(customer)}
                                            disabled={!isSelectable}
                                            className="w-full p-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">{customer.Name}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {customer.Phone}
                                                        {customer.Email ? ` • ${customer.Email}` : ''}
                                                    </p>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isSelectable
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'}`}
                                                >
                                                    {customer.AccountStatus}
                                                </span>
                                            </div>
                                            {!isSelectable && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    Inactive or blocked customers cannot be attached to new orders.
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
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
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                <p>Item Price</p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">{calcPrice || '0'}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                <p>Quantity</p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">{calcQuantity || '0'}</p>
                            </div>
                        </div>
                        <p className="text-lg font-bold">Total = LKR {quickCalcTotal.toFixed(2)}</p>
                        <div className="flex gap-3">
                            <Button type="button" className="flex-1" onClick={() => openCalculatorModal('quickBill')}>
                                Open Calculator
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setCalcPrice('');
                                    setCalcQuantity('1');
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Change Calculator</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                <p>Bill Total</p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">{changeBillTotal || '0'}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                <p>Customer Paid</p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">{changePaidAmount || '0'}</p>
                            </div>
                        </div>
                        <p className={`text-lg font-bold ${changeAmount < 0 ? 'text-red-600' : 'text-green-700'}`}>
                            Change = LKR {changeAmount.toFixed(2)}
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" className="flex-1" onClick={() => openCalculatorModal('change')}>
                                Open Calculator
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setChangeBillTotal('');
                                    setChangePaidAmount('');
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={activeCalculatorModal === 'quickBill'}
                onClose={closeCalculatorModal}
                title="Quick Bill Calculator"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Use one keypad for both fields. Tap the field you want to edit.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {renderCalculatorFieldInput('calcPrice')}
                        {renderCalculatorFieldInput('calcQuantity')}
                    </div>
                    <div className="rounded-lg bg-primary-50 px-4 py-3 text-center">
                        <p className="text-sm text-gray-600">Calculated Total</p>
                        <p className="text-3xl font-bold text-primary-700">LKR {quickCalcTotal.toFixed(2)}</p>
                    </div>
                    {renderCalculatorKeypad()}
                </div>
            </Modal>

            <Modal
                isOpen={activeCalculatorModal === 'change'}
                onClose={closeCalculatorModal}
                title="Change Calculator"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Use one keypad for both fields. Tap the field you want to edit.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {renderCalculatorFieldInput('changeBillTotal')}
                        {renderCalculatorFieldInput('changePaidAmount')}
                    </div>
                    <div className={`rounded-lg px-4 py-3 text-center ${changeAmount < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-sm text-gray-600">Change Due</p>
                        <p className={`text-3xl font-bold ${changeAmount < 0 ? 'text-red-700' : 'text-green-700'}`}>
                            LKR {changeAmount.toFixed(2)}
                        </p>
                    </div>
                    {renderCalculatorKeypad()}
                </div>
            </Modal>
        </div >
    );
};

export default CashierDashboard;
