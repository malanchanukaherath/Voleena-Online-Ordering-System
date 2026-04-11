import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaMapMarkedAlt, FaCheckCircle, FaClock, FaMapMarkerAlt, FaToggleOn, FaToggleOff, FaPhone, FaExternalLinkAlt } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { deliveryService } from '../services/dashboardService';
import useDelayedStatusUpdate from '../hooks/useDelayedStatusUpdate';

const DEFAULT_STATS = {
    activeDeliveries: 0,
    completedToday: 0,
    pendingPickup: 0,
};

const DeliveryDashboard = () => {
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [availability, setAvailability] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState('prompt');
    const [locationTrackingError, setLocationTrackingError] = useState('');
    const [loadingError, setLoadingError] = useState(null);
    const [updatingAvailability, setUpdatingAvailability] = useState(false);

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
            setActiveDeliveries((prev) => prev.map((delivery) => (
                delivery.id === update.itemId ? { ...delivery, status: update.toStatus } : delivery
            )));
        },
        onError: (err) => {
            console.error('Failed to update delivery status:', err);
            alert('Failed to update delivery status. Please try again.');
        }
    });

    useEffect(() => {
        let isMounted = true;

        // OPTIMIZATION: Split into frequent and infrequent polling
        const loadDeliveries = async () => {
            try {
                const deliveriesResponse = await deliveryService.getMyDeliveries();

                if (isMounted) {
                    const deliveries = deliveriesResponse.data || deliveriesResponse?.data?.data || [];
                    const mapped = deliveries
                        .map((delivery) => ({
                            id: delivery.DeliveryID,
                            orderNumber: delivery.order?.OrderNumber || 'N/A',
                            customer: delivery.order?.customer?.Name || 'Unknown',
                            phone: delivery.order?.customer?.Phone || '',
                            address: delivery.address
                                ? [delivery.address.AddressLine1, delivery.address.City, delivery.address.District].filter(Boolean).join(', ')
                                : 'N/A',
                            lat: delivery.address?.Latitude != null ? Number(delivery.address.Latitude) : null,
                            lng: delivery.address?.Longitude != null ? Number(delivery.address.Longitude) : null,
                            status: delivery.Status,
                            assignedAt: delivery.AssignedAt || delivery.createdAt || delivery.created_at || delivery.order?.CreatedAt || null,
                        }))
                        .sort((a, b) => getDeliveryTimestamp(b.assignedAt) - getDeliveryTimestamp(a.assignedAt));
                    setActiveDeliveries(mapped);
                    setLoadingError(null);
                }
            } catch (error) {
                if (isMounted) {
                    setActiveDeliveries([]);
                    setLoadingError(error.message);
                    console.error('[Delivery Dashboard] Error loading deliveries:', error);
                }
            }
        };

        const loadMetadata = async () => {
            try {
                const [statsResponse, availabilityResponse] = await Promise.all([
                    deliveryService.getDashboardStats(),
                    deliveryService.getAvailability().catch(() => ({ data: { IsAvailable: true } }))
                ]);

                if (isMounted) {
                    setStats(statsResponse.stats || statsResponse.data?.stats || statsResponse.data || DEFAULT_STATS);
                    setAvailability(availabilityResponse.data);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('[Delivery Dashboard] Error loading metadata:', error);
                }
            }
        };

        // Initial load
        loadDeliveries();
        loadMetadata();

        // OPTIMIZATION: Deliveries update frequently (30s), metadata rarely (5 min)
        const deliveriesInterval = setInterval(loadDeliveries, 30000);
        const metadataInterval = setInterval(loadMetadata, 300000); // 5 minutes

        return () => {
            isMounted = false;
            clearInterval(deliveriesInterval);
            clearInterval(metadataInterval);
        };
    }, []);

    // Request and track current location
    useEffect(() => {
        const requestLocation = () => {
            if (!navigator.geolocation) {
                setLocationPermission('unavailable');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationPermission('granted');
                },
                (error) => {
                    setLocationPermission(error.code === 1 ? 'denied' : 'prompt');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }
            );
        };

        requestLocation();

        // Update location every 1 minute
        const locationInterval = setInterval(requestLocation, 60000);

        return () => clearInterval(locationInterval);
    }, []);

    // CRITICAL FIX: Send location updates to backend for all active deliveries
    useEffect(() => {
        if (!currentLocation || activeDeliveries.length === 0) return;

        const trackableDeliveries = activeDeliveries.filter((delivery) =>
            ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status)
        );

        if (trackableDeliveries.length === 0) {
            return;
        }

        let trackingDisabled = false;

        const broadcastLocation = async () => {
            if (trackingDisabled) {
                return;
            }

            for (const delivery of trackableDeliveries) {
                try {
                    await deliveryService.trackDeliveryLocation(delivery.id, currentLocation);
                    setLocationTrackingError('');
                } catch (error) {
                    if (error?.status === 503) {
                        trackingDisabled = true;
                        setLocationTrackingError(
                            error.message ||
                            'Live location tracking is temporarily unavailable. Please apply delivery location migration v2.2 and restart the server.'
                        );
                        return;
                    }

                    console.error(`Failed to track location for delivery ${delivery.id}:`, error);
                }
            }
        };

        // Broadcast immediately, then every 30 seconds
        broadcastLocation();
        const broadcastInterval = setInterval(broadcastLocation, 30000);

        return () => clearInterval(broadcastInterval);
    }, [currentLocation, activeDeliveries]);

    // Toggle availability status
    const toggleAvailability = async () => {
        try {
            setUpdatingAvailability(true);
            const newStatus = !availability?.IsAvailable;
            await deliveryService.updateAvailability(newStatus);
            setAvailability({ ...availability, IsAvailable: newStatus });
        } catch (error) {
            console.error('Failed to update availability:', error);
            alert('Failed to update availability status. Please try again.');
        } finally {
            setUpdatingAvailability(false);
        }
    };

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

        const destination = `${delivery.lat},${delivery.lng}`;
        if (Number.isFinite(currentLocation?.lat) && Number.isFinite(currentLocation?.lng)) {
            return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination}&travelmode=driving`;
        }

        return `https://www.google.com/maps/search/?api=1&query=${destination}`;
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-2xl font-bold sm:text-3xl">Delivery Dashboard</h1>

                <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:w-auto">
                    {/* Availability Toggle */}
                    <button
                        onClick={toggleAvailability}
                        disabled={updatingAvailability}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 shadow transition-colors sm:w-auto sm:justify-start ${availability?.IsAvailable
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                            } ${updatingAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {availability?.IsAvailable ? (
                            <>
                                <FaToggleOn className="w-5 h-5" />
                                <span className="font-semibold">Available</span>
                            </>
                        ) : (
                            <>
                                <FaToggleOff className="w-5 h-5" />
                                <span className="font-semibold">Unavailable</span>
                            </>
                        )}
                    </button>

                    {/* Location Status Indicator */}
                    <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 shadow sm:w-auto sm:justify-start">
                        <FaMapMarkerAlt className={`
                        ${locationPermission === 'granted' ? 'text-green-600' :
                                locationPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'}
                    `} />
                        <span className="text-sm">
                            {locationPermission === 'granted' ? (
                                <>
                                    <span className="font-semibold text-green-600">Location Active</span>
                                </>
                            ) : locationPermission === 'denied' ? (
                                <span className="font-semibold text-red-600">Location Denied</span>
                            ) : locationPermission === 'unavailable' ? (
                                <span className="font-semibold text-gray-600">Location Unavailable</span>
                            ) : (
                                <span className="font-semibold text-yellow-600">Enable Location</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {locationTrackingError && (
                <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {locationTrackingError}
                </div>
            )}

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <FaTruck className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Active Deliveries</p>
                    <p className="text-3xl font-bold">{stats.activeDeliveries}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <FaClock className="w-8 h-8 text-orange-600 mb-2" />
                    <p className="text-sm text-gray-600">Pending Pickup</p>
                    <p className="text-3xl font-bold">{stats.pendingPickup}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <FaCheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-gray-600">Completed Today</p>
                    <p className="text-3xl font-bold">{stats.completedToday}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>

                    {/* Availability Warning */}
                    {availability && !availability.IsAvailable && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                You are marked as unavailable. You will not receive new delivery assignments.
                            </p>
                            <button
                                onClick={toggleAvailability}
                                className="mt-2 text-xs text-yellow-900 underline hover:text-yellow-700"
                            >
                                Click here to become available
                            </button>
                        </div>
                    )}

                    {/* Loading Error */}
                    {loadingError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                Error loading deliveries: {loadingError}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {activeDeliveries.length === 0 ? (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium mb-2">
                                    No active deliveries
                                </p>
                                <p className="text-xs text-blue-700">
                                    {availability && !availability.IsAvailable
                                        ? 'Set your status to available to receive delivery assignments.'
                                        : 'New deliveries will appear here when orders are ready for pickup.'}
                                </p>
                            </div>
                        ) : activeDeliveries.map(delivery => (
                            <div key={delivery.id} className="rounded-lg bg-gray-50 p-3 sm:p-4">
                                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="font-bold break-words">{delivery.orderNumber}</p>
                                        <p className="text-sm text-gray-600">{delivery.customer}</p>
                                        <p className="text-xs text-gray-500 break-words">{delivery.address}</p>
                                        {Number.isFinite(delivery.lat) && Number.isFinite(delivery.lng) && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                GPS: {delivery.lat}, {delivery.lng}
                                            </p>
                                        )}
                                    </div>
                                    <div className="self-start sm:self-auto">
                                        <StatusBadge status={delivery.status} type="delivery" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {getPendingUpdate(delivery.id) ? (
                                        <>
                                            <div className="flex w-full items-center rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 sm:w-auto">
                                                Changing to {getPendingUpdate(delivery.id).toStatus} in {getRemainingSeconds(delivery.id)}s
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
                                            Queue {getActionLabel(delivery.status)}
                                        </Button>
                                    )}
                                    {delivery.phone && (
                                        <a
                                            href={`tel:${delivery.phone}`}
                                            className="inline-flex w-full items-center justify-center rounded bg-primary-600 px-3 py-1.5 text-xs text-white transition hover:bg-primary-700 sm:w-auto"
                                        >
                                            <FaPhone className="mr-1" /> Call Customer
                                        </a>
                                    )}
                                    {getGoogleMapsNavigationUrl(delivery) && (
                                        <a
                                            href={getGoogleMapsNavigationUrl(delivery)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-xs text-white transition hover:bg-blue-700 sm:w-auto"
                                        >
                                            <FaExternalLinkAlt className="mr-1" /> Navigate
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/delivery/active" className="block mt-4 text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>

                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <Link to="/delivery/active" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaTruck className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">My Deliveries</p>
                        </Link>
                        <Link to="/delivery/map" className="p-4 border-2 rounded-lg hover:border-primary-500 text-center">
                            <FaMapMarkedAlt className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <p className="font-medium">View Map</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDashboard;
