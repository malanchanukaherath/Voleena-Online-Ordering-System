import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaCashRegister,
    FaCalculator,
    FaClipboardList,
    FaLayerGroup,
    FaMoneyBillWave,
    FaExclamationCircle,
    FaUsers,
    FaSearch,
    FaPrint,
    FaTimes,
    FaExpand,
    FaCompress
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { cashierService } from '../services/dashboardService';
import authService from '../services/authService';
import { buildReceiptFromOrder, openReceiptPrintWindow } from '../utils/posReceiptPrint';

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

const POS_QUANTITY_KEYPAD_ROWS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '00']
];

const POS_QUICK_CASH_AMOUNTS = [500, 1000, 2000, 5000];

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

const STANDARD_CALCULATOR_ROWS = [
    ['AC', '+/-', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', 'BACK', '=']
];

const CashierDashboard = ({ posOnly = false }) => {
    const getViewportSize = () => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1366,
        height: typeof window !== 'undefined' ? window.innerHeight : 768
    });

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
    const [isPosFullscreen, setIsPosFullscreen] = useState(false);
    const [currentWalkInOrder, setCurrentWalkInOrder] = useState([]);
    const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('CASH');
    const [cashAmountReceived, setCashAmountReceived] = useState('');
    const [posSearchTerm, setPosSearchTerm] = useState('');
    const [activeItemTypeFilter, setActiveItemTypeFilter] = useState('ALL');
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
    const [selectedOrderEntryKey, setSelectedOrderEntryKey] = useState(null);
    const [quantityPadValue, setQuantityPadValue] = useState('');
    const [walkInSubmitting, setWalkInSubmitting] = useState(false);
    const [walkInError, setWalkInError] = useState('');
    const [walkInSuccess, setWalkInSuccess] = useState('');
    const [lastReceipt, setLastReceipt] = useState(null);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
    const [customerSearchError, setCustomerSearchError] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [viewportSize, setViewportSize] = useState(getViewportSize);
    const posSearchInputRef = useRef(null);

    const [calculatorDisplay, setCalculatorDisplay] = useState('0');
    const [calculatorStoredValue, setCalculatorStoredValue] = useState(null);
    const [calculatorOperator, setCalculatorOperator] = useState(null);
    const [calculatorWaitingForOperand, setCalculatorWaitingForOperand] = useState(false);

    const walkInTotal = useMemo(() => {
        return currentWalkInOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [currentWalkInOrder]);

    const parsedCashAmountReceived = useMemo(() => Number.parseFloat(cashAmountReceived) || 0, [cashAmountReceived]);
    const cashChangeDue = useMemo(() => Math.max(parsedCashAmountReceived - walkInTotal, 0), [parsedCashAmountReceived, walkInTotal]);

    const walkInItemCount = useMemo(
        () => currentWalkInOrder.reduce((sum, item) => sum + (Number.parseInt(item.quantity, 10) || 0), 0),
        [currentWalkInOrder]
    );

    const isCompactHeight = useMemo(
        () => posOnly && viewportSize.height < 760,
        [posOnly, viewportSize.height]
    );

    const isUltraWide = useMemo(
        () => posOnly && (viewportSize.width / Math.max(viewportSize.height, 1)) >= 2,
        [posOnly, viewportSize.height, viewportSize.width]
    );

    const posCatalogMaxHeight = useMemo(() => {
        if (!posOnly) {
            return '30rem';
        }

        if (viewportSize.height < 650) {
            return '34vh';
        }

        if (viewportSize.height < 820) {
            return '42vh';
        }

        return '52vh';
    }, [posOnly, viewportSize.height]);

    const posBillMaxHeight = useMemo(() => {
        if (!posOnly) {
            return '16rem';
        }

        if (viewportSize.height < 650) {
            return '24vh';
        }

        if (viewportSize.height < 820) {
            return '30vh';
        }

        return '36vh';
    }, [posOnly, viewportSize.height]);

    const posMenuCategories = useMemo(() => {
        const categorySet = new Set();
        posItems.forEach((item) => {
            if (item.type !== 'menu') {
                return;
            }

            const categoryName = item?.category?.Name || item?.category?.name || '';
            if (categoryName) {
                categorySet.add(categoryName);
            }
        });

        return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
    }, [posItems]);

    const filteredPosItems = useMemo(() => {
        const search = posSearchTerm.trim().toLowerCase();

        return posItems.filter((item) => {
            if (activeItemTypeFilter === 'MENU' && item.type !== 'menu') {
                return false;
            }

            if (activeItemTypeFilter === 'COMBO' && item.type !== 'combo') {
                return false;
            }

            if (activeCategoryFilter !== 'ALL' && item.type === 'menu') {
                const itemCategory = item?.category?.Name || item?.category?.name || '';
                if (itemCategory !== activeCategoryFilter) {
                    return false;
                }
            }

            if (!search) {
                return true;
            }

            const searchableText = [
                item.Name,
                item?.category?.Name,
                item?.Description,
                item.type
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(search);
        });
    }, [activeCategoryFilter, activeItemTypeFilter, posItems, posSearchTerm]);

    const selectedOrderItem = useMemo(() => {
        if (!selectedOrderEntryKey) {
            return null;
        }

        return currentWalkInOrder.find((item) => createOrderEntryKey(item) === selectedOrderEntryKey) || null;
    }, [currentWalkInOrder, selectedOrderEntryKey]);

    const formatCalculatorNumber = useCallback((value) => {
        if (!Number.isFinite(value)) {
            return '0';
        }

        const normalized = Number.parseFloat(value.toFixed(8));
        return Number.isFinite(normalized) ? String(normalized) : '0';
    }, []);

    const applyCalculatorOperation = useCallback((left, right, operator) => {
        switch (operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return right === 0 ? null : left / right;
            default:
                return right;
        }
    }, []);

    const clearCalculatorAll = useCallback(() => {
        setCalculatorDisplay('0');
        setCalculatorStoredValue(null);
        setCalculatorOperator(null);
        setCalculatorWaitingForOperand(false);
    }, []);

    const inputCalculatorDigit = useCallback((digit) => {
        if (calculatorDisplay === 'Error') {
            setCalculatorDisplay(digit);
            setCalculatorWaitingForOperand(false);
            return;
        }

        if (calculatorWaitingForOperand) {
            setCalculatorDisplay(digit);
            setCalculatorWaitingForOperand(false);
            return;
        }

        setCalculatorDisplay((previous) => (previous === '0' ? digit : `${previous}${digit}`));
    }, [calculatorDisplay, calculatorWaitingForOperand]);

    const inputCalculatorDecimal = useCallback(() => {
        if (calculatorDisplay === 'Error') {
            setCalculatorDisplay('0.');
            setCalculatorWaitingForOperand(false);
            return;
        }

        if (calculatorWaitingForOperand) {
            setCalculatorDisplay('0.');
            setCalculatorWaitingForOperand(false);
            return;
        }

        setCalculatorDisplay((previous) => (previous.includes('.') ? previous : `${previous}.`));
    }, [calculatorDisplay, calculatorWaitingForOperand]);

    const handleCalculatorOperator = useCallback((nextOperator) => {
        const inputValue = Number.parseFloat(calculatorDisplay);
        if (!Number.isFinite(inputValue)) {
            clearCalculatorAll();
            return;
        }

        if (calculatorStoredValue === null) {
            setCalculatorStoredValue(inputValue);
        } else if (calculatorOperator && !calculatorWaitingForOperand) {
            const computedValue = applyCalculatorOperation(calculatorStoredValue, inputValue, calculatorOperator);
            if (computedValue === null) {
                setCalculatorDisplay('Error');
                setCalculatorStoredValue(null);
                setCalculatorOperator(null);
                setCalculatorWaitingForOperand(true);
                return;
            }

            setCalculatorStoredValue(computedValue);
            setCalculatorDisplay(formatCalculatorNumber(computedValue));
        }

        setCalculatorOperator(nextOperator);
        setCalculatorWaitingForOperand(true);
    }, [applyCalculatorOperation, calculatorDisplay, calculatorOperator, calculatorStoredValue, calculatorWaitingForOperand, clearCalculatorAll, formatCalculatorNumber]);

    const handleCalculatorEquals = useCallback(() => {
        if (!calculatorOperator || calculatorWaitingForOperand) {
            return;
        }

        const inputValue = Number.parseFloat(calculatorDisplay);
        if (!Number.isFinite(inputValue) || calculatorStoredValue === null) {
            return;
        }

        const computedValue = applyCalculatorOperation(calculatorStoredValue, inputValue, calculatorOperator);
        if (computedValue === null) {
            setCalculatorDisplay('Error');
            setCalculatorStoredValue(null);
            setCalculatorOperator(null);
            setCalculatorWaitingForOperand(true);
            return;
        }

        setCalculatorDisplay(formatCalculatorNumber(computedValue));
        setCalculatorStoredValue(null);
        setCalculatorOperator(null);
        setCalculatorWaitingForOperand(true);
    }, [applyCalculatorOperation, calculatorDisplay, calculatorOperator, calculatorStoredValue, calculatorWaitingForOperand, formatCalculatorNumber]);

    const handleCalculatorBackspace = useCallback(() => {
        if (calculatorWaitingForOperand || calculatorDisplay === 'Error') {
            return;
        }

        setCalculatorDisplay((previous) => {
            if (previous.length <= 1) {
                return '0';
            }

            const nextDisplay = previous.slice(0, -1);
            return nextDisplay === '-' ? '0' : nextDisplay;
        });
    }, [calculatorDisplay, calculatorWaitingForOperand]);

    const toggleCalculatorSign = useCallback(() => {
        if (calculatorDisplay === 'Error') {
            return;
        }

        const inputValue = Number.parseFloat(calculatorDisplay);
        if (!Number.isFinite(inputValue)) {
            return;
        }

        setCalculatorDisplay(formatCalculatorNumber(inputValue * -1));
    }, [calculatorDisplay, formatCalculatorNumber]);

    const applyCalculatorPercent = useCallback(() => {
        if (calculatorDisplay === 'Error') {
            return;
        }

        const inputValue = Number.parseFloat(calculatorDisplay);
        if (!Number.isFinite(inputValue)) {
            return;
        }

        setCalculatorDisplay(formatCalculatorNumber(inputValue / 100));
        setCalculatorWaitingForOperand(true);
    }, [calculatorDisplay, formatCalculatorNumber]);

    const handleStandardCalculatorKey = useCallback((key) => {
        if (/^[0-9]$/.test(key)) {
            inputCalculatorDigit(key);
            return;
        }

        switch (key) {
            case '.':
                inputCalculatorDecimal();
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                handleCalculatorOperator(key);
                break;
            case '=':
                handleCalculatorEquals();
                break;
            case 'AC':
                clearCalculatorAll();
                break;
            case 'BACK':
                handleCalculatorBackspace();
                break;
            case '+/-':
                toggleCalculatorSign();
                break;
            case '%':
                applyCalculatorPercent();
                break;
            default:
                break;
        }
    }, [applyCalculatorPercent, clearCalculatorAll, handleCalculatorBackspace, handleCalculatorEquals, handleCalculatorOperator, inputCalculatorDecimal, inputCalculatorDigit, toggleCalculatorSign]);

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

    const getTerminalId = useCallback(() => {
        const terminalId = String(localStorage.getItem('posTerminalId') || import.meta.env.VITE_POS_TERMINAL_ID || 'WEB-POS-1').trim();
        return terminalId || 'WEB-POS-1';
    }, []);

    const getCashierName = useCallback(() => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.name || currentUser?.Name || currentUser?.email || 'Cashier';
    }, []);

    const togglePosFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            await document.documentElement.requestFullscreen();
        } catch {
            setWalkInError('Fullscreen mode is not available in this browser/session.');
        }
    }, []);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsPosFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        onFullscreenChange();

        return () => {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const onResize = () => {
            setViewportSize(getViewportSize());
        };

        onResize();
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, []);

    useEffect(() => {
        if (!posOnly) {
            return undefined;
        }

        const onKeyDown = (event) => {
            const activeTag = document.activeElement?.tagName;
            const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;

            if (event.key === '/' && !isTyping) {
                event.preventDefault();
                posSearchInputRef.current?.focus();
                return;
            }

            if (event.key === 'Escape') {
                setSelectedOrderEntryKey(null);
                setQuantityPadValue('');
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [posOnly]);

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
        if (!posOnly) {
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
    }, [posOnly, loadPosCatalog]);

    useEffect(() => {
        if (!posOnly) {
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
    }, [customerSearchTerm, posOnly, selectedCustomer?.CustomerID]);

    const addToWalkInOrder = (catalogItem) => {
        setWalkInError('');
        setWalkInSuccess('');

        const orderEntryKey = createPosEntryKey(catalogItem);
        setSelectedOrderEntryKey(orderEntryKey);

        const stockLimit = getCatalogStockLimit(catalogItem);
        if (stockLimit !== null && stockLimit <= 0) {
            setWalkInError(`${catalogItem.Name} is out of stock today.`);
            return;
        }

        setCurrentWalkInOrder((prev) => {
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

    const setWalkInQuantity = useCallback((entryKey, nextQuantity) => {
        setWalkInError('');

        setCurrentWalkInOrder((prev) => prev
            .map((item) => {
                if (createOrderEntryKey(item) !== entryKey) {
                    return item;
                }

                const catalogItem = posItems.find((catalogEntry) => createPosEntryKey(catalogEntry) === entryKey);
                const stockLimit = getCatalogStockLimit(catalogItem);
                const requestedQuantity = Math.max(Number.parseInt(nextQuantity, 10) || 0, 0);

                if (stockLimit !== null && requestedQuantity > stockLimit) {
                    setWalkInError(`Only ${stockLimit} item(s) available for ${item.name} today.`);
                    return item;
                }

                return { ...item, quantity: requestedQuantity };
            })
            .filter((item) => item.quantity > 0));
    }, [posItems]);

    const updateWalkInQuantity = (entryKey, delta) => {
        setWalkInError('');
        const currentItem = currentWalkInOrder.find((item) => createOrderEntryKey(item) === entryKey);
        if (!currentItem) {
            return;
        }

        setWalkInQuantity(entryKey, currentItem.quantity + delta);
    };

    const clearWalkInOrder = () => {
        setCurrentWalkInOrder([]);
        setCashAmountReceived('');
        setSelectedOrderEntryKey(null);
        setQuantityPadValue('');
        setWalkInError('');
        setWalkInSuccess('');
    };

    const removeOrderItem = useCallback((entryKey) => {
        setWalkInError('');
        setCurrentWalkInOrder((prev) => prev.filter((item) => createOrderEntryKey(item) !== entryKey));

        if (selectedOrderEntryKey === entryKey) {
            setSelectedOrderEntryKey(null);
            setQuantityPadValue('');
        }
    }, [selectedOrderEntryKey]);

    const handleQuantityPadDigit = useCallback((digit) => {
        setQuantityPadValue((prev) => {
            const next = `${prev || ''}${digit}`;
            const sanitized = sanitizeNumericInput(next, false).slice(0, 4);
            return sanitized;
        });
    }, []);

    const applyQuantityPadValue = useCallback(() => {
        if (!selectedOrderEntryKey) {
            setWalkInError('Select an item in the cart before using quantity keypad.');
            return;
        }

        const nextQty = Number.parseInt(quantityPadValue, 10);
        if (!Number.isInteger(nextQty) || nextQty < 0) {
            setWalkInError('Enter a valid quantity before applying.');
            return;
        }

        setWalkInQuantity(selectedOrderEntryKey, nextQty);
    }, [quantityPadValue, selectedOrderEntryKey, setWalkInQuantity]);

    const addQuickCashAmount = useCallback((amount) => {
        setCashAmountReceived((prev) => {
            const current = Number.parseFloat(prev) || 0;
            return (current + amount).toFixed(2);
        });
    }, []);

    const clearCashAmountReceived = useCallback(() => {
        setCashAmountReceived('');
    }, []);

    useEffect(() => {
        if (!selectedOrderEntryKey) {
            return;
        }

        const stillExists = currentWalkInOrder.some((item) => createOrderEntryKey(item) === selectedOrderEntryKey);
        if (!stillExists) {
            setSelectedOrderEntryKey(null);
            setQuantityPadValue('');
        }
    }, [currentWalkInOrder, selectedOrderEntryKey]);

    useEffect(() => {
        if (!selectedOrderItem) {
            setQuantityPadValue('');
            return;
        }

        setQuantityPadValue(String(selectedOrderItem.quantity || ''));
    }, [selectedOrderItem]);

    const printReceiptSafely = useCallback((receiptPayload) => {
        openReceiptPrintWindow(receiptPayload);
    }, []);

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

        if (walkInPaymentMethod === 'CASH' && parsedCashAmountReceived < walkInTotal) {
            setWalkInError('Amount received must be at least the order total for cash payments.');
            return;
        }

        setWalkInSubmitting(true);
        setWalkInError('');
        setWalkInSuccess('');

        try {
            const terminalId = getTerminalId();
            const cashierName = getCashierName();
            const amountReceived = walkInPaymentMethod === 'CASH' ? parsedCashAmountReceived : walkInTotal;
            const changeAmount = walkInPaymentMethod === 'CASH' ? cashChangeDue : 0;

            const payload = {
                items: currentWalkInOrder.map((item) => ({
                    ...(item.menuItemId ? { menu_item_id: item.menuItemId } : {}),
                    ...(item.comboId ? { combo_id: item.comboId } : {}),
                    quantity: item.quantity
                })),
                payment_method: walkInPaymentMethod,
                amount_received: amountReceived,
                change_amount: changeAmount,
                terminal_id: terminalId,
                ...(selectedCustomer?.CustomerID ? { customer_id: selectedCustomer.CustomerID } : {})
            };

            const response = await cashierService.createWalkInOrder(payload);
            const createdOrder = response?.data || response?.data?.data || null;
            const orderNumber = createdOrder?.OrderNumber || 'N/A';

            const receiptPayload = response?.receipt || buildReceiptFromOrder(createdOrder, {
                amountReceived,
                change: changeAmount,
                terminalId,
                cashierName,
                paymentMethod: walkInPaymentMethod,
                paymentStatus: walkInPaymentMethod === 'CASH' ? 'PAID' : 'PENDING'
            });

            if (receiptPayload) {
                setLastReceipt(receiptPayload);
                try {
                    printReceiptSafely(receiptPayload);
                } catch (printError) {
                    setWalkInError(printError.message || 'Order saved, but receipt print failed. You can reprint manually.');
                }
            }

            setWalkInSuccess(
                selectedCustomer
                    ? `Walk-in order ${orderNumber} sent to kitchen for ${selectedCustomer.Name}.`
                    : `Walk-in order ${orderNumber} sent to kitchen.`
            );
            setCurrentWalkInOrder([]);
            setCashAmountReceived('');
            resetWalkInCustomer();
            await loadData();
        } catch (error) {
            setWalkInError(error.message || 'Failed to create walk-in order');
        } finally {
            setWalkInSubmitting(false);
        }
    };

    const reprintLastReceipt = () => {
        if (!lastReceipt) {
            setWalkInError('No receipt available to reprint yet.');
            return;
        }

        setWalkInError('');
        try {
            printReceiptSafely(lastReceipt);
        } catch (error) {
            setWalkInError(error.message || 'Failed to reprint receipt.');
        }
    };

    return (
        <div className={posOnly ? 'min-h-screen bg-gray-50 p-4 md:p-6' : 'p-6'}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
                <h1 className="text-3xl font-bold">{posOnly ? 'Cashier POS' : 'Cashier Dashboard'}</h1>
                {posOnly && (
                    <div className="flex flex-wrap gap-2">
                        <Link to="/cashier/dashboard" className="px-4 py-2 border rounded hover:bg-gray-100 text-sm font-medium">
                            Back to Dashboard
                        </Link>
                        <button
                            type="button"
                            onClick={togglePosFullscreen}
                            className="px-4 py-2 border rounded hover:bg-gray-100 text-sm font-medium inline-flex items-center gap-2"
                        >
                            {isPosFullscreen ? <FaCompress className="h-4 w-4" /> : <FaExpand className="h-4 w-4" />}
                            {isPosFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                    </div>
                )}
            </div>

            {!posOnly && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClipboardList className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Today's Orders</p>
                    <p className="text-3xl font-bold">{stats.todayOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaMoneyBillWave className="w-8 h-8 text-green-600 mb-2" />
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
                        <Link to="/cashier/pos" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaCashRegister className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">Open POS Full View</p>
                        </Link>
                        <Link to="/cashier/customers/new" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaUsers className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">New Customer</p>
                        </Link>
                    </div>
                </div>
            </div>
                </>
            )}

            {posOnly && (
                <div className="mt-6 bg-white rounded-lg shadow p-3 sm:p-4 xl:p-6">
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

                    {walkInPaymentMethod === 'CASH' && (
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-sm text-gray-600">Amount Received</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={cashAmountReceived}
                                    onChange={(event) => setCashAmountReceived(sanitizeNumericInput(event.target.value, true))}
                                    placeholder="0.00"
                                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="rounded border border-gray-200 px-3 py-2">
                                <p className="text-xs text-gray-500">Amount Due</p>
                                <p className="text-lg font-semibold">LKR {walkInTotal.toFixed(2)}</p>
                            </div>
                            <div className="rounded border border-gray-200 px-3 py-2">
                                <p className="text-xs text-gray-500">Change</p>
                                <p className="text-lg font-semibold text-green-700">LKR {cashChangeDue.toFixed(2)}</p>
                            </div>
                        </div>
                    )}

                    <div className="mb-6 rounded-lg border border-gray-200 p-3 sm:p-4">
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

                    <div className={`grid grid-cols-1 xl:grid-cols-5 ${isUltraWide ? '2xl:grid-cols-7' : '2xl:grid-cols-6'} gap-4 xl:gap-6`}>
                        <div className={`xl:col-span-3 ${isUltraWide ? '2xl:col-span-4' : '2xl:col-span-4'} rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4`}>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <h4 className="font-semibold">POS Catalog</h4>
                                <div className="text-xs text-gray-500">
                                    Cashier: <span className="font-semibold text-gray-700">{getCashierName()}</span> • Terminal: <span className="font-semibold text-gray-700">{getTerminalId()}</span>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        ref={posSearchInputRef}
                                        type="text"
                                        value={posSearchTerm}
                                        onChange={(event) => setPosSearchTerm(event.target.value)}
                                        placeholder="Search item/category/type (press /)"
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
                                    />
                                </div>
                                <select
                                    value={activeCategoryFilter}
                                    onChange={(event) => setActiveCategoryFilter(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="ALL">All Categories</option>
                                    {posMenuCategories.map((categoryName) => (
                                        <option key={categoryName} value={categoryName}>{categoryName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {[
                                    { key: 'ALL', label: 'All Items' },
                                    { key: 'MENU', label: 'Menu Only' },
                                    { key: 'COMBO', label: 'Combos Only' }
                                ].map((filter) => (
                                    <button
                                        key={filter.key}
                                        type="button"
                                        onClick={() => setActiveItemTypeFilter(filter.key)}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${activeItemTypeFilter === filter.key
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-white border border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-600'}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 overflow-y-auto pr-1" style={{ maxHeight: posCatalogMaxHeight }}>
                                {filteredPosItems.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                                        No POS items match this filter.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                                        {filteredPosItems.map((item) => {
                                            const entryKey = createPosEntryKey(item);
                                            const inCartItem = currentWalkInOrder.find((orderItem) => createOrderEntryKey(orderItem) === entryKey);

                                            return (
                                                <button
                                                    key={entryKey}
                                                    type="button"
                                                    onClick={() => addToWalkInOrder(item)}
                                                    className="rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-primary-400 hover:shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="font-semibold text-gray-900 line-clamp-2">{item.Name}</p>
                                                        <p className="font-semibold text-primary-700">LKR {Number(item.Price || 0).toFixed(2)}</p>
                                                    </div>

                                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                                        <span className={`rounded-full px-2 py-0.5 font-semibold ${item.type === 'combo'
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'bg-gray-100 text-gray-700'}`}
                                                        >
                                                            {item.type === 'combo' ? 'Combo' : (item?.category?.Name || 'Menu')}
                                                        </span>
                                                        {item.type === 'combo' && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                                                                <FaLayerGroup className="h-3 w-3" /> Pack
                                                            </span>
                                                        )}
                                                        {inCartItem && (
                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                                                                In cart: {inCartItem.quantity}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {item.type === 'menu' && Number.isFinite(item.StockQuantity) && (
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            {item.StockQuantity > 0 ? `Available today: ${item.StockQuantity}` : 'Out of stock today'}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`xl:col-span-2 2xl:col-span-2 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 ${isCompactHeight ? 'space-y-3' : ''}`}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Current Bill</h4>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                    {walkInItemCount} item(s)
                                </span>
                            </div>

                            <div className="mt-4 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: posBillMaxHeight }}>
                                {currentWalkInOrder.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                                        Add menu items from the left catalog.
                                    </div>
                                ) : currentWalkInOrder.map((item) => {
                                    const entryKey = createOrderEntryKey(item);
                                    const isSelected = selectedOrderEntryKey === entryKey;
                                    const catalogItem = posItems.find((catalogEntry) => createPosEntryKey(catalogEntry) === entryKey);
                                    const stockLimit = getCatalogStockLimit(catalogItem);

                                    return (
                                        <div
                                            key={entryKey}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedOrderEntryKey(entryKey)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setSelectedOrderEntryKey(entryKey);
                                                }
                                            }}
                                            className={`rounded-lg border p-3 ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{item.name}</p>
                                                    <p className="text-xs text-gray-500">LKR {item.price.toFixed(2)} each</p>
                                                    {stockLimit !== null && (
                                                        <p className="text-xs text-gray-500">Available: {stockLimit}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        removeOrderItem(entryKey);
                                                    }}
                                                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                                                >
                                                    <FaTimes className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            updateWalkInQuantity(entryKey, -1);
                                                            setSelectedOrderEntryKey(entryKey);
                                                        }}
                                                        className="h-9 w-9 rounded border border-gray-300 bg-white"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            updateWalkInQuantity(entryKey, 1);
                                                            setSelectedOrderEntryKey(entryKey);
                                                        }}
                                                        className="h-9 w-9 rounded border border-gray-300 bg-white"
                                                        disabled={stockLimit !== null && item.quantity >= stockLimit}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <p className="font-semibold">LKR {(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Order Total</span>
                                    <span className="text-xl font-bold text-gray-900">LKR {walkInTotal.toFixed(2)}</span>
                                </div>
                                {walkInPaymentMethod === 'CASH' && (
                                    <div className="mt-2 text-sm text-gray-700">
                                        Received: <span className="font-semibold">LKR {parsedCashAmountReceived.toFixed(2)}</span> • Change: <span className="font-semibold text-green-700">LKR {cashChangeDue.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {walkInPaymentMethod === 'CASH' && (
                                <div className="mt-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Quick Cash Add</p>
                                    <div className="flex flex-wrap gap-2">
                                        {POS_QUICK_CASH_AMOUNTS.map((amount) => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => addQuickCashAmount(amount)}
                                                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:border-primary-500 hover:text-primary-700"
                                            >
                                                +{amount}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setCashAmountReceived(walkInTotal.toFixed(2))}
                                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:border-primary-500 hover:text-primary-700"
                                        >
                                            Exact
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearCashAmountReceived}
                                            className="rounded border border-red-300 bg-white px-3 py-1.5 text-sm text-red-700 hover:border-red-500 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={!cashAmountReceived}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 rounded-lg border border-gray-200 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity Keypad</p>
                                <p className="mt-1 text-sm text-gray-600">
                                    {selectedOrderItem
                                        ? `Editing: ${selectedOrderItem.name}`
                                        : 'Select a cart item to edit quantity quickly'}
                                </p>

                                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-right text-2xl font-semibold">
                                    {quantityPadValue || '0'}
                                </div>

                                <div className="mt-3 space-y-2">
                                    {POS_QUANTITY_KEYPAD_ROWS.map((row) => (
                                        <div key={row.join('-')} className={`grid gap-2 ${row.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                            {row.map((key) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => handleQuantityPadDigit(key)}
                                                    className="rounded border border-gray-300 bg-white px-3 py-3 text-base font-semibold hover:border-primary-500"
                                                    disabled={!selectedOrderItem}
                                                >
                                                    {key}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuantityPadValue((prev) => prev.slice(0, -1))}
                                        className="rounded border border-gray-300 bg-white px-3 py-2 text-xs hover:border-primary-500"
                                        disabled={!selectedOrderItem || !quantityPadValue}
                                    >
                                        Backspace
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuantityPadValue('')}
                                        className="rounded border border-gray-300 bg-white px-3 py-2 text-xs hover:border-primary-500"
                                        disabled={!selectedOrderItem}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyQuantityPadValue}
                                        className="rounded bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                                        disabled={!selectedOrderItem}
                                    >
                                        Apply Qty
                                    </button>
                                </div>
                            </div>

                            {walkInError && <p className="text-sm text-red-600 mt-3">{walkInError}</p>}
                            {walkInSuccess && <p className="text-sm text-green-700 mt-3">{walkInSuccess}</p>}

                            <div className="mt-4 sticky bottom-0 bg-white pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={clearWalkInOrder}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Clear Bill
                                </button>
                                <button
                                    type="button"
                                    onClick={sendWalkInOrder}
                                    disabled={walkInSubmitting || currentWalkInOrder.length === 0}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {walkInSubmitting ? 'Sending...' : 'Complete Order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={reprintLastReceipt}
                                    disabled={!lastReceipt}
                                    className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                >
                                    <FaPrint className="h-4 w-4" /> Reprint
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!posOnly && (
                <div className="mt-8">
                    <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FaCalculator className="text-primary-600" /> Regular Calculator
                        </h3>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                                {calculatorOperator && calculatorStoredValue !== null
                                    ? `${formatCalculatorNumber(calculatorStoredValue)} ${calculatorOperator}`
                                    : 'Standard Calculator'}
                            </p>
                            <p className="mt-1 text-right text-3xl font-bold text-gray-900 break-all">{calculatorDisplay}</p>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                            {STANDARD_CALCULATOR_ROWS.flat().map((key) => {
                                const isOperatorKey = ['/', '*', '-', '+', '='].includes(key);
                                const isUtilityKey = ['AC', '+/-', '%', 'BACK'].includes(key);
                                const label = key === 'BACK' ? '⌫' : key === '/' ? '÷' : key === '*' ? '×' : key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleStandardCalculatorKey(key)}
                                        className={`h-12 rounded border text-sm sm:text-base font-semibold transition-colors ${key === '0' ? 'col-span-1' : ''} ${key === '='
                                            ? 'border-primary-700 bg-primary-600 text-white hover:bg-primary-700'
                                            : isOperatorKey
                                                ? 'border-gray-400 bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                : isUtilityKey
                                                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                                                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CashierDashboard;
