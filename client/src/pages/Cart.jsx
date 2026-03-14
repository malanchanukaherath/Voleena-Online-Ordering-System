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
    const { isAuthenticated, user } = useAuth();

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

    const updateQuantity = (id, type, delta) => {
        const currentItem = cartItems.find((item) => item.id === id && item.type === type);
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
            if (item.id === id && item.type === type) {
                return { ...item, quantity: nextQuantity };
            }
            return item;
        });

        setCartItems(nextItems);
        updateCartItem(id, type, { quantity: nextQuantity });
    };

    const removeItem = (id, type) => {
        const nextItems = removeCartItem(id, type);
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

        const persistedCartItems = normalizedItems.map(({ isAvailable, stockQuantity, ...persistedItem }) => persistedItem);
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
            <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
                <p className="text-gray-600">Review your items before checkout</p>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold">Cart Items ({cartItems.length})</h2>
                        </div>
                        <div className="divide-y">
                            {cartItems.map((item) => {
                                const isUnavailable = item.isAvailable === false || isOutOfStock(item);
                                const isOverStock = isQuantityOverStock(item);
                                const isStockIssue = isUnavailable || isOverStock;
                                const disableIncrease = !item.isAvailable || (hasFiniteStockLimit(item) && item.quantity >= item.stockQuantity);

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`p-6 ${isStockIssue ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Image */}
                                            <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center relative">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No image</span>
                                                )}
                                                {isUnavailable && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                                                        <span className="text-white text-xs font-bold">Out of Stock</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                                    {isUnavailable && (
                                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Unavailable</span>
                                                    )}
                                                    {!isUnavailable && isOverStock && (
                                                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Exceeds Stock</span>
                                                    )}
                                                </div>
                                                <p className="text-primary-600 font-medium mb-2">
                                                    LKR {item.price.toFixed(2)}
                                                </p>
                                                {hasFiniteStockLimit(item) && (
                                                    <p className={`text-xs mb-2 ${isStockIssue ? 'text-red-600' : 'text-gray-500'}`}>
                                                        {isOutOfStock(item)
                                                            ? 'Out of stock today'
                                                            : `Available today: ${item.stockQuantity}`}
                                                    </p>
                                                )}
                                                {isOverStock && (
                                                    <p className="text-xs text-red-600 mb-2">
                                                        Quantity is above daily stock. Click "Fix Stock Issues" to auto-adjust.
                                                    </p>
                                                )}

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border rounded">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.type, -1)}
                                                            className="px-3 py-1 hover:bg-gray-100"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <FaMinus className="w-3 h-3" />
                                                        </button>
                                                        <span className="px-4 py-1 border-x">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.type, 1)}
                                                            className="px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                            disabled={disableIncrease}
                                                            title={disableIncrease ? 'Maximum available stock reached' : 'Increase quantity'}
                                                        >
                                                            <FaPlus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id, item.type)}
                                                        className="text-red-600 hover:text-red-800 flex items-center gap-2"
                                                    >
                                                        <FaTrash />
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Item Total */}
                                            <div className="text-right">
                                                <p className="font-semibold text-lg">
                                                    LKR {(item.price * item.quantity).toFixed(2)}
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
                    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        {showLoginPrompt && (
                            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                Sign in before checkout to place your order.
                            </div>
                        )}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">LKR {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Estimated Delivery Fee (base)</span>
                                <span className="font-medium">LKR {deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                                Final delivery fee is calculated at checkout based on distance.
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-semibold text-lg">Total</span>
                                <span className="font-bold text-lg text-primary-600">
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
                            <p className="text-xs text-gray-500 mt-2 text-center">
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
