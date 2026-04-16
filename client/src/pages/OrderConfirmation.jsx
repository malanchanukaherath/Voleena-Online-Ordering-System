import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaClipboardList, FaHome } from 'react-icons/fa';
import Button from '../components/ui/Button';
import { getOrderById } from '../services/orderApi';

const OrderConfirmation = () => {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadOrder = async () => {
            try {
                setLoading(true);
                const response = await getOrderById(orderId);
                const data = response.data?.data || response.data;
                if (isMounted) {
                    setOrder(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load order');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (orderId) {
            loadOrder();
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [orderId]);

    const items = order?.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.UnitPrice || item.menuItem?.Price || 0) * (item.Quantity || 0), 0);
    const total = order?.FinalAmount ?? order?.TotalAmount ?? subtotal;
    const deliveryAddress = order?.delivery?.address;
    const hasEmail = Boolean(order?.customer?.Email);
    const hasPhone = Boolean(order?.customer?.Phone);

    let updateChannelText = 'Order updates are always available in your tracking page.';
    if (hasEmail && hasPhone) {
        updateChannelText = 'Order updates will be sent to your registered email and phone when those channels are enabled.';
    } else if (hasEmail) {
        updateChannelText = 'Order updates will be sent to your registered email when that channel is enabled.';
    } else if (hasPhone) {
        updateChannelText = 'Order updates will be sent to your registered phone when that channel is enabled.';
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-6 text-sm text-gray-500">Loading order details...</div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-6 text-sm text-red-600">{error}</div>
        );
    }

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
                    Order Number: <span className="font-bold text-gray-900">{order?.OrderNumber || '—'}</span>
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
                        {order?.OrderType === 'DELIVERY' ? (
                            <div className="text-sm text-gray-600">
                                <p>{deliveryAddress?.AddressLine1 || 'N/A'}</p>
                                {deliveryAddress?.AddressLine2 && <p>{deliveryAddress.AddressLine2}</p>}
                                <p>{deliveryAddress?.City}{deliveryAddress?.PostalCode ? `, ${deliveryAddress.PostalCode}` : ''}</p>
                                <p className="mt-2 font-medium text-gray-900">
                                    Estimated Delivery: 30-45 minutes
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
                            <p>{order?.customer?.Name || 'N/A'}</p>
                            <p>{order?.customer?.Email || 'N/A'}</p>
                            <p>{order?.customer?.Phone || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="font-semibold mb-2">Order Items</h3>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.OrderItemID || `${item.MenuItemID || item.ComboID}-${item.Quantity}`} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        {item.Quantity}x {item.menuItem?.Name || item.combo?.Name || 'Item'}
                                    </span>
                                    <span className="font-medium">LKR {((item.UnitPrice || item.menuItem?.Price || 0) * item.Quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span>LKR {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total</span>
                                <span className="text-primary-600">LKR {parseFloat(total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Link to={`/orders/${order?.OrderID || orderId}/track`} className="flex-1">
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

            {/* Notification Info */}
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>{updateChannelText}</p>
            </div>
        </div>
    );
};

export default OrderConfirmation;
