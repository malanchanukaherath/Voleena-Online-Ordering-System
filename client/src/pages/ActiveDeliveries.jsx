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
        <div className="p-4 sm:p-6">
            <h1 className="mb-6 text-xl font-bold sm:text-2xl">My Active Deliveries</h1>
            <div className="space-y-4">
                {deliveries.length === 0 ? (
                    <div className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow sm:p-6">
                        {error || 'No active deliveries.'}
                    </div>
                ) : deliveries.map(delivery => (
                    <div key={delivery.id} className="rounded-lg bg-white p-4 shadow sm:p-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className="break-words text-lg font-bold">{delivery.orderNumber}</h3>
                                <p className="text-gray-700">{delivery.customer}</p>
                                <p className="mt-1 flex items-center text-sm text-gray-500 break-all sm:break-normal">
                                    <FaPhone className="mr-2" />{delivery.phone || 'Phone not available'}
                                </p>
                            </div>
                            <div className="self-start sm:self-auto">
                                <StatusBadge status={delivery.status} type="delivery" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="flex items-center text-sm text-gray-600 break-words">
                                <FaMapMarkedAlt className="mr-2" />{delivery.address}
                            </p>
                            {Number.isFinite(delivery.lat) && Number.isFinite(delivery.lng) && (
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                    <FaMapMarkerAlt className="mr-2" />
                                    GPS: {delivery.lat}, {delivery.lng}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {getPendingUpdate(delivery.id) ? (
                                <>
                                    <div className="flex w-full items-center rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 sm:w-auto">
                                        Changing to {getPendingUpdate(delivery.id).toStatus}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="success"
                                        className="w-full sm:w-auto"
                                        onClick={() => commitPendingUpdateNow(delivery.id)}
                                    >
                                        Confirm Now
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        onClick={() => cancelPendingUpdate(delivery.id)}
                                    >
                                        Undo
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleQueueAdvanceStatus(delivery)}
                                    disabled={!getNextStatus(delivery.status)}
                                >
                                    {getActionLabel(delivery.status)}
                                </Button>
                            )}
                            {delivery.phone && (
                                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => window.open(`tel:${delivery.phone}`)}>Call Customer</Button>
                            )}
                            {getGoogleMapsNavigationUrl(delivery) && (
                                <a
                                    href={getGoogleMapsNavigationUrl(delivery)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center rounded-md border border-blue-600 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50 sm:w-auto"
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
