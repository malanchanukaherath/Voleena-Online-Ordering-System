import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaCheckCircle, FaClipboardList, FaHome } from 'react-icons/fa';
import Button from '../components/ui/Button';
import { getOrderById } from '../services/orderApi';

// Simple: This shows the order confirmation section.
const OrderConfirmation = () => {
    const { orderId } = useParams();
    const location = useLocation();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        // Simple: This gets the order.
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
    const paymentSyncWarning = Boolean(location.state?.paymentSyncWarning);
    const hasEmail = Boolean(order?.customer?.Email);
    const hasPhone = Boolean(order?.customer?.Phone);
    const isPreorder = Boolean(order?.IsPreorder ?? order?.isPreorder);
    const rawScheduledDatetime = order?.ScheduledDatetime || order?.scheduledDatetime || null;
    const scheduledDatetime = rawScheduledDatetime ? new Date(rawScheduledDatetime) : null;
    const hasValidSchedule = Boolean(scheduledDatetime && !Number.isNaN(scheduledDatetime.getTime()));

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
            <div className="max-w-3xl mx-auto p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-primary-600 animate-spin" aria-label="Loading" />
                <p className="text-sm text-gray-500 dark:text-slate-400">Loading order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400">{error}</div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Success Message */}
            <div className="bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/60 rounded-2xl p-8 mb-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full mx-auto mb-4">
                    <FaCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-green-800 dark:text-green-300 mb-2">Order Placed Successfully!</h1>
                <p className="text-sm text-green-700 dark:text-green-400 mb-4 leading-relaxed">
                    {isPreorder
                        ? 'Thank you for your preorder. It is confirmed and scheduled.'
                        : "Thank you for your order. We've received it and will start preparing it shortly."}
                </p>
                {isPreorder && hasValidSchedule && (
                    <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                        Scheduled for: <span className="font-semibold">{scheduledDatetime.toLocaleString()}</span>
                    </p>
                )}
                <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 px-4 py-1.5 text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Order Number:</span>
                    <span className="font-bold text-gray-900 dark:text-slate-100 tracking-wide">{order?.OrderNumber || '—'}</span>
                </div>
            </div>

            {paymentSyncWarning && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-8 text-sm text-amber-900 dark:text-amber-300">
                    Card payment succeeded, but final server confirmation is still syncing. Do not retry payment.
                    If this message remains for more than a few minutes, contact support with your order number.
                </div>
            )}

            {/* Order Details */}
            <div className="card mb-8">
                <div className="px-6 py-4 border-b border-gray-100/80 dark:border-slate-700">
                    <h2 className="text-lg font-semibold tracking-tight">Order Details</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Delivery Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">
                            {order?.OrderType === 'DELIVERY' ? 'Delivery Information' : 'Pickup Information'}
                        </h3>
                        {order?.OrderType === 'DELIVERY' ? (
                            <div className="text-sm text-gray-600 dark:text-slate-400 space-y-0.5">
                                <p>{deliveryAddress?.AddressLine1 || 'N/A'}</p>
                                {deliveryAddress?.AddressLine2 && <p>{deliveryAddress.AddressLine2}</p>}
                                <p>{deliveryAddress?.City}{deliveryAddress?.PostalCode ? `, ${deliveryAddress.PostalCode}` : ''}</p>
                                <p className="mt-2 font-medium text-gray-700 dark:text-slate-300">
                                    Estimated Delivery: 30-45 minutes
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                                Your order will be ready for pickup at our location in {order.estimatedDeliveryTime}
                            </p>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">Contact Information</h3>
                        <div className="text-sm text-gray-600 dark:text-slate-400 space-y-0.5">
                            <p>{order?.customer?.Name || 'N/A'}</p>
                            <p>{order?.customer?.Email || 'N/A'}</p>
                            <p>{order?.customer?.Phone || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Order Items</h3>
                        <div className="divide-y divide-gray-100 dark:divide-slate-700/60 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                            {items.map((item) => (
                                <div key={item.OrderItemID || `${item.MenuItemID || item.ComboID}-${item.Quantity}`} className="flex justify-between text-sm px-4 py-2.5">
                                    <span className="text-gray-600 dark:text-slate-400">
                                        {item.Quantity}x {item.menuItem?.Name || item.combo?.Name || 'Item'}
                                    </span>
                                    <span className="font-medium tabular-nums">LKR {((item.UnitPrice || item.menuItem?.Price || 0) * item.Quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                                <span className="tabular-nums">LKR {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t border-gray-100 dark:border-slate-700 pt-2 mt-2">
                                <span>Total</span>
                                <span className="text-primary-600 tabular-nums">LKR {parseFloat(total).toFixed(2)}</span>
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
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
                <p>{updateChannelText}</p>
            </div>
        </div>
    );
};

export default OrderConfirmation;
