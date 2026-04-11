const axios = require('axios');
const systemSettingsService = require('./systemSettingsService');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const RESTAURANT_LAT = parseFloat(process.env.RESTAURANT_LATITUDE || '7.120035696626918');
const RESTAURANT_LNG = parseFloat(process.env.RESTAURANT_LONGITUDE || '80.05250172082567');
const DEFAULT_MAX_DISTANCE_KM = parseFloat(process.env.MAX_DELIVERY_DISTANCE_KM) || 15;

async function getConfiguredMaxDistanceKm() {
    try {
        const settings = await systemSettingsService.getRuntimeSettings();
        const configured = Number(settings.maxDeliveryDistance);
        if (Number.isFinite(configured) && configured > 0) {
            return configured;
        }
    } catch (error) {
        console.warn('Failed to read runtime max delivery distance, using fallback:', error.message);
    }

    return DEFAULT_MAX_DISTANCE_KM;
}

/**
 * Common Sri Lankan city coordinates (fallback for geocoding without API key)
 * Used for development when Google Maps API key is not configured
 * Also used as last-resort fallback when Google can't find specific addresses
 */
const SRI_LANKAN_CITIES = {
    'colombo': { lat: 6.9271, lng: 80.7744 },
    'kandy': { lat: 7.2906, lng: 80.6337 },
    'galle': { lat: 6.0535, lng: 80.2158 },
    'jaffna': { lat: 9.6615, lng: 80.7855 },
    'trincomalee': { lat: 8.5874, lng: 81.2152 },
    'batticaloa': { lat: 7.7102, lng: 81.6924 },
    'ratnapura': { lat: 6.6828, lng: 80.3993 },
    'matara': { lat: 5.7489, lng: 80.5392 },
    'anuradhapura': { lat: 8.3356, lng: 80.4230 },
    'negombo': { lat: 7.2064, lng: 79.8397 },
    'mount lavinia': { lat: 6.8241, lng: 80.7579 },
    'panadura': { lat: 6.7269, lng: 80.6017 },
    'nugegoda': { lat: 6.8872, lng: 80.7788 },
    'dehiwala': { lat: 6.8320, lng: 80.7735 },
    'mathara': { lat: 5.7489, lng: 80.5392 },
    'kalagedihena': { lat: 7.1167, lng: 80.0583 },
    'gampaha': { lat: 7.0917, lng: 80.0167 },
    'kadawatha': { lat: 7.0100, lng: 79.9500 },
    'kiribathgoda': { lat: 6.9833, lng: 79.9333 },
    'ragama': { lat: 7.0333, lng: 80.0000 }
};

/**
 * Get approximate coordinates for a city (fallback geocoding)
 * Used when Google Maps API key is not configured
 * 
 * @param {string} city - City name
 * @returns {{lat: number, lng: number} | null} Coordinates or null if not found
 */
function getApproximateCityCoordinates(city) {
    if (!city) return null;

    const normalizedCity = city.toLowerCase().trim();
    return SRI_LANKAN_CITIES[normalizedCity] || null;
}

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

    const maxDistanceKm = await getConfiguredMaxDistanceKm();

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
            isValid: distanceInKm <= maxDistanceKm,
            distance: distanceInKm,
            duration: durationInSeconds,
            maxDistance: maxDistanceKm
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
 * Falls back to approximate city coordinates if API key not configured or address not found
 * 
 * Implements progressive fallback strategy:
 * 1. Try full address with Google Maps API
 * 2. If that fails, try just city name
 * 3. If that fails, use built-in city coordinates
 * 
 * @param {string} address - Full address string
 * @param {string} city - City name for fallback
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string, method: string}>}
 */
async function geocodeAddress(address, city) {
    // If Google Maps API key is not configured, try fallback geocoding
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not configured, using city-based fallback geocoding');

        // Try to get coordinates from city name
        if (city) {
            const cityCoords = getApproximateCityCoordinates(city);
            if (cityCoords) {
                return {
                    lat: cityCoords.lat,
                    lng: cityCoords.lng,
                    formattedAddress: `~${city}`, // Approximate location
                    method: 'fallback_city'
                };
            }
        }

        throw new Error('Unable to locate address without Google Maps API. Please configure GOOGLE_MAPS_API_KEY in .env or use GPS location button');
    }

    // Strategy 1: Try full address first
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

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formattedAddress: result.formatted_address,
                method: 'google_full_address'
            };
        }

        console.log(`[Geocoding] Full address not found (${response.data.status}), trying city-only fallback`);
    } catch (error) {
        console.warn('[Geocoding] Full address lookup failed:', error.message);
    }

    // Strategy 2: If full address fails, try just the city name + Sri Lanka
    if (city) {
        try {
            const cityResponse = await axios.get(
                'https://maps.googleapis.com/maps/api/geocode/json',
                {
                    params: {
                        address: `${city}, Sri Lanka`,
                        key: GOOGLE_MAPS_API_KEY,
                        region: 'lk'
                    },
                    timeout: 5000
                }
            );

            if (cityResponse.data.status === 'OK' && cityResponse.data.results.length > 0) {
                const result = cityResponse.data.results[0];
                console.log(`[Geocoding] Using city-level coordinates for ${city}`);
                return {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng,
                    formattedAddress: `~${city} (approximate)`,
                    method: 'google_city_only',
                    isApproximate: true
                };
            }
        } catch (error) {
            console.warn('[Geocoding] City lookup failed:', error.message);
        }

        // Strategy 3: Use built-in city coordinates as last resort
        const cityCoords = getApproximateCityCoordinates(city);
        if (cityCoords) {
            console.log(`[Geocoding] Using built-in coordinates for ${city}`);
            return {
                lat: cityCoords.lat,
                lng: cityCoords.lng,
                formattedAddress: `~${city} (approximate)`,
                method: 'fallback_city',
                isApproximate: true
            };
        }
    }

    throw new Error('Unable to locate this address. Please use the "Use My Location" button for accurate GPS coordinates, or verify your city name.');
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
    const maxDistanceKm = await getConfiguredMaxDistanceKm();

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
            isValid: approximateRoadDistance <= maxDistanceKm,
            distance: approximateRoadDistance,
            duration: null,
            maxDistance: maxDistanceKm,
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
