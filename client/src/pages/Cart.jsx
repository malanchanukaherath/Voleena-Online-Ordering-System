import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { getCart, updateCartItem, removeCartItem } from '../utils/cartStorage';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

const Cart = () => {
    const navigate = useNavigate();

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

    const updateQuantity = (id, type, delta) => {
        setCartItems((items) => {
            const nextItems = items.map((item) => {
                if (item.id === id && item.type === type) {
                    const nextQuantity = Math.max(1, item.quantity + delta);
                    updateCartItem(id, type, { quantity: nextQuantity });
                    return { ...item, quantity: nextQuantity };
                }
                return item;
            });
            return nextItems;
        });
    };

    const removeItem = (id, type) => {
        setCartItems(() => removeCartItem(id, type));
    };

    const handleCheckout = () => {
        if (hasStockIssues()) {
            removeUnavailableItems();
        } else {
            navigate('/checkout');
        }
    };

    const hasStockIssues = () => {
        // Check if any items have stock issues (unavailable or out of stock)
        return cartItems.some(item => item.isAvailable === false || item.stockQuantity === 0);
    };

    const removeUnavailableItems = () => {
        const unavailableItems = cartItems.filter(item => item.isAvailable === false || item.stockQuantity === 0);

        unavailableItems.forEach(item => {
            removeCartItem(item.id, item.type);
        });

        setCartItems(prev => prev.filter(item => item.isAvailable !== false && item.stockQuantity !== 0));

        toast.success(`Removed ${unavailableItems.length} unavailable item(s)`);
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = estimatedBaseDeliveryFee;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

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
                                const isUnavailable = item.isAvailable === false || item.stockQuantity === 0;

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`p-6 ${isUnavailable ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
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
                                                </div>
                                                <p className="text-primary-600 font-medium mb-2">
                                                    LKR {item.price.toFixed(2)}
                                                </p>

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
                                                            className="px-3 py-1 hover:bg-gray-100"
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
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax (8%)</span>
                                <span className="font-medium">LKR {tax.toFixed(2)}</span>
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
                            {validatingStock
                                ? 'Checking availability...'
                                : hasStockIssues()
                                    ? 'Remove Unavailable Items'
                                    : 'Proceed to Checkout'}
                        </Button>

                        {hasStockIssues() && !validatingStock && (
                            <p className="text-xs text-red-600 mt-2 text-center">
                                Click to remove unavailable items
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
