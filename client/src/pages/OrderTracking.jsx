import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { FaMapMarkerAlt, FaPhone, FaBox, FaTruck, FaCheckCircle, FaClock, FaBan, FaMoneyBillWave, FaMapMarkedAlt } from 'react-icons/fa';
import { cancelOrder, getDeliveryLocation, getOrderById } from '../services/orderApi';

const toFiniteNumber = (value, fallback = null) => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatTimeLabel = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatEtaCountdown = (value) => {
    if (!value) {
        return null;
    }

    const eta = new Date(value);
    if (Number.isNaN(eta.getTime())) {
        return null;
    }

    const minutesRemaining = Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000));
    if (minutesRemaining <= 0) {
        return 'Any moment now';
    }

    if (minutesRemaining === 1) {
        return 'About 1 minute';
    }

    return `About ${minutesRemaining} minutes`;
};

const OrderTracking = () => {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [isCancelling, setIsCancelling] = useState(false);
    const [liveLocation, setLiveLocation] = useState(null);
    const [liveLocationError, setLiveLocationError] = useState('');

    const mapOrderData = (data = {}) => ({
        id: data.OrderID,
        orderNumber: data.OrderNumber,
        status: data.Status,
        orderType: data.OrderType,
        paymentMethod: data.payment?.Method || 'CASH',
        paymentStatus: data.payment?.Status || null,
        customer: {
            name: data.customer?.Name || 'Customer',
            phone: data.customer?.Phone || ''
        },
        deliveryId: data.delivery?.DeliveryID || data.delivery?.deliveryId || null,
        deliveryAddress: data.delivery?.address ? {
            line1: data.delivery.address.AddressLine1,
            city: data.delivery.address.City,
            district: data.delivery.address.District || '',
            latitude: toFiniteNumber(data.delivery.address.Latitude ?? data.delivery.address.latitude),
            longitude: toFiniteNumber(data.delivery.address.Longitude ?? data.delivery.address.longitude)
        } : null,
        deliveryPerson: (data.delivery?.deliveryStaff || data.delivery?.staff) ? {
            name: (data.delivery?.deliveryStaff || data.delivery?.staff).Name,
            phone: (data.delivery?.deliveryStaff || data.delivery?.staff).Phone
        } : null,
        confirmedAt: data.ConfirmedAt || data.confirmedAt || null,
        preparingAt: data.PreparingAt || data.preparingAt || null,
        readyAt: data.ReadyAt || data.readyAt || null,
        deliveryAssignedAt: data.delivery?.AssignedAt || data.delivery?.assignedAt || null,
        pickedUpAt: data.delivery?.PickedUpAt || data.delivery?.pickedUpAt || null,
        estimatedDeliveryTime: data.delivery?.EstimatedDeliveryTime || data.delivery?.estimatedDeliveryTime || null,
        placedAt: data.CreatedAt,
        completedAt: data.CompletedAt || data.completedAt,
        deliveredAt: data.delivery?.DeliveredAt || data.delivery?.deliveredAt,
        cancelledAt: data.CancelledAt || data.cancelledAt || null,
        items: (data.items || []).map((item) => ({
            name: item.menuItem?.Name || item.combo?.Name || 'Item',
            quantity: item.Quantity,
            price: parseFloat(item.UnitPrice || 0)
        })),
        total: parseFloat(data.FinalAmount || data.TotalAmount || 0)
    });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await getOrderById(orderId);
                const data = response.data?.data;
                if (!data) {
                    return;
                }
                setOrder(mapOrderData(data));
            } catch (error) {
                console.error('Failed to load order:', error);
            }
        };

        fetchOrder();

        const interval = setInterval(fetchOrder, 30000);
        return () => clearInterval(interval);
    }, [orderId]);

    useEffect(() => {
        const deliveryId = order?.deliveryId;
        const hasAssignedDeliveryPerson = Boolean(order?.deliveryPerson?.name || order?.deliveryPerson?.phone);
        const shouldTrackLiveLocation = order?.orderType === 'DELIVERY'
            && !['CANCELLED', 'DELIVERED'].includes(order?.status)
            && Number.isInteger(Number(deliveryId))
            && hasAssignedDeliveryPerson;

        if (!shouldTrackLiveLocation) {
            setLiveLocation(null);
            setLiveLocationError('');
            return;
        }

        let isMounted = true;

        const fetchLiveLocation = async () => {
            try {
                const response = await getDeliveryLocation(deliveryId);
                const payload = response?.data?.data;

                if (!payload || !isMounted) {
                    return;
                }

                setLiveLocation({
                    lat: toFiniteNumber(payload.lat),
                    lng: toFiniteNumber(payload.lng),
                    lastUpdate: payload.lastUpdate || null,
                    status: payload.status || null
                });
                setLiveLocationError('');
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                if (error?.response?.status === 503) {
                    setLiveLocationError(error.response?.data?.message || 'Live location tracking is temporarily unavailable.');
                    return;
                }

                if ([403, 404].includes(error?.response?.status)) {
                    setLiveLocationError('Live rider location is not available for this order right now.');
                    return;
                }

                setLiveLocationError('Unable to fetch live rider location right now.');
            }
        };

        fetchLiveLocation();
        const interval = setInterval(fetchLiveLocation, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [order?.deliveryId, order?.orderType, order?.status]);

    const canCancelOrder = () => {
        const cancellableStatuses = ['PENDING', 'CONFIRMED'];
        const isNotCancelled = order.status !== 'CANCELLED';
        return cancellableStatuses.includes(order.status) && isNotCancelled;
    };

    const getDeliveryEtaText = () => {
        if (!order || order.orderType !== 'DELIVERY' || order.status === 'CANCELLED' || order.status === 'DELIVERED') {
            return null;
        }

        const countdown = formatEtaCountdown(order.estimatedDeliveryTime);

        if (order.status === 'OUT_FOR_DELIVERY') {
            return countdown ? `Arriving ${countdown.toLowerCase()}` : 'Your order is on the way';
        }

        if (order.status === 'READY') {
            return countdown ? `Ready for dispatch, ${countdown.toLowerCase()} to delivery` : 'Ready for dispatch';
        }

        if (order.status === 'PREPARING') {
            return countdown ? `Preparing now, ${countdown.toLowerCase()} to delivery` : 'Preparing your order';
        }

        if (order.status === 'CONFIRMED') {
            return countdown ? `Estimated delivery ${countdown.toLowerCase()}` : 'Estimated delivery updating';
        }

        return countdown ? `Estimated delivery ${countdown.toLowerCase()}` : 'Estimated delivery updating';
    };

    const getTimelineTime = (status) => {
        if (!order) {
            return '';
        }

        switch (status) {
            case 'PENDING':
                return formatTimeLabel(order.placedAt);
            case 'CONFIRMED':
                return formatTimeLabel(order.confirmedAt || order.placedAt);
            case 'PREPARING':
                return formatTimeLabel(order.preparingAt);
            case 'READY':
                return formatTimeLabel(order.readyAt || order.deliveryAssignedAt);
            case 'OUT_FOR_DELIVERY':
                return formatTimeLabel(order.deliveryAssignedAt || order.pickedUpAt);
            case 'DELIVERED':
                return formatTimeLabel(order.deliveredAt);
            case 'CANCELLED':
                return formatTimeLabel(order.cancelledAt);
            default:
                return '';
        }
    };

    const destinationLat = toFiniteNumber(order?.deliveryAddress?.latitude);
    const destinationLng = toFiniteNumber(order?.deliveryAddress?.longitude);
    const liveLat = toFiniteNumber(liveLocation?.lat);
    const liveLng = toFiniteNumber(liveLocation?.lng);
    const hasDestinationCoordinates = Number.isFinite(destinationLat) && Number.isFinite(destinationLng);
    const hasLiveCoordinates = Number.isFinite(liveLat) && Number.isFinite(liveLng);
    const isAssignedToRider = Boolean(order?.deliveryPerson?.name || order?.deliveryPerson?.phone);

    const liveRouteUrl = hasDestinationCoordinates && hasLiveCoordinates
        ? `https://www.google.com/maps/dir/?api=1&origin=${liveLat},${liveLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`
        : hasDestinationCoordinates
            ? `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`
            : hasLiveCoordinates
                ? `https://www.google.com/maps/search/?api=1&query=${liveLat},${liveLng}`
                : null;

    const handleCancelOrder = async () => {
        setIsCancelling(true);
        try {
            await cancelOrder(order.id, 'Cancelled by customer');

            try {
                const refreshed = await getOrderById(order.id);
                const refreshedData = refreshed.data?.data;
                if (refreshedData) {
                    setOrder(mapOrderData(refreshedData));
                } else {
                    setOrder((prev) => ({ ...prev, status: 'CANCELLED', cancelledAt: new Date().toISOString() }));
                }
            } catch {
                setOrder((prev) => ({ ...prev, status: 'CANCELLED', cancelledAt: new Date().toISOString() }));
            }

            const isCashOnDelivery = order.paymentMethod === 'CASH';
            setToastMessage(
                isCashOnDelivery
                    ? 'Order cancelled successfully.'
                    : 'Order cancelled successfully. Your refund will be processed automatically via Stripe.'
            );
            setToastType('success');
            setShowToast(true);
        } catch (error) {
            if (error?.code === 'ECONNABORTED') {
                setToastMessage('Cancellation is taking longer than expected. Please wait a moment; status will refresh automatically.');
                setToastType('warning');
            } else {
                setToastMessage(error?.response?.data?.message || error.message || 'Failed to cancel order');
                setToastType('error');
            }
            setShowToast(true);
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    const trackingSteps = [
        {
            status: 'PENDING',
            label: 'Order Placed',
            time: getTimelineTime('PENDING'),
            completed: true,
            icon: FaBox,
        },
        {
            status: 'CONFIRMED',
            label: 'Order Confirmed',
            time: getTimelineTime('CONFIRMED'),
            completed: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'READY'].includes(order?.status),
            icon: FaCheckCircle,
            current: order?.status === 'CONFIRMED'
        },
        {
            status: 'PREPARING',
            label: 'Preparing',
            time: getTimelineTime('PREPARING'),
            completed: ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'READY'].includes(order?.status),
            icon: FaClock,
            current: order?.status === 'PREPARING'
        }
    ];

    if (order?.orderType === 'DELIVERY') {
        trackingSteps.push({
            status: 'OUT_FOR_DELIVERY',
            label: 'Out for Delivery',
            time: getTimelineTime('OUT_FOR_DELIVERY'),
            completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.status),
            icon: FaTruck,
            current: order?.status === 'OUT_FOR_DELIVERY'
        });
        trackingSteps.push({
            status: 'DELIVERED',
            label: 'Delivered',
            time: getTimelineTime('DELIVERED'),
            completed: order?.status === 'DELIVERED',
            icon: FaCheckCircle,
            current: order?.status === 'DELIVERED'
        });
    } else if (order?.orderType === 'TAKEAWAY') {
        trackingSteps.push({
            status: 'READY',
            label: 'Ready for Pickup',
            time: getTimelineTime('READY'),
            completed: ['READY', 'DELIVERED'].includes(order?.status),
            icon: FaCheckCircle,
            current: order?.status === 'READY'
        });
    }

    if (order?.status === 'CANCELLED') {
        trackingSteps.push({
            status: 'CANCELLED',
            label: 'Order Cancelled',
            time: getTimelineTime('CANCELLED'),
            completed: true,
            icon: FaBan,
            current: true
        });
    }

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6">Loading order details...</div>
            </div>
        );
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
                <div className="lg:col-span-2 space-y-6">
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
                                                order.status === 'READY' ? (order.orderType === 'TAKEAWAY' ? 'Your order is ready for pickup!' : 'Your order is ready!') :
                                                    order.status === 'OUT_FOR_DELIVERY' ? 'Your order is on the way!' :
                                                        'Your order has been delivered!'}
                                </p>
                            </div>
                            <StatusBadge status={order.status} type="order" />
                        </div>
                        {order.status === 'DELIVERED' && order.orderType === 'DELIVERY' && order.deliveredAt && (
                            <div className="text-sm text-green-800 bg-green-50 p-2 rounded mt-3">
                                <p>✅ Delivered on: <span className="font-semibold">{new Date(order.deliveredAt).toLocaleString()}</span></p>
                            </div>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.orderType === 'DELIVERY' && (
                            <div className="text-sm text-primary-800">
                                <p>{getDeliveryEtaText() || 'Estimated delivery updating'}</p>
                            </div>
                        )}
                    </div>

                    {canCancelOrder() && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Order Cancellation</h3>

                            <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="text-sm text-yellow-800">
                                        You can cancel this order before preparation starts.
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
                        </div>
                    )}

                    {order.status === 'CANCELLED' && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                            <div className="flex items-start gap-3">
                                <FaMoneyBillWave className="text-green-600 text-2xl mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">Refund Status</h3>
                                    <div className="space-y-2 text-sm text-green-800">
                                        {order.paymentMethod === 'CASH' ? (
                                            <p>Order cancelled successfully.</p>
                                        ) : (
                                            <p>Order cancelled successfully. Your refund will be processed automatically via Stripe.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {order.orderType === 'DELIVERY' && order.deliveryAddress && !['CANCELLED', 'DELIVERED'].includes(order.status) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <FaMapMarkedAlt className="mr-2 text-primary-600" />
                                Live Delivery Tracking
                            </h3>

                            {!isAssignedToRider ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                    <p>Delivery person has not been assigned yet. Live rider tracking will appear once assignment is complete.</p>
                                </div>
                            ) : hasDestinationCoordinates ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                                        <p>📍 Your order is on the way to:</p>
                                        <p className="font-medium mt-1">{order.deliveryAddress.line1}, {order.deliveryAddress.city}</p>
                                    </div>

                                    {hasLiveCoordinates ? (
                                        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                                            <p>Rider live location is updating in near real-time.</p>
                                            <p className="font-medium mt-1">Current: {liveLat.toFixed(6)}, {liveLng.toFixed(6)}</p>
                                            {liveLocation?.lastUpdate && (
                                                <p className="text-xs mt-1">Last update: {new Date(liveLocation.lastUpdate).toLocaleTimeString()}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                            <p>Waiting for rider GPS updates...</p>
                                        </div>
                                    )}

                                    {liveLocationError && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                            <p>{liveLocationError}</p>
                                        </div>
                                    )}

                                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                                        <FaMapMarkedAlt className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                            Open Google Maps for rider and destination view
                                        </p>
                                        {liveRouteUrl && (
                                            <a
                                                href={liveRouteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-3 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                                            >
                                                Open in Google Maps
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                    <p>📍 Your order is on the way! GPS tracking not available for this delivery.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-6">Order Progress</h3>
                        <div className="space-y-6">
                            {trackingSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={index} className="relative flex items-start">
                                        {index < trackingSteps.length - 1 && (
                                            <div
                                                className={`absolute left-5 top-12 bottom-0 w-0.5 ${step.completed ? 'bg-primary-500' : 'bg-gray-300'}`}
                                                style={{ height: 'calc(100% + 1.5rem)' }}
                                            />
                                        )}

                                        <div
                                            className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${step.completed
                                                ? step.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                                } ${step.current ? 'ring-4 ring-primary-100' : ''}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

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

                <div className="space-y-6">
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
                                    {order.paymentMethod === 'ONLINE' ? '💳 Online Payment' : order.paymentMethod === 'CARD' ? '💳 Card Payment' : '💵 Cash on Delivery'}
                                </p>
                                {order.paymentStatus && (
                                    <p className="text-xs text-gray-500">Status: {order.paymentStatus}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {order.orderType === 'DELIVERY' && order.status !== 'CANCELLED' && order.deliveryAddress && (
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
                            <Button onClick={handleCancelOrder} variant="danger" disabled={isCancelling}>
                                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                            </Button>
                            <Button onClick={() => setShowCancelModal(false)} variant="outline">
                                Keep Order
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
};

export default OrderTracking;
