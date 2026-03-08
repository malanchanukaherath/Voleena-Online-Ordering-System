import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaMapMarkedAlt, FaCheckCircle, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import StatusBadge from '../components/ui/StatusBadge';
import { deliveryService } from '../services/dashboardService';

const DeliveryDashboard = () => {
    const [stats, setStats] = useState({
        activeDeliveries: 0,
        completedToday: 0,
        pendingPickup: 0,
    });
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [availability, setAvailability] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState('prompt');
    const [loadingError, setLoadingError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadDashboard = async () => {
            try {
                const [statsResponse, deliveriesResponse, availabilityResponse] = await Promise.all([
                    deliveryService.getDashboardStats(),
                    deliveryService.getMyDeliveries(),
                    deliveryService.getAvailability().catch(() => ({ data: { isAvailable: true } }))
                ]);

                if (isMounted) {
                    setStats(statsResponse.stats || statsResponse.data?.stats || statsResponse.data || stats);
                    setAvailability(availabilityResponse.data);

                    const deliveries = deliveriesResponse.data || deliveriesResponse?.data?.data || [];
                    const mapped = deliveries.map((delivery) => ({
                        id: delivery.DeliveryID,
                        orderNumber: delivery.order?.OrderNumber || 'N/A',
                        customer: delivery.order?.customer?.Name || 'Unknown',
                        address: delivery.address
                            ? [delivery.address.AddressLine1, delivery.address.City].filter(Boolean).join(', ')
                            : 'N/A',
                        status: delivery.Status
                    }));
                    setActiveDeliveries(mapped);
                    setLoadingError(null);
                }
            } catch (error) {
                if (isMounted) {
                    setActiveDeliveries([]);
                    setLoadingError(error.message);
                    console.error('[Delivery Dashboard] Error loading:', error);
                }
            }
        };

        loadDashboard();

        // Refresh dashboard every 30 seconds
        const interval = setInterval(loadDashboard, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
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

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Delivery Dashboard</h1>

                {/* Location Status Indicator */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow">
                    <FaMapMarkerAlt className={`
                        ${locationPermission === 'granted' ? 'text-green-600' :
                            locationPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'}
                    `} />
                    <span className="text-sm">
                        {locationPermission === 'granted' ? (
                            <>
                                <span className="font-semibold text-green-600">Location Active</span>
                                {currentLocation && (
                                    <span className="text-xs text-gray-500 ml-2">
                                        ({currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)})
                                    </span>
                                )}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <FaTruck className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600">Active Deliveries</p>
                    <p className="text-3xl font-bold">{stats.activeDeliveries}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaClock className="w-8 h-8 text-orange-600 mb-2" />
                    <p className="text-sm text-gray-600">Pending Pickup</p>
                    <p className="text-3xl font-bold">{stats.pendingPickup}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <FaCheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <p className="text-sm text-gray-600">Completed Today</p>
                    <p className="text-3xl font-bold">{stats.completedToday}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>

                    {/* Availability Warning */}
                    {availability && !availability.isAvailable && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                ⚠️ You are marked as unavailable. You won't receive new delivery assignments.
                            </p>
                        </div>
                    )}

                    {/* Loading Error */}
                    {loadingError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                ❌ Error loading deliveries: {loadingError}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {activeDeliveries.length === 0 ? (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium mb-2">
                                    📦 No active deliveries
                                </p>
                                <p className="text-xs text-blue-700">
                                    {availability && !availability.isAvailable
                                        ? 'Set your status to available to receive delivery assignments.'
                                        : 'New deliveries will appear here when orders are ready for pickup.'}
                                </p>
                                <p className="text-xs text-blue-600 mt-2">
                                    💡 Tip: Orders are automatically assigned when kitchen marks them as READY
                                </p>
                            </div>
                        ) : activeDeliveries.map(delivery => (
                            <div key={delivery.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold">{delivery.orderNumber}</p>
                                        <p className="text-sm text-gray-600">{delivery.customer}</p>
                                        <p className="text-xs text-gray-500">{delivery.address}</p>
                                    </div>
                                    <StatusBadge status={delivery.status} type="delivery" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/delivery/active" className="block mt-4 text-primary-600 hover:text-primary-700">
                        View All →
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
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
