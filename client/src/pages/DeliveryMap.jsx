import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { FaMapMarkerAlt, FaTruck, FaPhone, FaClock, FaMapPin, FaExternalLinkAlt } from 'react-icons/fa';
import { deliveryService } from '../services/dashboardService';

const DeliveryMap = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState('prompt');
    const [locationError, setLocationError] = useState('');

    // Restaurant location - Kalagedihena (Actual GPS coordinates)
    const restaurantLocation = {
        lat: 7.120035696626918,
        lng: 80.05250172082567,
        name: 'Voleena Foods',
        address: 'Kalagedihena'
    };

    const mapContainerStyle = {
        width: '100%',
        height: '600px',
        borderRadius: '8px'
    };

    const mapOptions = {
        zoom: 14,
        center: restaurantLocation,
        mapTypeId: 'roadmap',
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        panControl: true,
        styles: [
            {
                featureType: 'poi.business',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    };

    const requestCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationPermission('unavailable');
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationPermission('granted');
                setLocationError('');
            },
            (geoError) => {
                setCurrentLocation(null);
                setLocationPermission(geoError.code === 1 ? 'denied' : 'prompt');

                if (geoError.code === 1) {
                    setLocationError('Location access denied. Enable it to see your live position and route directions.');
                } else if (geoError.code === 2) {
                    setLocationError('Unable to determine your location right now.');
                } else if (geoError.code === 3) {
                    setLocationError('Location request timed out. Please try again.');
                } else {
                    setLocationError('Unable to fetch your current location.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    }, []);

    // Fetch active deliveries
    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                setLoading(true);
                const response = await deliveryService.getMyDeliveries('IN_TRANSIT');
                const data = response.data || response?.data?.data || [];

                const formattedDeliveries = data.map((delivery) => ({
                    id: delivery.DeliveryID,
                    orderNumber: delivery.order?.OrderNumber || 'N/A',
                    customerName: delivery.order?.customer?.Name || 'Unknown',
                    phone: delivery.order?.customer?.Phone || '',
                    address: delivery.address
                        ? `${delivery.address.AddressLine1 || ''}, ${delivery.address.City || ''}`
                        : 'N/A',
                    status: delivery.Status,
                    // CRITICAL FIX: Store both current location and destination
                    currentLat: delivery.CurrentLatitude,
                    currentLng: delivery.CurrentLongitude,
                    lastLocationUpdate: delivery.LastLocationUpdate,
                    // Destination coordinates
                    lat: delivery.address?.Latitude || 6.8721,
                    lng: delivery.address?.Longitude || 80.7840,
                    distance: delivery.DistanceKm || 5,
                    estimatedTime: Math.ceil((delivery.DistanceKm || 5) * 2) // ~2 min per km
                }));

                setDeliveries(formattedDeliveries);
                setError('');
            } catch (err) {
                setError(err.message || 'Failed to load deliveries');
                setDeliveries([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveries();

        // Refresh every 30 seconds
        const interval = setInterval(fetchDeliveries, 30000);
        return () => clearInterval(interval);
    }, []);

    // Request location once on mount
    useEffect(() => {
        requestCurrentLocation();
    }, [requestCurrentLocation]);

    // CRITICAL FIX: Broadcast location for ALL active deliveries (not just selected)
    useEffect(() => {
        if (!currentLocation || deliveries.length === 0) return;

        const broadcastLocation = async () => {
            const activeDeliveries = deliveries.filter(d =>
                ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
            );

            for (const delivery of activeDeliveries) {
                try {
                    await deliveryService.trackDeliveryLocation(delivery.id, currentLocation);
                } catch (error) {
                    console.error(`Location tracking failed for delivery ${delivery.id}:`, error);
                }
            }
        };

        // Broadcast immediately, then every 15 seconds
        broadcastLocation();
        const locationInterval = setInterval(broadcastLocation, 15000);

        return () => clearInterval(locationInterval);
    }, [deliveries, currentLocation]);

    const getMarkerColor = (status) => {
        switch (status) {
            case 'ASSIGNED':
                return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
            case 'PICKED_UP':
                return 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
            case 'IN_TRANSIT':
                return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
            case 'DELIVERED':
                return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
            default:
                return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ASSIGNED':
                return 'bg-yellow-100 text-yellow-800';
            case 'PICKED_UP':
                return 'bg-orange-100 text-orange-800';
            case 'IN_TRANSIT':
                return 'bg-blue-100 text-blue-800';
            case 'DELIVERED':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-red-100 text-red-800';
        }
    };

    const handleMarkerClick = (delivery) => {
        setSelectedDelivery(delivery);
        setSelectedRestaurant(false);
    };

    const getGoogleMapsNavigationUrl = (delivery) => {
        if (!Number.isFinite(delivery?.lat) || !Number.isFinite(delivery?.lng)) {
            return null;
        }

        const destination = `${delivery.lat},${delivery.lng}`;
        if (currentLocation?.lat && currentLocation?.lng) {
            return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination}&travelmode=driving`;
        }

        return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    };

    const calculateBounds = () => {
        if (deliveries.length === 0 && !currentLocation) return null;

        const points = [restaurantLocation, ...deliveries.map((delivery) => ({ lat: delivery.lat, lng: delivery.lng }))];

        if (currentLocation) {
            points.push(currentLocation);
        }

        let minLat = points[0].lat;
        let maxLat = points[0].lat;
        let minLng = points[0].lng;
        let maxLng = points[0].lng;

        points.forEach(point => {
            minLat = Math.min(minLat, point.lat);
            maxLat = Math.max(maxLat, point.lat);
            minLng = Math.min(minLng, point.lng);
            maxLng = Math.max(maxLng, point.lng);
        });

        return {
            center: {
                lat: (minLat + maxLat) / 2,
                lng: (minLng + maxLng) / 2
            }
        };
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Delivery Map</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading delivery map...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CRITICAL FIX: Check for Google Maps API key
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Delivery Tracking Map</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-red-800 font-bold text-lg mb-2">⚠️ Configuration Error</h2>
                            <p className="text-red-700 mb-4">
                                Google Maps API key is not configured. The delivery map cannot be displayed without a valid API key.
                            </p>
                            <div className="bg-red-100 border border-red-300 rounded p-4 mb-4">
                                <h3 className="font-semibold text-red-900 mb-2">To fix this issue:</h3>
                                <ol className="list-decimal ml-5 text-sm text-red-800 space-y-1">
                                    <li>Obtain a Google Maps API key from Google Cloud Console</li>
                                    <li>Add VITE_GOOGLE_MAPS_API_KEY=your_key_here to your .env file</li>
                                    <li>Restart the development server</li>
                                </ol>
                            </div>
                            <p className="text-xs text-red-600">
                                <strong>Note:</strong> Contact your system administrator if you need assistance with configuration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Delivery Tracking Map</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {locationError && (
                            <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-center justify-between gap-3">
                                <p className="text-sm text-yellow-800">{locationError}</p>
                                <button
                                    type="button"
                                    onClick={requestCurrentLocation}
                                    className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-900 rounded hover:bg-yellow-200 transition"
                                >
                                    Enable Location
                                </button>
                            </div>
                        )}

                        {error ? (
                            <div className="bg-red-50 p-6 h-96 flex items-center justify-center">
                                <p className="text-red-600">{error}</p>
                            </div>
                        ) : (
                            <LoadScript googleMapsApiKey={googleMapsApiKey}>
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={calculateBounds()?.center || restaurantLocation}
                                    zoom={14}
                                    options={mapOptions}
                                >
                                    {/* Restaurant Marker */}
                                    <Marker
                                        position={restaurantLocation}
                                        title={restaurantLocation.name}
                                        icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                        onClick={() => {
                                            setSelectedDelivery(null);
                                            setSelectedRestaurant(!selectedRestaurant);
                                        }}
                                    >
                                        {selectedRestaurant && (
                                            <InfoWindow onCloseClick={() => setSelectedRestaurant(false)}>
                                                <div className="p-2">
                                                    <p className="font-bold text-sm">{restaurantLocation.name}</p>
                                                    <p className="text-xs text-gray-600">{restaurantLocation.address}</p>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </Marker>

                                    {/* Current User Location */}
                                    {currentLocation && (
                                        <Marker
                                            position={currentLocation}
                                            title="Your Current Location"
                                            icon="http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
                                        />
                                    )}

                                    {/* CRITICAL FIX: Show both driver location AND destination */}
                                    {deliveries.map((delivery) => (
                                        <React.Fragment key={delivery.id}>
                                            {/* Driver's Current Location (if available) */}
                                            {delivery.currentLat && delivery.currentLng && (
                                                <Marker
                                                    position={{ lat: delivery.currentLat, lng: delivery.currentLng }}
                                                    title={`Driver Location - ${delivery.customerName}`}
                                                    icon="http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
                                                    onClick={() => handleMarkerClick(delivery)}
                                                />
                                            )}

                                            {/* Delivery Destination */}
                                            <Marker
                                                position={{ lat: delivery.lat, lng: delivery.lng }}
                                                title={delivery.customerName}
                                                icon={getMarkerColor(delivery.status)}
                                                onClick={() => handleMarkerClick(delivery)}
                                            >
                                                {selectedDelivery?.id === delivery.id && (
                                                    <InfoWindow onCloseClick={() => setSelectedDelivery(null)}>
                                                        <div className="p-3 w-64">
                                                            <h3 className="font-bold text-sm mb-2">{delivery.customerName}</h3>
                                                            <p className="text-xs text-gray-600 mb-2">{delivery.address}</p>
                                                            <p className="text-xs mb-1">
                                                                <strong>Order:</strong> {delivery.orderNumber}
                                                            </p>
                                                            <p className="text-xs mb-1">
                                                                <strong>Distance:</strong> {delivery.distance?.toFixed(2) || 'N/A'} km
                                                            </p>
                                                            <p className="text-xs mb-1">
                                                                <strong>Est. Time:</strong> {delivery.estimatedTime} mins
                                                            </p>
                                                            {delivery.lastLocationUpdate && (
                                                                <p className="text-xs mb-2 text-gray-500">
                                                                    <strong>Last Update:</strong> {new Date(delivery.lastLocationUpdate).toLocaleTimeString()}
                                                                </p>
                                                            )}
                                                            {delivery.phone && (
                                                                <a
                                                                    href={`tel:${delivery.phone}`}
                                                                    className="inline-flex items-center text-xs bg-primary-600 text-white px-2 py-1 rounded mt-2 hover:bg-primary-700"
                                                                >
                                                                    <FaPhone className="mr-1" /> Call
                                                                </a>
                                                            )}
                                                        </div>
                                                    </InfoWindow>
                                                )}
                                            </Marker>
                                        </React.Fragment>
                                    ))}

                                    {/* Route Lines to All Deliveries */}
                                    {deliveries.map((delivery) => (
                                        <Polyline
                                            key={`route-${delivery.id}`}
                                            path={[restaurantLocation, { lat: delivery.lat, lng: delivery.lng }]}
                                            options={{
                                                strokeColor: '#FF6B6B',
                                                strokeOpacity: 0.4,
                                                strokeWeight: 2,
                                                geodesic: true
                                            }}
                                        />
                                    ))}
                                </GoogleMap>
                            </LoadScript>
                        )}
                    </div>

                    {/* Map Legend */}
                    <div className="bg-white rounded-lg shadow p-4 mt-4">
                        <h3 className="font-semibold mb-3">Status Legend</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
                                <span>Assigned</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-orange-400 rounded-full mr-2"></div>
                                <span>Picked Up</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-400 rounded-full mr-2"></div>
                                <span>In Transit</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
                                <span>Delivered</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deliveries Panel */}
                <div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4 flex items-center">
                            <FaTruck className="mr-2 text-primary-600" />
                            Active Deliveries ({deliveries.length})
                        </h3>

                        <div className="mb-3 text-xs text-gray-600">
                            {locationPermission === 'granted'
                                ? '✓ Live location enabled. Tap Navigate to open in Google Maps.'
                                : 'Enable location access to send live updates to admin.'}
                        </div>

                        {deliveries.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No active deliveries</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {deliveries.map((delivery) => (
                                    <div
                                        key={delivery.id}
                                        onClick={() => handleMarkerClick(delivery)}
                                        className={`p-3 rounded-lg border-2 cursor-pointer transition ${selectedDelivery?.id === delivery.id
                                            ? 'border-primary-600 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-400'
                                            }`}
                                    >
                                        <p className="font-semibold text-sm mb-1">{delivery.customerName}</p>
                                        <p className="text-xs text-gray-600 mb-2 flex items-center">
                                            <FaMapPin className="mr-1" />
                                            {delivery.address}
                                        </p>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(delivery.status)}`}>
                                                {delivery.status}
                                            </span>
                                            <span className="text-xs text-gray-600 flex items-center">
                                                <FaClock className="mr-1" />
                                                {delivery.estimatedTime}m
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2">
                                            <strong>Order:</strong> {delivery.orderNumber}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2">
                                            <strong>Distance:</strong> {delivery.distance.toFixed(2)} km
                                        </div>
                                        <div className="flex gap-2">
                                            {getGoogleMapsNavigationUrl(delivery) && (
                                                <a
                                                    href={getGoogleMapsNavigationUrl(delivery)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 inline-flex items-center justify-center text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                                                >
                                                    <FaExternalLinkAlt className="mr-1" /> Navigate
                                                </a>
                                            )}
                                            {delivery.phone && (
                                                <a
                                                    href={`tel:${delivery.phone}`}
                                                    className="flex-1 inline-flex items-center justify-center text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700 transition"
                                                >
                                                    <FaPhone className="mr-1" /> Call
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Restaurant Info Card */}
                    <div className="bg-white rounded-lg shadow p-6 mt-4">
                        <h3 className="font-semibold mb-3 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-red-600" />
                            Restaurant
                        </h3>
                        <p className="font-medium text-sm mb-1">{restaurantLocation.name}</p>
                        <p className="text-xs text-gray-600">{restaurantLocation.address}</p>
                        <p className="text-xs text-gray-600 mt-2">
                            Kalagedihena, Sri Lanka
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryMap;
