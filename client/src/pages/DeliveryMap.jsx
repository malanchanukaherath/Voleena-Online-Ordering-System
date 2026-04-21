// CODEMAP: FRONTEND_PAGE_DELIVERYMAP
// WHAT_THIS_IS: This page renders the DeliveryMap screen in the frontend.
// WHERE_CONNECTED:
// - Route mapping is defined in client/src/routes/AppRoutes.jsx.
// - This page is displayed inside client/src/components/layout/MainLayout.jsx for normal app routes.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: client/src/pages/DeliveryMap.jsx
// - Search text: const DeliveryMap
import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { FaMapMarkerAlt, FaTruck, FaPhone, FaClock, FaMapPin, FaExternalLinkAlt } from 'react-icons/fa';
import { deliveryService } from '../services/dashboardService';

// Simple: This shows the delivery map section.
const DeliveryMap = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState(false);
    const [showCurrentLocation, setShowCurrentLocation] = useState(false);
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
        height: 'clamp(320px, 60vh, 600px)',
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

    // Simple: This handles to finite number logic.
    const toFiniteNumber = (value, fallback = null) => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    // Simple: This cleans or formats the distance km.
    const formatDistanceKm = (distanceKm) => {
        const normalizedDistance = toFiniteNumber(distanceKm);
        return normalizedDistance === null ? 'N/A' : normalizedDistance.toFixed(2);
    };

    // Simple: This cleans or formats the special instructions.
    const normalizeSpecialInstructions = (order) => {
        const rawValue = order?.SpecialInstructions ?? order?.specialInstructions ?? order?.special_instructions ?? '';
        const normalized = String(rawValue || '').trim();
        return normalized || '';
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
        // Simple: This gets the deliveries.
        const fetchDeliveries = async () => {
            try {
                setLoading(true);
                const response = await deliveryService.getMyDeliveries();
                const data = response.data || response?.data?.data || [];

                const formattedDeliveries = data.map((delivery) => {
                    const distanceKm = toFiniteNumber(delivery.DistanceKm, 5);
                    const destinationLat = delivery.PinnedLatitude != null
                        ? toFiniteNumber(delivery.PinnedLatitude)
                        : toFiniteNumber(delivery.address?.Latitude);
                    const destinationLng = delivery.PinnedLongitude != null
                        ? toFiniteNumber(delivery.PinnedLongitude)
                        : toFiniteNumber(delivery.address?.Longitude);

                    return {
                        id: delivery.DeliveryID,
                        orderNumber: delivery.order?.OrderNumber || 'N/A',
                        customerName: delivery.order?.customer?.Name || 'Unknown',
                        specialInstructions: normalizeSpecialInstructions(delivery.order),
                        phone: delivery.order?.customer?.Phone || '',
                        address: delivery.address
                            ? [delivery.address.AddressLine1, delivery.address.City, delivery.address.District, delivery.address.PostalCode].filter(Boolean).join(', ')
                            : 'N/A',
                        status: delivery.Status,
                        // CRITICAL FIX: Store both current location and destination
                        currentLat: toFiniteNumber(delivery.CurrentLatitude),
                        currentLng: toFiniteNumber(delivery.CurrentLongitude),
                        lastLocationUpdate: delivery.LastLocationUpdate,
                        // Destination coordinates
                        lat: destinationLat,
                        lng: destinationLng,
                        hasDestinationCoordinates: Number.isFinite(destinationLat) && Number.isFinite(destinationLng),
                        distance: distanceKm,
                        estimatedTime: Math.ceil(distanceKm * 2) // ~2 min per km
                    };
                });

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

        // Simple: This handles broadcast location logic.
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

    // Simple: This creates the dot marker svg.
    const createDotMarkerSvg = (fillColor, strokeColor = 'white') => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    // Simple: This gets the marker color.
    const getMarkerColor = (status) => {
        switch (status) {
            case 'ASSIGNED':    return createDotMarkerSvg('#FBBF24'); // yellow-400
            case 'PICKED_UP':  return createDotMarkerSvg('#FB923C'); // orange-400
            case 'IN_TRANSIT': return createDotMarkerSvg('#60A5FA'); // blue-400
            case 'DELIVERED':  return createDotMarkerSvg('#4ADE80'); // green-400
            default:           return createDotMarkerSvg('#F87171'); // red-400
        }
    };

    const MARKER_RESTAURANT    = createDotMarkerSvg('#F87171');  // red-400
    const MARKER_CURRENT_LOC  = createDotMarkerSvg('#A78BFA');  // purple-400
    const MARKER_DRIVER       = createDotMarkerSvg('#A78BFA');  // purple-400

    // Simple: This gets the status color.
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

    // Simple: This handles what happens when marker click is triggered.
    const handleMarkerClick = (delivery) => {
        setSelectedDelivery(delivery);
        setSelectedRestaurant(false);
        setShowCurrentLocation(false);
    };

    // Simple: This gets the google maps navigation url.
    const getGoogleMapsNavigationUrl = (delivery) => {
        const hasCoordinates = Number.isFinite(delivery?.lat) && Number.isFinite(delivery?.lng);
        const hasAddressText = Boolean(delivery?.address && delivery.address !== 'N/A');

        if (!hasCoordinates && !hasAddressText) {
            return null;
        }

        const destination = hasCoordinates
            ? `${delivery.lat},${delivery.lng}`
            : encodeURIComponent(normalizeAddressForMaps(delivery.address));

        if (!destination) {
            return null;
        }

        return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    };

    // Simple: This calculates the bounds.
    const calculateBounds = () => {
        if (deliveries.length === 0 && !currentLocation) return null;

        const destinationPoints = deliveries
            .filter((delivery) => Number.isFinite(delivery.lat) && Number.isFinite(delivery.lng))
            .map((delivery) => ({ lat: delivery.lat, lng: delivery.lng }));

        const points = [restaurantLocation, ...destinationPoints];

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
            <div className="p-4 sm:p-6">
                <h1 className="mb-6 text-xl font-bold sm:text-2xl">Delivery Map</h1>
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
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
            <div className="p-4 sm:p-6">
                <h1 className="mb-6 text-xl font-bold sm:text-2xl">Delivery Tracking Map</h1>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow sm:p-6">
                    <div className="flex flex-col items-start gap-4 sm:flex-row">
                        <div className="flex-shrink-0">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-red-800 font-bold text-lg mb-2">?????? Configuration Error</h2>
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
        <div className="p-4 sm:p-6">
            <h1 className="mb-6 text-xl font-bold sm:text-2xl">Delivery Tracking Map</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Map Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {locationError && (
                            <div className="flex flex-col gap-3 border-b border-yellow-200 bg-yellow-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-yellow-800">{locationError}</p>
                                <button
                                    type="button"
                                    onClick={requestCurrentLocation}
                                    className="w-full rounded bg-yellow-100 px-3 py-1.5 text-xs text-yellow-900 transition hover:bg-yellow-200 sm:w-auto"
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
                                        icon={MARKER_RESTAURANT}
                                        onClick={() => {
                                            setSelectedDelivery(null);
                                            setShowCurrentLocation(false);
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

                                    {/* Current User Location with Accuracy Radius */}
                                    {currentLocation && (
                                        <>
                                            {/* Accuracy Circle */}
                                            <Polyline
                                                path={Array.from({ length: 32 }, (_, i) => {
                                                    const angle = (i / 32) * Math.PI * 2;
                                                    const lat = currentLocation.lat + (25 / 111) * Math.cos(angle);
                                                    const lng = currentLocation.lng + (25 / 111) * Math.sin(angle) / Math.cos(currentLocation.lat * Math.PI / 180);
                                                    return { lat, lng };
                                                })}
                                                options={{
                                                    strokeColor: '#8B5CF6',
                                                    strokeOpacity: 0.3,
                                                    strokeWeight: 1,
                                                    fillColor: '#8B5CF6',
                                                    fillOpacity: 0.1,
                                                    geodesic: true
                                                }}
                                            />
                                            {/* Current Location Marker */}
                                            <Marker
                                                position={currentLocation}
                                                title="Your Current Location (Delivery Guy)"
                                                icon={MARKER_CURRENT_LOC}
                                                onClick={() => setShowCurrentLocation(!showCurrentLocation)}
                                            >
                                                {showCurrentLocation && (
                                                    <InfoWindow onCloseClick={() => setShowCurrentLocation(false)}>
                                                        <div className="p-2">
                                                            <p className="font-bold text-sm">???? Your Current Location</p>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                Lat: {currentLocation.lat.toFixed(4)}??<br/>
                                                                Lng: {currentLocation.lng.toFixed(4)}??
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                Status: {locationPermission === 'granted' ? '??? Live' : '??? Not Live'}
                                                            </p>
                                                        </div>
                                                    </InfoWindow>
                                                )}
                                            </Marker>
                                        </>
                                    )}

                                    {/* CRITICAL FIX: Show both driver location AND destination */}
                                    {deliveries.map((delivery) => (
                                        <React.Fragment key={delivery.id}>
                                            {/* Driver's Current Location (if available) */}
                                            {delivery.currentLat !== null && delivery.currentLng !== null && (
                                                <Marker
                                                    position={{ lat: delivery.currentLat, lng: delivery.currentLng }}
                                                    title={`Driver Location - ${delivery.customerName}`}
                                                    icon={MARKER_DRIVER}
                                                    onClick={() => handleMarkerClick(delivery)}
                                                />
                                            )}

                                            {/* Delivery Destination */}
                                            {delivery.hasDestinationCoordinates && (
                                                <Marker
                                                    position={{ lat: delivery.lat, lng: delivery.lng }}
                                                    title={delivery.customerName}
                                                    icon={getMarkerColor(delivery.status)}
                                                    onClick={() => handleMarkerClick(delivery)}
                                                >
                                                    {selectedDelivery?.id === delivery.id && (
                                                        <InfoWindow onCloseClick={() => setSelectedDelivery(null)}>
                                                            <div className="w-56 p-3 sm:w-64">
                                                                <h3 className="font-bold text-sm mb-2">{delivery.customerName}</h3>
                                                                <p className="text-xs text-gray-600 mb-2">{delivery.address}</p>
                                                                <p className="text-xs mb-1">
                                                                    <strong>Order:</strong> {delivery.orderNumber}
                                                                </p>
                                                                {delivery.specialInstructions && (
                                                                    <p className="text-xs mb-1 break-words">
                                                                        <strong>Instructions:</strong> {delivery.specialInstructions}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs mb-1">
                                                                    <strong>Distance:</strong> {formatDistanceKm(delivery.distance)} km
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
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {/* Route Lines to All Deliveries */}
                                    {deliveries
                                        .filter((delivery) => delivery.hasDestinationCoordinates)
                                        .map((delivery) => (
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
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-400 rounded-full mr-2"></div>
                                <span>Restaurant</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-purple-400 rounded-full mr-2"></div>
                                <span>Your Location</span>
                            </div>
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
                    {/* Current Location Card */}
                    {currentLocation && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 mb-4 border border-purple-200">
                            <h3 className="font-semibold mb-3 flex items-center text-purple-900">
                                <FaMapMarkerAlt className="mr-2 text-purple-600" />
                                Your Current Location
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600"><strong>Latitude:</strong></p>
                                    <p className="text-sm font-medium text-gray-900">{currentLocation.lat.toFixed(6)}</p>
                                </div>
                                <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600"><strong>Longitude:</strong></p>
                                    <p className="text-sm font-medium text-gray-900">{currentLocation.lng.toFixed(6)}</p>
                                </div>
                                <div className="bg-white rounded p-2">
                                    <p className="text-xs text-gray-600"><strong>Status:</strong></p>
                                    <p className={`text-sm font-medium ${locationPermission === 'granted' ? 'text-green-600' : 'text-red-600'}`}>
                                        {locationPermission === 'granted' ? '???? Live Tracking Active' : '???? Tracking Disabled'}
                                    </p>
                                </div>
                                <button
                                    onClick={requestCurrentLocation}
                                    className="w-full mt-2 text-xs bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition font-medium"
                                >
                                    Refresh Location
                                </button>
                            </div>
                        </div>
                    )}

                    {!currentLocation && (
                        <div className="bg-yellow-50 rounded-lg shadow p-4 mb-4 border border-yellow-200">
                            <h3 className="font-semibold mb-2 flex items-center text-yellow-900">
                                <FaMapMarkerAlt className="mr-2 text-yellow-600" />
                                Enable Location
                            </h3>
                            <p className="text-sm text-yellow-800 mb-3">
                                Your current location is not available. Enable location permission to track deliveries.
                            </p>
                            <button
                                onClick={requestCurrentLocation}
                                className="w-full text-xs bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 transition font-medium"
                            >
                                Enable Location Now
                            </button>
                        </div>
                    )}

                    <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                        <h3 className="font-semibold mb-4 flex items-center">
                            <FaTruck className="mr-2 text-primary-600" />
                            Active Deliveries ({deliveries.length})
                        </h3>

                        <div className="mb-3 text-xs text-gray-600">
                            {deliveries.length > 0
                                ? (
                                    locationPermission === 'granted'
                                        ? 'Live location enabled. Use Navigate on a delivery card to open the route.'
                                        : 'Enable location access to send live updates while delivering.'
                                )
                                : (
                                    locationPermission === 'granted'
                                        ? 'Location is ready. Waiting for new delivery assignments.'
                                        : 'Enable location now so tracking is ready when a delivery is assigned.'
                                )}
                        </div>

                        {deliveries.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium">No active deliveries right now</p>
                                <p className="text-xs mt-1">
                                    {locationPermission === 'granted'
                                        ? 'Stay available. New assignments will appear here automatically.'
                                        : 'Enable location access and stay available to receive trackable deliveries.'}
                                </p>
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
                                        <p className="mb-2 flex items-center text-xs text-gray-600 break-words">
                                            <FaMapPin className="mr-1" />
                                            {delivery.address}
                                        </p>
                                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                                        {delivery.specialInstructions && (
                                            <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Special Instructions</p>
                                                <p className="mt-1 text-xs text-amber-900 whitespace-pre-wrap break-words">{delivery.specialInstructions}</p>
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-600 mb-2">
                                            <strong>Distance:</strong> {formatDistanceKm(delivery.distance)} km
                                        </div>
                                        {!delivery.hasDestinationCoordinates && (
                                            <div className="text-xs text-amber-700 mb-2">
                                                Destination GPS unavailable for this address.
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            {getGoogleMapsNavigationUrl(delivery) && (
                                                <a
                                                    href={getGoogleMapsNavigationUrl(delivery)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex w-full items-center justify-center rounded bg-blue-600 px-2 py-1 text-xs text-white transition hover:bg-blue-700 sm:flex-1"
                                                >
                                                    <FaExternalLinkAlt className="mr-1" /> Navigate
                                                </a>
                                            )}
                                            {delivery.phone && (
                                                <a
                                                    href={`tel:${delivery.phone}`}
                                                    className="inline-flex w-full items-center justify-center rounded bg-primary-600 px-2 py-1 text-xs text-white transition hover:bg-primary-700 sm:flex-1"
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

                    {/* Current Location Info */}
                    {currentLocation && locationPermission === 'granted' && (
                        <div className="bg-green-50 rounded-lg shadow p-4 mt-4 border border-green-200">
                            <h3 className="font-semibold mb-2 flex items-center text-green-900">
                                <span className="animate-pulse text-lg mr-2">????</span>
                                Live Location Active
                            </h3>
                            <p className="text-xs text-green-800">
                                Your location is being broadcast to the admin dashboard every 15 seconds.
                            </p>
                        </div>
                    )}
                    <div className="mt-4 rounded-lg bg-white p-4 shadow sm:p-6">
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

