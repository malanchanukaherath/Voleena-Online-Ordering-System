const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const RESTAURANT_LAT = parseFloat(process.env.RESTAURANT_LATITUDE);
const RESTAURANT_LNG = parseFloat(process.env.RESTAURANT_LONGITUDE);
const MAX_DISTANCE_KM = parseFloat(process.env.MAX_DELIVERY_DISTANCE_KM) || 15;

/**
 * Validate delivery address distance using Google Maps Distance Matrix API
 * Implements FR09: Delivery location validation (≤15km rule)
 * 
 * @param {number} customerLat - Customer address latitude
 * @param {number} customerLng - Customer address longitude
 * @returns {Promise<{isValid: boolean, distance: number, duration: number}>}
 */
async function validateDeliveryDistance(customerLat, customerLng) {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not configured');
    }

    if (!customerLat || !customerLng) {
        throw new Error('Customer coordinates are required');
    }

    try {
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/distancematrix/json',
            {
                params: {
                    origins: `${RESTAURANT_LAT},${RESTAURANT_LNG}`,
                    destinations: `${customerLat},${customerLng}`,
                    mode: 'driving',
                    units: 'metric',
                    key: GOOGLE_MAPS_API_KEY
                },
                timeout: 5000 // 5 second timeout
            }
        );

        if (response.data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }

        const element = response.data.rows[0].elements[0];

        if (element.status !== 'OK') {
            throw new Error(`Unable to calculate distance: ${element.status}`);
        }

        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
        const durationInSeconds = element.duration.value;

        return {
            isValid: distanceInKm <= MAX_DISTANCE_KM,
            distance: distanceInKm,
            duration: durationInSeconds,
            maxDistance: MAX_DISTANCE_KM
        };
    } catch (error) {
        if (error.response) {
            throw new Error(`Google Maps API error: ${error.response.data.error_message || error.response.statusText}`);
        }
        throw error;
    }
}

/**
 * Geocode an address to get latitude and longitude
 * 
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
 */
async function geocodeAddress(address) {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not configured');
    }

    try {
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/geocode/json',
            {
                params: {
                    address: address,
                    key: GOOGLE_MAPS_API_KEY,
                    region: 'lk' // Bias results to Sri Lanka
                },
                timeout: 5000
            }
        );

        if (response.data.status !== 'OK') {
            throw new Error(`Geocoding failed: ${response.data.status}`);
        }

        const result = response.data.results[0];

        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formattedAddress: result.formatted_address
        };
    } catch (error) {
        if (error.response) {
            throw new Error(`Geocoding error: ${error.response.data.error_message || error.response.statusText}`);
        }
        throw error;
    }
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 * Used as a fallback if Google Maps API is unavailable
 * 
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Validate delivery distance with fallback to straight-line calculation
 * 
 * @param {number} customerLat - Customer address latitude
 * @param {number} customerLng - Customer address longitude
 * @returns {Promise<{isValid: boolean, distance: number, method: string}>}
 */
async function validateDeliveryDistanceWithFallback(customerLat, customerLng) {
    try {
        // Try Google Maps API first
        const result = await validateDeliveryDistance(customerLat, customerLng);
        return {
            ...result,
            method: 'google_maps'
        };
    } catch (error) {
        console.warn('Google Maps API failed, using straight-line distance:', error.message);

        // Fallback to straight-line distance
        const distance = calculateStraightLineDistance(
            RESTAURANT_LAT,
            RESTAURANT_LNG,
            customerLat,
            customerLng
        );

        // Add 20% buffer to straight-line distance to approximate road distance
        const approximateRoadDistance = distance * 1.2;

        return {
            isValid: approximateRoadDistance <= MAX_DISTANCE_KM,
            distance: approximateRoadDistance,
            duration: null,
            maxDistance: MAX_DISTANCE_KM,
            method: 'straight_line_approximation'
        };
    }
}

module.exports = {
    validateDeliveryDistance,
    validateDeliveryDistanceWithFallback,
    geocodeAddress,
    calculateStraightLineDistance
};
