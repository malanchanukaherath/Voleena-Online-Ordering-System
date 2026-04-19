import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for accessing device geolocation
 * 
 * @param {Object} options - Geolocation options
 * @param {boolean} options.watch - Whether to continuously watch position (default: false)
 * @param {number} options.updateInterval - Update interval in ms for watching (default: 30000)
 * @returns {Object} Geolocation state including location, loading, error, and permission status
 */
// Simple: This helps manage the geolocation.
export const useGeolocation = (options = {}) => {
    const {
        watch = false,
        updateInterval = 30000,
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 30000
    } = options;

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permission, setPermission] = useState('prompt');

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setPermission('unavailable');
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
                setPermission('granted');
                setLoading(false);
                setError(null);
            },
            (geoError) => {
                setLoading(false);
                setPermission(geoError.code === 1 ? 'denied' : 'prompt');

                let errorMessage;
                switch (geoError.code) {
                    case 1:
                        errorMessage = 'Location access denied. Please enable location permissions.';
                        break;
                    case 2:
                        errorMessage = 'Unable to determine your location right now.';
                        break;
                    case 3:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage = 'Unable to get your current location.';
                }
                setError(errorMessage);
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge
            }
        );
    }, [enableHighAccuracy, timeout, maximumAge]);

    useEffect(() => {
        requestLocation();

        if (watch) {
            const interval = setInterval(requestLocation, updateInterval);
            return () => clearInterval(interval);
        }
    }, [requestLocation, watch, updateInterval]);

    return {
        location,
        loading,
        error,
        permission,
        requestLocation,
        isAvailable: permission !== 'unavailable',
        isGranted: permission === 'granted',
        isDenied: permission === 'denied'
    };
};

export default useGeolocation;
