const axios = require('axios');

/**
 * Google Maps Distance Matrix Service
 * Validates delivery locations are within 15km radius (FR09)
 */
class GoogleMapsService {
    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.restaurantLat = process.env.RESTAURANT_LATITUDE || '7.0000000';
        this.restaurantLng = process.env.RESTAURANT_LONGITUDE || '80.0000000';
        this.maxDeliveryDistance = 15; // km
    }

    /**
     * Calculate driving distance from restaurant to delivery address
     * @param {string} destinationAddress - Full delivery address
     * @returns {Promise<{distance: number, duration: number, isValid: boolean}>}
     */
    async calculateDistance(destinationAddress) {
        try {
            if (!this.apiKey) {
                console.warn('Google Maps API key not configured, using fallback validation');
                return this.fallbackDistanceCalculation(destinationAddress);
            }

            const origin = `${this.restaurantLat},${this.restaurantLng}`;
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

            const response = await axios.get(url, {
                params: {
                    origins: origin,
                    destinations: destinationAddress,
                    mode: 'driving',
                    key: this.apiKey,
                    language: 'en'
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Google Maps API error: ${response.data.status}`);
            }

            const element = response.data.rows[0].elements[0];

            if (element.status !== 'OK') {
                return {
                    distance: null,
                    duration: null,
                    isValid: false,
                    error: 'Could not calculate distance to this address'
                };
            }

            // Distance in kilometers
            const distanceKm = element.distance.value / 1000;
            // Duration in minutes
            const durationMin = element.duration.value / 60;

            return {
                distance: parseFloat(distanceKm.toFixed(2)),
                duration: Math.ceil(durationMin),
                isValid: distanceKm <= this.maxDeliveryDistance,
                maxDistance: this.maxDeliveryDistance,
                address: destinationAddress
            };

        } catch (error) {
            console.error('Google Maps API error:', error.message);
            // Fallback validation
            return this.fallbackDistanceCalculation(destinationAddress);
        }
    }

    /**
     * Fallback distance calculation using coordinates (Haversine formula)
     * Used when Google Maps API is not available
     */
    async calculateDistanceByCoordinates(lat, lng) {
        const R = 6371; // Earth's radius in km

        const dLat = this.toRad(lat - parseFloat(this.restaurantLat));
        const dLng = this.toRad(lng - parseFloat(this.restaurantLng));

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(parseFloat(this.restaurantLat))) *
            Math.cos(this.toRad(lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
            distance: parseFloat(distance.toFixed(2)),
            duration: Math.ceil(distance * 3), // Estimate 3 min per km
            isValid: distance <= this.maxDeliveryDistance,
            maxDistance: this.maxDeliveryDistance,
            method: 'haversine'
        };
    }

    /**
     * Fallback validation for development/testing
     */
    fallbackDistanceCalculation(address) {
        console.log('Using fallback distance validation for:', address);
        
        // For development: estimate based on city/district
        const lowerAddress = address.toLowerCase();
        let estimatedDistance = 10; // default

        // Cities/areas near Kalagedihena
        if (lowerAddress.includes('kalagedihena') || lowerAddress.includes('gampaha')) {
            estimatedDistance = 5;
        } else if (lowerAddress.includes('colombo') || lowerAddress.includes('negombo')) {
            estimatedDistance = 20;
        } else if (lowerAddress.includes('kandy') || lowerAddress.includes('jaffna')) {
            estimatedDistance = 100;
        }

        return {
            distance: estimatedDistance,
            duration: Math.ceil(estimatedDistance * 3),
            isValid: estimatedDistance <= this.maxDeliveryDistance,
            maxDistance: this.maxDeliveryDistance,
            method: 'fallback',
            warning: 'Using estimated distance - Google Maps API not configured'
        };
    }

    toRad(value) {
        return (value * Math.PI) / 180;
    }

    /**
     * Geocode an address to get latitude/longitude
     */
    async geocodeAddress(address) {
        if (!this.apiKey) {
            return null;
        }

        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: address,
                    key: this.apiKey
                }
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: response.data.results[0].formatted_address
                };
            }

            return null;
        } catch (error) {
            console.error('Geocoding error:', error.message);
            return null;
        }
    }
}

module.exports = new GoogleMapsService();
