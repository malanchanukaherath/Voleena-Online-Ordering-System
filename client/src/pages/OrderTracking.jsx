import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { FaMapMarkerAlt, FaPhone, FaBox, FaTruck, FaCheckCircle, FaClock, FaBan, FaMoneyBillWave } from 'react-icons/fa';

const OrderTracking = () => {
    const { orderId } = useParams();

    // Configurable cancellation window (in minutes)
    const CANCELLATION_WINDOW_MINUTES = 10;

    // Mock order tracking data with payment method and timestamps
    const [order, setOrder] = useState({
        orderNumber: orderId || 'ORD-2024-001',
        status: 'CONFIRMED', // Changed to CONFIRMED to allow cancellation demo
        orderType: 'DELIVERY',
        paymentMethod: 'ONLINE', // CASH or ONLINE
        paymentStatus: 'PAID',
        customer: {
            name: 'John Doe',
            phone: '+94 71 234 5678',
        },
        deliveryAddress: {
            line1: '123 Main Street',
            city: 'Kalagedihena',
            district: 'Gampaha',
        },
        deliveryPerson: {
            name: 'Delivery Staff 1',
            phone: '+94 77 123 4567',
        },
        estimatedDelivery: '6:30 PM',
        placedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        items: [
            { name: 'Chicken Burger', quantity: 2, price: 450 },
            { name: 'Fries', quantity: 1, price: 250 },
        ],
        total: 1450.00,
        refund: null // Will be set when order is cancelled
    });

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Calculate time remaining for cancellation
    useEffect(() => {
        const calculateTimeRemaining = () => {
            const orderTime = new Date(order.placedAt);
            const now = new Date();
            const minutesElapsed = (now - orderTime) / 60000;
            const remaining = Math.max(0, CANCELLATION_WINDOW_MINUTES - minutesElapsed);
            setTimeRemaining(remaining);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [order.placedAt]);

    // Check if order can be cancelled
    const canCancelOrder = () => {
        const cancellableStatuses = ['PENDING', 'CONFIRMED'];
        const isWithinTimeWindow = timeRemaining > 0;
        const isNotCancelled = order.status !== 'CANCELLED';

        return cancellableStatuses.includes(order.status) &&
            isWithinTimeWindow &&
            isNotCancelled;
    };

    // Get cancellation prevention reason
    const getCancellationReason = () => {
        if (order.status === 'CANCELLED') {
            return 'Order has already been cancelled';
        }
        if (timeRemaining <= 0) {
            return `Cancellation window expired (${CANCELLATION_WINDOW_MINUTES} minutes from order placement)`;
        }
        if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
            return 'Cannot cancel - order is already being prepared or delivered';
        }
        return '';
    };

    const handleCancelOrder = () => {
        // Update order status to CANCELLED
        const updatedOrder = {
            ...order,
            status: 'CANCELLED',
            cancelledAt: new Date().toISOString()
        };

        // If prepaid, initiate refund
        if (order.paymentMethod === 'ONLINE' && order.paymentStatus === 'PAID') {
            updatedOrder.refund = {
                amount: order.total,
                status: 'PENDING',
                initiatedAt: new Date().toISOString(),
                estimatedCompletion: '3-5 business days'
            };
            setToastMessage('Order cancelled successfully! Refund has been initiated.');
        } else {
            setToastMessage('Order cancelled successfully!');
        }

        setOrder(updatedOrder);
        setToastType('success');
        setShowToast(true);
        setShowCancelModal(false);
    };

    const trackingSteps = [
        {
            status: 'PENDING',
            label: 'Order Placed',
            time: new Date(order.placedAt).toLocaleTimeString(),
            completed: true,
            icon: FaBox,
        },
        {
            status: 'CONFIRMED',
            label: 'Order Confirmed',
            time: order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' ? new Date(new Date(order.placedAt).getTime() + 5 * 60000).toLocaleTimeString() : '',
            completed: order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED',
            icon: FaCheckCircle,
            current: order.status === 'CONFIRMED'
        },
        {
            status: 'PREPARING',
            label: 'Preparing',
            time: order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' ? new Date(new Date(order.placedAt).getTime() + 15 * 60000).toLocaleTimeString() : '',
            completed: order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED',
            icon: FaClock,
            current: order.status === 'PREPARING'
        },
        {
            status: 'OUT_FOR_DELIVERY',
            label: 'Out for Delivery',
            time: order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' ? new Date(new Date(order.placedAt).getTime() + 30 * 60000).toLocaleTimeString() : '',
            completed: order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED',
            icon: FaTruck,
            current: order.status === 'OUT_FOR_DELIVERY'
        },
        {
            status: 'DELIVERED',
            label: 'Delivered',
            time: order.estimatedDelivery,
            completed: order.status === 'DELIVERED',
            icon: FaCheckCircle,
            current: order.status === 'DELIVERED'
        },
    ];

    // Add cancelled step if order is cancelled
    if (order.status === 'CANCELLED') {
        trackingSteps.push({
            status: 'CANCELLED',
            label: 'Order Cancelled',
            time: new Date(order.cancelledAt).toLocaleTimeString(),
            completed: true,
            icon: FaBan,
            current: true
        });
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link to="/orders" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
                    ← Back to Orders
                </Link>
                <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
                <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Tracking Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Current Status Card */}
                    <div className={`${order.status === 'CANCELLED' ? 'bg-red-50 border-red-500' : 'bg-primary-50 border-primary-500'} border-2 rounded-lg p-6`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className={`text-xl font-semibold ${order.status === 'CANCELLED' ? 'text-red-900' : 'text-primary-900'}`}>
                                    Current Status
                                </h2>
                                <p className={order.status === 'CANCELLED' ? 'text-red-700' : 'text-primary-700'}>
                                    {order.status === 'CANCELLED' ? 'Your order has been cancelled' :
                                        order.status === 'CONFIRMED' ? 'Your order is confirmed!' :
                                            order.status === 'PREPARING' ? 'Your order is being prepared' :
                                                'Your order is on the way!'}
                                </p>
                            </div>
                            <StatusBadge status={order.status} type="order" />
                        </div>
                        {order.status !== 'CANCELLED' && (
                            <div className="text-sm text-primary-800">
                                <p>Estimated delivery: <span className="font-semibold">{order.estimatedDelivery}</span></p>
                            </div>
                        )}
                    </div>

                    {/* Cancellation Section */}
                    {order.status !== 'CANCELLED' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Order Cancellation</h3>

                            {canCancelOrder() ? (
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                        <p className="text-sm text-yellow-800">
                                            ⏱️ You can cancel this order within <strong>{Math.floor(timeRemaining)} minutes {Math.floor((timeRemaining % 1) * 60)} seconds</strong>
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCancelModal(true)}
                                        className="text-red-600 border-red-600 hover:bg-red-50 w-full"
                                    >
                                        <FaBan className="inline mr-2" />
                                        Cancel Order
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                                    <p className="text-sm text-gray-700">
                                        <FaBan className="inline mr-2 text-gray-500" />
                                        {getCancellationReason()}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Refund Information */}
                    {order.refund && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                            <div className="flex items-start gap-3">
                                <FaMoneyBillWave className="text-green-600 text-2xl mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">Refund Initiated</h3>
                                    <div className="space-y-2 text-sm text-green-800">
                                        <p><strong>Refund Amount:</strong> LKR {order.refund.amount.toFixed(2)}</p>
                                        <p><strong>Status:</strong> <span className="bg-green-200 px-2 py-0.5 rounded">{order.refund.status}</span></p>
                                        <p><strong>Estimated Completion:</strong> {order.refund.estimatedCompletion}</p>
                                        <p className="text-xs mt-2">
                                            The refund will be processed to your original payment method.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tracking Timeline */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-6">Order Progress</h3>
                        <div className="space-y-6">
                            {trackingSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={index} className="relative flex items-start">
                                        {/* Connector Line */}
                                        {index < trackingSteps.length - 1 && (
                                            <div
                                                className={`absolute left-5 top-12 bottom-0 w-0.5 ${step.completed ? 'bg-primary-500' : 'bg-gray-300'}`}
                                                style={{ height: 'calc(100% + 1.5rem)' }}
                                            />
                                        )}

                                        {/* Icon */}
                                        <div
                                            className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${step.completed
                                                ? step.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                                } ${step.current ? 'ring-4 ring-primary-100' : ''}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="ml-4 flex-1">
                                            <h4 className={`font-semibold ${step.current ? 'text-primary-600' : step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {step.label}
                                            </h4>
                                            {step.time && (
                                                <p className="text-sm text-gray-500 mt-1">{step.time}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Details */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span className="font-medium">LKR {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-3 flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-primary-600">LKR {order.total.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-3">
                                <p className="text-gray-600">Payment Method:</p>
                                <p className="font-medium">
                                    {order.paymentMethod === 'ONLINE' ? '💳 Online Payment' : '💵 Cash on Delivery'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    {order.orderType === 'DELIVERY' && order.status !== 'CANCELLED' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-4">Delivery Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start">
                                    <FaMapMarkerAlt className="text-primary-600 mt-1 mr-2" />
                                    <div>
                                        <p className="font-medium">Delivery Address</p>
                                        <p className="text-gray-600">
                                            {order.deliveryAddress.line1}<br />
                                            {order.deliveryAddress.city}, {order.deliveryAddress.district}
                                        </p>
                                    </div>
                                </div>
                                {order.deliveryPerson && (
                                    <div className="flex items-start">
                                        <FaPhone className="text-primary-600 mt-1 mr-2" />
                                        <div>
                                            <p className="font-medium">Delivery Person</p>
                                            <p className="text-gray-600">{order.deliveryPerson.name}</p>
                                            <p className="text-gray-600">{order.deliveryPerson.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <Modal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    title="Cancel Order"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to cancel this order?
                        </p>

                        {order.paymentMethod === 'ONLINE' && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Refund Information:</strong><br />
                                    A refund of <strong>LKR {order.total.toFixed(2)}</strong> will be initiated to your original payment method.
                                    Processing time: 3-5 business days.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleCancelOrder}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                Yes, Cancel Order
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1"
                            >
                                Keep Order
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Toast Notification */}
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default OrderTracking;
