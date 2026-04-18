import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { getCart, setCart, updateCartItem, removeCartItem } from '../utils/cartStorage';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const Cart = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [cartItems, setCartItems] = useState([]);
    const [validatingStock, setValidatingStock] = useState(true);
    const [estimatedBaseDeliveryFee, setEstimatedBaseDeliveryFee] = useState(100);

    useEffect(() => {
        const validateCartStock = async () => {
            const rawCartItems = getCart();
            setCartItems(rawCartItems);

            if (rawCartItems.length === 0) {
                setValidatingStock(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/menu?isActive=true`);
                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    const menuMap = new Map(data.data.map(item => [item.MenuItemID, item]));

                    const validatedItems = rawCartItems.map(cartItem => {
                        if (cartItem.type === 'menu') {
                            const menuItem = menuMap.get(cartItem.id);
                            return {
                                ...cartItem,
                                isAvailable: menuItem?.IsAvailable ?? false,
                                stockQuantity: menuItem?.StockQuantity ?? 0
                            };
                        }
                        return {
                            ...cartItem,
                            isAvailable: true,
                            stockQuantity: null
                        };
                    });

                    setCartItems(validatedItems);
                    setCart(validatedItems);
                }
            } catch (error) {
                console.error('Failed to validate cart stock:', error);
                toast.error('Could not verify item availability');
            } finally {
                setValidatingStock(false);
            }
        };

        validateCartStock();
    }, []);

    useEffect(() => {
        const fetchDeliveryFeeConfig = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/delivery/fee-config`);
                const data = await response.json();

                if (data?.success && Number.isFinite(Number(data?.data?.baseFee))) {
                    setEstimatedBaseDeliveryFee(Number(data.data.baseFee));
                }
            } catch (error) {
                console.warn('Failed to fetch delivery fee config, using default estimate:', error);
            }
        };

        fetchDeliveryFeeConfig();
    }, []);

    const hasFiniteStockLimit = (item) => Number.isFinite(item?.stockQuantity) && item.stockQuantity >= 0;

    const isOutOfStock = (item) => hasFiniteStockLimit(item) && item.stockQuantity === 0;

    const isQuantityOverStock = (item) => hasFiniteStockLimit(item) && item.stockQuantity > 0 && item.quantity > item.stockQuantity;

    const hasItemStockIssue = (item) => item.isAvailable === false || isOutOfStock(item) || isQuantityOverStock(item);

    const updateQuantity = (id, type, delta, cartItemKey) => {
        const currentItem = cartItems.find((item) => {
            if (cartItemKey) {
                return String(item.cartItemKey || '') === String(cartItemKey);
            }
            return item.id === id && item.type === type;
        });
        if (!currentItem) {
            return;
        }

        if (delta > 0 && hasFiniteStockLimit(currentItem)) {
            if (isOutOfStock(currentItem) || currentItem.isAvailable === false) {
                toast.warning(`${currentItem.name} is out of stock today.`);
                return;
            }

            if (currentItem.quantity >= currentItem.stockQuantity) {
                toast.info(`Only ${currentItem.stockQuantity} item(s) available for ${currentItem.name} today.`);
                return;
            }
        }

        const nextQuantity = Math.max(1, currentItem.quantity + delta);
        const nextItems = cartItems.map((item) => {
            const isTarget = cartItemKey
                ? String(item.cartItemKey || '') === String(cartItemKey)
                : (item.id === id && item.type === type);

            if (isTarget) {
                return { ...item, quantity: nextQuantity };
            }
            return item;
        });

        setCartItems(nextItems);
        updateCartItem(id, type, { quantity: nextQuantity }, cartItemKey);
    };

    const removeItem = (id, type, cartItemKey) => {
        const nextItems = removeCartItem(id, type, cartItemKey);
        setCartItems(nextItems);
    };

    const handleCheckout = () => {
        if (hasStockIssues()) {
            fixStockIssues();
            return;
        }

        if (!isAuthenticated) {
            navigate('/login', {
                state: {
                    from: { pathname: '/checkout' },
                    notice: 'Please sign in to continue to checkout.'
                }
            });
            return;
        }

        navigate('/checkout');
    };

    const hasStockIssues = () => {
        return cartItems.some(hasItemStockIssue);
    };

    const fixStockIssues = () => {
        let removedCount = 0;
        let adjustedCount = 0;

        const normalizedItems = cartItems.flatMap((item) => {
            if (item.isAvailable === false || isOutOfStock(item)) {
                removedCount += 1;
                return [];
            }

            if (isQuantityOverStock(item)) {
                adjustedCount += 1;
                return [{ ...item, quantity: item.stockQuantity }];
            }

            return [item];
        });

        const persistedCartItems = normalizedItems.map((item) => {
            const persistedItem = { ...item };
            delete persistedItem.isAvailable;
            delete persistedItem.stockQuantity;
            return persistedItem;
        });
        setCart(persistedCartItems);
        setCartItems(normalizedItems);

        const updates = [];
        if (adjustedCount > 0) {
            updates.push(`Adjusted ${adjustedCount} item(s) to available stock`);
        }
        if (removedCount > 0) {
            updates.push(`Removed ${removedCount} unavailable item(s)`);
        }

        if (updates.length > 0) {
            toast.info(updates.join('. '));
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = estimatedBaseDeliveryFee;
    const total = subtotal + deliveryFee;
    const showLoginPrompt = !isAuthenticated;
    const checkoutButtonLabel = validatingStock
        ? 'Checking availability...'
        : hasStockIssues()
            ? 'Fix Stock Issues'
            : showLoginPrompt
                ? 'Login to Checkout'
                : 'Proceed to Checkout';

    if (cartItems.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 sm:px-0">
                <EmptyState
                    title="Your cart is empty"
                    description="Start adding items from our menu to place an order"
                    action={
                        <Link to="/menu">
                            <Button>Browse Menu</Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-0">
            <div className="mb-8">
                <h1 className="mb-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Shopping Cart</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">Review your items before checkout</p>
            </div>


            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="border-b border-gray-100/80 dark:border-slate-700 p-4 sm:p-6">
                            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Cart Items <span className="ml-1 text-base font-normal text-gray-400 dark:text-slate-500">({cartItems.length})</span></h2>
                        </div>
                        <div className="divide-y divide-gray-100/80 dark:divide-slate-700/70">
                            {cartItems.map((item) => {
                                const isUnavailable = item.isAvailable === false || isOutOfStock(item);
                                const isOverStock = isQuantityOverStock(item);
                                const isStockIssue = isUnavailable || isOverStock;
                                const disableIncrease = !item.isAvailable || (hasFiniteStockLimit(item) && item.quantity >= item.stockQuantity);

                                return (
                                    <div
                                        key={item.cartItemKey || `${item.type}-${item.id}`}
                                        className={`p-4 sm:p-6 ${isStockIssue ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' : ''}`}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                                                {/* Image */}
                                                <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-700 sm:h-24 sm:w-24 overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-gray-400 dark:text-slate-500">No image</span>
                                                    )}
                                                    {isUnavailable && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                                                            <span className="text-[10px] font-bold text-white tracking-wide uppercase">Out of Stock</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                                        <h3 className="break-words text-base font-semibold tracking-tight sm:text-lg">{item.name}</h3>
                                                        {isUnavailable && (
                                                            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/60 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">Unavailable</span>
                                                        )}
                                                        {!isUnavailable && isOverStock && (
                                                            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Exceeds Stock</span>
                                                        )}
                                                    </div>
                                                    <p className="mb-2 font-medium text-primary-600">
                                                        LKR {item.price.toFixed(2)}
                                                    </p>
                                                    {Array.isArray(item.addOns) && item.addOns.length > 0 && (
                                                        <div className="mb-2 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-600 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
                                                            <p className="font-semibold text-gray-700 dark:text-slate-200">Selected Add-ons</p>
                                                            {item.addOns.map((addOn) => (
                                                                <p key={addOn.id}>
                                                                    {addOn.name || addOn.id} x {addOn.quantity} (+LKR {(Number(addOn.unitPrice || 0) * Number(addOn.quantity || 0)).toFixed(2)})
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {hasFiniteStockLimit(item) && (
                                                        <p className={`mb-2 text-xs ${isStockIssue ? 'text-red-600' : 'text-gray-500'}`}>
                                                            {isOutOfStock(item)
                                                                ? 'Out of stock today'
                                                                : `Available today: ${item.stockQuantity}`}
                                                        </p>
                                                    )}
                                                    {isOverStock && (
                                                        <p className="mb-2 text-xs text-red-600">
                                                            Quantity is above daily stock. Click "Fix Stock Issues" to auto-adjust.
                                                        </p>
                                                    )}

                                                    {/* Quantity Controls */}
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                        <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/60 overflow-hidden">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.type, -1, item.cartItemKey)}
                                                                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                disabled={item.quantity <= 1}
                                                                aria-label="Decrease quantity"
                                                            >
                                                                <FaMinus className="h-2.5 w-2.5" />
                                                            </button>
                                                            <span className="min-w-[2rem] text-center text-sm font-semibold px-1">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.type, 1, item.cartItemKey)}
                                                                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                                                disabled={disableIncrease}
                                                                title={disableIncrease ? 'Maximum available stock reached' : 'Increase quantity'}
                                                                aria-label="Increase quantity"
                                                            >
                                                                <FaPlus className="h-2.5 w-2.5" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeItem(item.id, item.type, item.cartItemKey)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-600 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                                                            aria-label={`Remove ${item.name} from cart`}
                                                        >
                                                            <FaTrash className="h-3 w-3" />
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Item Total */}
                                            <div className="sm:min-w-[120px] sm:text-right">
                                                <p className="text-base font-bold tabular-nums sm:text-lg">
                                                    LKR {(item.price * item.quantity).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500 sm:text-right">
                                                    @ {item.price.toFixed(2)} each
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <div className="mt-6">
                        <Link to="/menu">
                            <Button variant="outline">← Continue Shopping</Button>
                        </Link>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card p-4 sm:p-6 lg:sticky lg:top-24">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight sm:text-xl">Order Summary</h2>
                        {showLoginPrompt && (
                            <div className="mb-4 rounded-md border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300">
                                Sign in before checkout to place your order.
                            </div>
                        )}
                        <div className="space-y-2.5 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                                <span className="font-medium tabular-nums">LKR {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-slate-400">Est. Delivery Fee</span>
                                <span className="font-medium tabular-nums">LKR {deliveryFee.toFixed(2)}</span>
                            </div>
                            <p className="rounded-lg bg-gray-50 dark:bg-slate-700/40 px-3 py-2 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                                Final delivery fee confirmed at checkout after validating your delivery distance.
                            </p>
                            <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                                <span className="font-semibold text-base">Total</span>
                                <span className="font-bold text-lg tabular-nums text-primary-600">
                                    LKR {total.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <Button
                            onClick={handleCheckout}
                            className="w-full"
                            disabled={validatingStock || cartItems.length === 0}
                            loading={validatingStock}
                        >
                            {checkoutButtonLabel}
                        </Button>

                        {hasStockIssues() && !validatingStock && (
                            <p className="text-xs text-red-600 mt-2 text-center">
                                Click to remove unavailable items and adjust over-stock quantities
                            </p>
                        )}

                        {showLoginPrompt && !hasStockIssues() && !validatingStock && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 text-center">
                                You can add items as a guest, but checkout requires a customer login.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
