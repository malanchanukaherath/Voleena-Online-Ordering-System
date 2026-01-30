import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaClipboardList, FaHome } from 'react-icons/fa';
import Button from '../components/ui/Button';

const OrderConfirmation = () => {
    const { orderId } = useParams();

    // Mock order data - will be replaced with real API call
    const order = {
        orderNumber: orderId || 'ORD-2024-001',
        status: 'PENDING',
        orderType: 'DELIVERY',
        estimatedDeliveryTime: '30-45 minutes',
        items: [
            { id: 1, name: 'Chicken Burger', quantity: 2, price: 450.00 },
            { id: 2, name: 'Rice & Curry', quantity: 1, price: 350.00 },
        ],
        subtotal: 1250.00,
        deliveryFee: 100.00,
        tax: 100.00,
        total: 1450.00,
        deliveryAddress: {
            line1: '123 Main Street',
            line2: 'Apt 4B',
            city: 'Kalagedihena',
            postalCode: '11850',
        },
        customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+94 71 234 5678',
        },
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Success Message */}
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 mb-8 text-center">
                <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-green-700 mb-2">Order Placed Successfully!</h1>
                <p className="text-lg text-green-600 mb-4">
                    Thank you for your order. We've received your order and will start preparing it shortly.
                </p>
                <p className="text-sm text-gray-600">
                    Order Number: <span className="font-bold text-gray-900">{order.orderNumber}</span>
                </p>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Order Details</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Delivery Info */}
                    <div>
                        <h3 className="font-semibold mb-2">
                            {order.orderType === 'DELIVERY' ? 'Delivery Information' : 'Pickup Information'}
                        </h3>
                        {order.orderType === 'DELIVERY' ? (
                            <div className="text-sm text-gray-600">
                                <p>{order.deliveryAddress.line1}</p>
                                {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
                                <p>{order.deliveryAddress.city}, {order.deliveryAddress.postalCode}</p>
                                <p className="mt-2 font-medium text-gray-900">
                                    Estimated Delivery: {order.estimatedDeliveryTime}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                Your order will be ready for pickup at our location in {order.estimatedDeliveryTime}
                            </p>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold mb-2">Contact Information</h3>
                        <div className="text-sm text-gray-600">
                            <p>{order.customer.name}</p>
                            <p>{order.customer.email}</p>
                            <p>{order.customer.phone}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="font-semibold mb-2">Order Items</h3>
                        <div className="space-y-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.quantity}x {item.name}
                                    </span>
                                    <span className="font-medium">LKR {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>LKR {order.subtotal.toFixed(2)}</span>
                            </div>
                            {order.orderType === 'DELIVERY' && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span>LKR {order.deliveryFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (8%)</span>
                                <span>LKR {order.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary-600">LKR {order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Link to={`/orders/${order.orderNumber}/track`} className="flex-1">
                    <Button className="w-full">
                        <FaClipboardList className="inline mr-2" />
                        Track Order
                    </Button>
                </Link>
                <Link to="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                        <FaHome className="inline mr-2" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            {/* Email Notification */}
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>A confirmation email has been sent to {order.customer.email}</p>
                <p>You will receive updates about your order status via email and SMS</p>
            </div>
        </div>
    );
};

export default OrderConfirmation;
