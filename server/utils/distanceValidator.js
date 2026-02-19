/**
 * Distance Validator Utility
 * Validates delivery distances using Google Maps API with fallback
 * Implements FR09: Delivery location validation
 */

const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const RESTAURANT_LAT = parseFloat(process.env.RESTAURANT_LATITUDE || '6.9271');
const RESTAURANT_LNG = parseFloat(process.env.RESTAURANT_LONGITUDE || '80.7744');
const MAX_DISTANCE_KM = parseFloat(process.env.MAX_DELIVERY_DISTANCE_KM || '15');

/**
 * Validate delivery distance using Google Maps Distance Matrix API
 * Uses DRIVING mode as per requirements
 * 
 * @param {number} customerLat - Customer address latitude
 * @param {number} customerLng - Customer address longitude
 * @returns {Promise<{isValid: boolean, distance: number, duration: number, maxDistance: number}>}
 */
async function validateDeliveryDistance(customerLat, customerLng) {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not configured');
    }

    if (!customerLat || !customerLng) {
        throw new Error('Customer coordinates are required');
    }

    if (isNaN(customerLat) || isNaN(customerLng)) {
        throw new Error('Invalid coordinates provided');
    }

    try {
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/distancematrix/json',
            {
                params: {
                    origins: `${RESTAURANT_LAT},${RESTAURANT_LNG}`,
                    destinations: `${customerLat},${customerLng}`,
                    mode: 'driving', // FR09 requirement: driving mode
                    units: 'metric',
                    key: GOOGLE_MAPS_API_KEY
                },
                timeout: 8000
            }
        );

        if (response.data.status !== 'OK') {
            throw new Error(`Google Maps API error: ${response.data.status}`);
        }

        const element = response.data.rows[0].elements[0];

        if (element.status !== 'OK') {
            throw new Error(`Unable to calculate distance: ${element.status}`);
        }

        // Convert meters to kilometers
        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
        const durationInSeconds = element.duration.value;

        return {
            isValid: distanceInKm <= MAX_DISTANCE_KM,
            distance: parseFloat(distanceInKm.toFixed(2)),
            duration: durationInSeconds,
            maxDistance: MAX_DISTANCE_KM,
            method: 'google_maps'
        };
    } catch (error) {
        if (error.response) {
            throw new Error(`Google Maps API error: ${error.response.data.error_message || error.response.statusText}`);
        }
        throw error;
    }
}

/**
 * Geocode an address to latitude/longitude
 * Used for addresses without explicit coordinates
 * 
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
 */
async function geocodeAddress(address) {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not configured');
    }

    if (!address || address.trim().length === 0) {
        throw new Error('Address is required for geocoding');
    }

    try {
        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/geocode/json',
            {
                params: {
                    address: address,
                    key: GOOGLE_MAPS_API_KEY,
                    region: 'lk', // Bias to Sri Lanka
                    components: 'country:LK' // Restrict to Sri Lanka
                },
                timeout: 8000
            }
        );

        if (response.data.status !== 'OK') {
            throw new Error(`Geocoding failed: ${response.data.status}`);
        }

        if (!response.data.results || response.data.results.length === 0) {
            throw new Error('Address could not be found');
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
 * Calculate straight-line distance using Haversine formula
 * Used as fallback if Google Maps API is unavailable
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

    return parseFloat(distance.toFixed(2));
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Validate delivery distance with fallback to straight-line calculation
 * Tries Google Maps API first, falls back to Haversine calculation
 * 
 * @param {number} customerLat - Customer address latitude
 * @param {number} customerLng - Customer address longitude
 * @returns {Promise<{isValid: boolean, distance: number, maxDistance: number, method: string}>}
 */
async function validateDeliveryDistanceWithFallback(customerLat, customerLng) {
    try {
        // Try Google Maps API first
        const result = await validateDeliveryDistance(customerLat, customerLng);
        return result;
    } catch (error) {
        console.warn('Google Maps API failed, using straight-line distance approximation:', error.message);

        // Fallback to straight-line distance
        const distance = calculateStraightLineDistance(
            RESTAURANT_LAT,
            RESTAURANT_LNG,
            customerLat,
            customerLng
        );

        // Add 20% buffer to straight-line distance to approximate road distance
        const approximateRoadDistance = parseFloat((distance * 1.2).toFixed(2));

        return {
            isValid: approximateRoadDistance <= MAX_DISTANCE_KM,
            distance: approximateRoadDistance,
            maxDistance: MAX_DISTANCE_KM,
            method: 'straight_line_approximation'
        };
    }
}

module.exports = {
    validateDeliveryDistance,
    validateDeliveryDistanceWithFallback,
    geocodeAddress,
    calculateStraightLineDistance,
    RESTAURANT_LAT,
    RESTAURANT_LNG,
    MAX_DISTANCE_KM
};
