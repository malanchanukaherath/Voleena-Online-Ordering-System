// CODEMAP: FRONTEND_PAGE_ACTIVEDELIVERIES
// WHAT_THIS_IS: This page renders the ActiveDeliveries screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/ActiveDeliveries.jsx
// - Search text: const ActiveDeliveries
import React, { useEffect, useState } from 'react';
import { FaMapMarkedAlt, FaPhone, FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { deliveryService } from '../services/dashboardService';
import useDelayedStatusUpdate from '../hooks/useDelayedStatusUpdate';

// Simple: This shows the active deliveries section.
const ActiveDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [error, setError] = useState('');

    // Simple: This gets the delivery timestamp.
    const getDeliveryTimestamp = (value) => {
        const timestamp = new Date(value || 0).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    // Simple: This cleans or formats the address for maps.
    const normalizeAddressForMaps = (rawAddress) => {
        let normalized = String(rawAddress || '').replace(/\s+/g, ' ').trim();

        if (!normalized) {
            return '';
        }

        // Convert common house number style like "33,12" to "33/12" for better map matching.
        normalized = normalized.replace(/^(\d+)\s*,\s*(\d+)(?=\b)/, '$1/$2');

        if (!/sri\s*lanka/i.test(normalized)) {
            normalized = `${normalized}, Sri Lanka`;
        }

        return normalized;
    };

    // Simple: This cleans or formats the special instructions.
    const normalizeSpecialInstructions = (order) => {
        const rawValue = order?.SpecialInstructions ?? order?.specialInstructions ?? order?.special_instructions ?? '';
        const normalized = String(rawValue || '').trim();
        return normalized || '';
    };

    const {
        queueStatusUpdate,
        cancelPendingUpdate,
        commitPendingUpdateNow,
        getPendingUpdate,
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

        // Simple: This gets the deliveries.
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
                        specialInstructions: normalizeSpecialInstructions(delivery.order),
                        address: delivery.address
                            ? [delivery.address.AddressLine1, delivery.address.City, delivery.address.District, delivery.address.PostalCode].filter(Boolean).join(', ')
                            : 'N/A',
                        lat: delivery.PinnedLatitude != null
                            ? Number(delivery.PinnedLatitude)
                            : (delivery.address?.Latitude != null ? Number(delivery.address.Latitude) : null),
                        lng: delivery.PinnedLongitude != null
                            ? Number(delivery.PinnedLongitude)
                            : (delivery.address?.Longitude != null ? Number(delivery.address.Longitude) : null),
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

    // Simple: This gets the next status.
    const getNextStatus = (status) => {
        const map = {
            ASSIGNED: 'PICKED_UP',
            PICKED_UP: 'IN_TRANSIT',
            IN_TRANSIT: 'DELIVERED'
        };
        return map[status];
    };

    // Simple: This gets the action label.
    const getActionLabel = (status) => {
        const nextStatus = getNextStatus(status);
        if (nextStatus === 'PICKED_UP') return 'Mark Picked Up';
        if (nextStatus === 'IN_TRANSIT') return 'Mark In Transit';
        if (nextStatus === 'DELIVERED') return 'Mark Delivered';
        return 'Update Status';
    };

    // Simple: This handles what happens when queue advance status is triggered.
    const handleQueueAdvanceStatus = (delivery) => {
        const nextStatus = getNextStatus(delivery.status);
        if (!nextStatus) return;

        queueStatusUpdate(delivery.id, delivery.status, nextStatus);
    };

    // Simple: This gets the google maps navigation url.
    const getGoogleMapsNavigationUrl = (delivery) => {
        const hasCoordinates = Number.isFinite(delivery?.lat) && Number.isFinite(delivery?.lng);
        const hasAddressText = Boolean(delivery?.address && delivery.address !== 'N/A');

        if (!hasCoordinates && !hasAddressText) {
            return null;
        }

        if (hasCoordinates) {
            return `https://www.google.com/maps/dir/?api=1&destination=${delivery.lat},${delivery.lng}&travelmode=driving`;
        }

        const normalizedAddress = normalizeAddressForMaps(delivery.address);
        return normalizedAddress
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(normalizedAddress)}&travelmode=driving`
            : null;
    };

    return (
        <div className="p-4 sm:p-6">
            <h1 className="mb-6 text-xl font-bold sm:text-2xl text-gray-900 dark:text-slate-100">My Active Deliveries</h1>
            <div className="space-y-4">
                {deliveries.length === 0 ? (
                    <div className="rounded-lg bg-white dark:bg-slate-800 p-4 text-sm text-gray-500 dark:text-slate-400 shadow sm:p-6">
                        {error || 'No active deliveries.'}
                    </div>
                ) : deliveries.map(delivery => (
                    <div key={delivery.id} className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow sm:p-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className="break-words text-lg font-bold text-gray-900 dark:text-slate-100">{delivery.orderNumber}</h3>
                                <p className="text-gray-700 dark:text-slate-300">{delivery.customer}</p>
                                <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-slate-400 break-all sm:break-normal">
                                    <FaPhone className="mr-2" />{delivery.phone || 'Phone not available'}
                                </p>
                            </div>
                            <div className="self-start sm:self-auto">
                                <StatusBadge status={delivery.status} type="delivery" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="flex items-center text-sm text-gray-600 dark:text-slate-400 break-words">
                                <FaMapMarkedAlt className="mr-2" />{delivery.address}
                            </p>
                            {Number.isFinite(delivery.lat) && Number.isFinite(delivery.lng) && (
                                <p className="text-xs text-gray-500 dark:text-slate-500 mt-2 flex items-center">
                                    <FaMapMarkerAlt className="mr-2" />
                                    GPS: {delivery.lat}, {delivery.lng}
                                </p>
                            )}
                            {delivery.specialInstructions && (
                                <div className="mt-2 rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">Special Instructions</p>
                                    <p className="mt-1 text-xs text-amber-900 dark:text-amber-300 whitespace-pre-wrap break-words">{delivery.specialInstructions}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {getPendingUpdate(delivery.id) ? (
                                <>
                                    <div className="flex w-full items-center rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-400 sm:w-auto">
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
                                    className="inline-flex w-full items-center justify-center rounded-md border border-blue-600 dark:border-blue-700 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/30 sm:w-auto"
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

