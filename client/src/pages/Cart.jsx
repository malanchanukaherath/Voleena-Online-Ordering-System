import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const Cart = () => {
    const navigate = useNavigate();

    // Mock cart data with stock quantities (FR 19-20 demonstration)
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'Chicken Burger',
            price: 450.00,
            quantity: 2,
            image: null,
            stockQuantity: 12, // Available
        },
        {
            id: 2,
            name: 'Rice & Curry',
            price: 350.00,
            quantity: 1,
            image: null,
            stockQuantity: 3, // Low stock
        },
        {
            id: 3,
            name: 'Margherita Pizza',
            price: 850.00,
            quantity: 1,
            image: null,
            stockQuantity: 0, // Out of stock!
        },
    ]);

    const [stockError, setStockError] = useState('');

    const updateQuantity = (id, delta) => {
        setCartItems(items =>
            items.map(item => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    // Check stock availability
                    if (newQuantity > item.stockQuantity) {
                        setStockError(`Only ${item.stockQuantity} ${item.name} available in stock`);
                        return item;
                    }
                    setStockError('');
                    return { ...item, quantity: Math.max(1, newQuantity) };
                }
                return item;
            })
        );
    };

    const removeItem = (id) => {
        setCartItems(items => items.filter(item => item.id !== id));
        setStockError('');
    };

    // Check if any items are out of stock
    const getOutOfStockItems = () => {
        return cartItems.filter(item => item.stockQuantity === 0 || item.quantity > item.stockQuantity);
    };

    // Check if cart has stock issues
    const hasStockIssues = () => {
        return getOutOfStockItems().length > 0;
    };

    const handleCheckout = () => {
        const outOfStockItems = getOutOfStockItems();
        if (outOfStockItems.length > 0) {
            const itemNames = outOfStockItems.map(item => item.name).join(', ');
            setStockError(`Cannot proceed to checkout: ${itemNames} ${outOfStockItems.length > 1 ? 'are' : 'is'} out of stock or quantity exceeds available stock`);
            return;
        }
        navigate('/checkout');
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 100.00;
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

            {/* Stock Error Alert */}
            {stockError && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 text-xl mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900 mb-1">Stock Issue</h3>
                        <p className="text-sm text-red-800">{stockError}</p>
                    </div>
                </div>
            )}

            {/* Out of Stock Warning */}
            {hasStockIssues() && (
                <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <FaExclamationTriangle className="text-yellow-600 text-xl mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">Items Unavailable</h3>
                        <p className="text-sm text-yellow-800">
                            Some items in your cart are out of stock. Please remove them to proceed with checkout.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold">Cart Items ({cartItems.length})</h2>
                        </div>
                        <div className="divide-y">
                            {cartItems.map((item) => {
                                const isOutOfStock = item.stockQuantity === 0;
                                const exceedsStock = item.quantity > item.stockQuantity;
                                const hasIssue = isOutOfStock || exceedsStock;

                                return (
                                    <div
                                        key={item.id}
                                        className={`p-6 ${hasIssue ? 'bg-red-50' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Image */}
                                            <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                                                ) : (
                                                    <span className="text-gray-400 text-xs">No image</span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                                                <p className="text-primary-600 font-medium mb-2">
                                                    LKR {item.price.toFixed(2)}
                                                </p>

                                                {/* Stock Status */}
                                                <div className="mb-3">
                                                    {isOutOfStock ? (
                                                        <div className="flex items-center gap-2 text-red-600 text-sm">
                                                            <FaExclamationTriangle />
                                                            <span className="font-semibold">Out of Stock</span>
                                                        </div>
                                                    ) : exceedsStock ? (
                                                        <div className="flex items-center gap-2 text-red-600 text-sm">
                                                            <FaExclamationTriangle />
                                                            <span className="font-semibold">Only {item.stockQuantity} available</span>
                                                        </div>
                                                    ) : item.stockQuantity <= 5 ? (
                                                        <div className="flex items-center gap-2 text-yellow-600 text-sm">
                                                            <FaExclamationTriangle />
                                                            <span>Only {item.stockQuantity} left in stock</span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">
                                                            Stock: {item.stockQuantity} available
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center border rounded">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="px-3 py-1 hover:bg-gray-100"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <FaMinus className="w-3 h-3" />
                                                        </button>
                                                        <span className="px-4 py-1 border-x">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="px-3 py-1 hover:bg-gray-100"
                                                            disabled={isOutOfStock || item.quantity >= item.stockQuantity}
                                                        >
                                                            <FaPlus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
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
                                <span className="text-gray-600">Delivery Fee</span>
                                <span className="font-medium">LKR {deliveryFee.toFixed(2)}</span>
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
                            disabled={hasStockIssues()}
                        >
                            {hasStockIssues() ? 'Remove Unavailable Items' : 'Proceed to Checkout'}
                        </Button>

                        {hasStockIssues() && (
                            <p className="text-xs text-red-600 mt-2 text-center">
                                Cannot checkout with out-of-stock items
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
