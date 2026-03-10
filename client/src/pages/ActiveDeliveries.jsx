import React, { useEffect, useState } from 'react';
import { FaMapMarkedAlt, FaPhone, FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { deliveryService } from '../services/dashboardService';
import useDelayedStatusUpdate from '../hooks/useDelayedStatusUpdate';

const ActiveDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [error, setError] = useState('');

    const getDeliveryTimestamp = (value) => {
        const timestamp = new Date(value || 0).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const {
        queueStatusUpdate,
        cancelPendingUpdate,
        commitPendingUpdateNow,
        getPendingUpdate,
        getRemainingSeconds,
    } = useDelayedStatusUpdate({
        delayMs: 5000,
        onCommit: async (update) => {
            await deliveryService.updateDeliveryStatus(update.itemId, { status: update.toStatus });
            setDeliveries((prev) => prev.map((delivery) => (
                delivery.id === update.itemId ? { ...delivery, status: update.toStatus } : delivery
            )));
        },
        onError: (err) => {
            setError(err.message || 'Failed to update delivery status');
        }
    });

    useEffect(() => {
        let isMounted = true;

        const loadDeliveries = async () => {
            try {
                const response = await deliveryService.getMyDeliveries();
                const data = response.data || response?.data?.data || [];
                const mapped = data
                    .map((delivery) => ({
                        id: delivery.DeliveryID,
                        orderNumber: delivery.order?.OrderNumber || 'N/A',
                        customer: delivery.order?.customer?.Name || 'Unknown',
                        phone: delivery.order?.customer?.Phone || '',
                        address: delivery.address
                            ? [delivery.address.AddressLine1, delivery.address.City].filter(Boolean).join(', ')
                            : 'N/A',
                        lat: delivery.address?.Latitude != null ? Number(delivery.address.Latitude) : null,
                        lng: delivery.address?.Longitude != null ? Number(delivery.address.Longitude) : null,
                        status: delivery.Status,
                        assignedAt: delivery.AssignedAt || delivery.createdAt || delivery.created_at || delivery.order?.CreatedAt || null,
                    }))
                    .sort((a, b) => getDeliveryTimestamp(b.assignedAt) - getDeliveryTimestamp(a.assignedAt));

                if (isMounted) {
                    setDeliveries(mapped);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Failed to load deliveries');
                }
            }
        };

        loadDeliveries();

        return () => {
            isMounted = false;
        };
    }, []);

    const getNextStatus = (status) => {
        const map = {
            ASSIGNED: 'PICKED_UP',
            PICKED_UP: 'IN_TRANSIT',
            IN_TRANSIT: 'DELIVERED'
        };
        return map[status];
    };

    const getActionLabel = (status) => {
        const nextStatus = getNextStatus(status);
        if (nextStatus === 'PICKED_UP') return 'Mark Picked Up';
        if (nextStatus === 'IN_TRANSIT') return 'Mark In Transit';
        if (nextStatus === 'DELIVERED') return 'Mark Delivered';
        return 'Update Status';
    };

    const handleQueueAdvanceStatus = (delivery) => {
        const nextStatus = getNextStatus(delivery.status);
        if (!nextStatus) return;

        queueStatusUpdate(delivery.id, delivery.status, nextStatus);
    };

    const getGoogleMapsNavigationUrl = (delivery) => {
        if (!Number.isFinite(delivery?.lat) || !Number.isFinite(delivery?.lng)) {
            return null;
        }

        return `https://www.google.com/maps/dir/?api=1&destination=${delivery.lat},${delivery.lng}&travelmode=driving`;
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">My Active Deliveries</h1>
            <div className="space-y-4">
                {deliveries.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                        {error || 'No active deliveries.'}
                    </div>
                ) : deliveries.map(delivery => (
                    <div key={delivery.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{delivery.orderNumber}</h3>
                                <p className="text-gray-700">{delivery.customer}</p>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <FaPhone className="mr-2" />{delivery.phone || 'Phone not available'}
                                </p>
                            </div>
                            <StatusBadge status={delivery.status} type="delivery" />
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 flex items-center">
                                <FaMapMarkedAlt className="mr-2" />{delivery.address}
                            </p>
                            {delivery.lat && delivery.lng && (
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                    <FaMapMarkerAlt className="mr-2" />
                                    GPS: {delivery.lat}, {delivery.lng}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {getPendingUpdate(delivery.id) ? (
                                <>
                                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center">
                                        Changing to {getPendingUpdate(delivery.id).toStatus} in {getRemainingSeconds(delivery.id)}s
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => commitPendingUpdateNow(delivery.id)}
                                    >
                                        Confirm Now
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => cancelPendingUpdate(delivery.id)}
                                    >
                                        Undo
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => handleQueueAdvanceStatus(delivery)}
                                    disabled={!getNextStatus(delivery.status)}
                                >
                                    Queue {getActionLabel(delivery.status)}
                                </Button>
                            )}
                            {delivery.phone && (
                                <Button size="sm" variant="outline" onClick={() => window.open(`tel:${delivery.phone}`)}>Call Customer</Button>
                            )}
                            {getGoogleMapsNavigationUrl(delivery) && (
                                <a
                                    href={getGoogleMapsNavigationUrl(delivery)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition"
                                >
                                    <FaExternalLinkAlt className="mr-2" /> Navigate
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveDeliveries;
