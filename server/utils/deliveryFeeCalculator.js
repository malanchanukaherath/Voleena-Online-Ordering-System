/**
 * Delivery Fee Calculator
 * Implements dynamic delivery fee calculation based on distance
 * 
 * Fee Structure:
 * - Base fee: Applies to all delivery orders
 * - Distance-based fee: Additional cost per kilometer beyond free range
 * - Configurable via environment variables for easy admin adjustment
 */

// Configuration from environment variables
const BASE_DELIVERY_FEE = parseFloat(process.env.BASE_DELIVERY_FEE) || 100; // Base fee in LKR
const FREE_DELIVERY_DISTANCE_KM = parseFloat(process.env.FREE_DELIVERY_DISTANCE_KM) || 3; // Free delivery within X km
const DELIVERY_FEE_PER_KM = parseFloat(process.env.DELIVERY_FEE_PER_KM) || 20; // Additional cost per km
const MAX_DELIVERY_FEE = parseFloat(process.env.MAX_DELIVERY_FEE) || 300; // Maximum delivery fee cap

// Simple: This cleans or formats the number.
function resolveNumber(value, fallback, { min = Number.NEGATIVE_INFINITY } = {}) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min) {
        return fallback;
    }
    return parsed;
}

// Simple: This gets the resolved delivery config.
function getResolvedDeliveryConfig(overrides = {}) {
    return {
        baseFee: resolveNumber(overrides.baseFee, BASE_DELIVERY_FEE, { min: 0 }),
        freeDeliveryDistance: resolveNumber(overrides.freeDeliveryDistance, FREE_DELIVERY_DISTANCE_KM, { min: 0 }),
        feePerKm: resolveNumber(overrides.feePerKm, DELIVERY_FEE_PER_KM, { min: 0 }),
        maxFee: resolveNumber(overrides.maxFee, MAX_DELIVERY_FEE, { min: 0 })
    };
}

/**
 * Calculate delivery fee based on distance
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {{
 *   baseFee: number,
 *   distanceFee: number,
 *   totalFee: number,
 *   breakdown: string,
 *   isFreeRange: boolean
 * }}
 */
// Simple: This calculates the delivery fee.
function calculateDeliveryFee(distanceKm, overrides = {}) {
    const config = getResolvedDeliveryConfig(overrides);

    // Validate input
    if (!distanceKm || distanceKm < 0) {
        return {
            baseFee: 0,
            distanceFee: 0,
            totalFee: 0,
            breakdown: 'Invalid distance',
            isFreeRange: false
        };
    }

    const baseFee = config.baseFee;
    
    // Check if within free delivery range
    if (distanceKm <= config.freeDeliveryDistance) {
        return {
            baseFee: baseFee,
            distanceFee: 0,
            totalFee: baseFee,
            breakdown: `Base fee (within ${config.freeDeliveryDistance} km)`,
            isFreeRange: true
        };
    }

    // Calculate distance-based surcharge
    const extraDistance = distanceKm - config.freeDeliveryDistance;
    const distanceFee = Math.ceil(extraDistance) * config.feePerKm; // Round up km to nearest integer
    
    // Calculate total with cap
    let totalFee = baseFee + distanceFee;
    const isCapped = totalFee > config.maxFee;
    
    if (isCapped) {
        totalFee = config.maxFee;
    }

    return {
        baseFee: baseFee,
        distanceFee: isCapped ? config.maxFee - baseFee : distanceFee,
        totalFee: parseFloat(totalFee.toFixed(2)),
        breakdown: isCapped 
            ? `${baseFee} (base) + ${distanceFee} (distance) = ${baseFee + distanceFee} -> ${totalFee} (capped at max)`
            : `${baseFee} (base) + ${distanceFee} (${Math.ceil(extraDistance)} km x ${config.feePerKm})`,
        isFreeRange: false,
        isCapped: isCapped,
        distance: distanceKm
    };
}

/**
 * Get delivery fee configuration
 * Useful for displaying fee structure to customers
 * 
 * @returns {{
 *   baseFee: number,
 *   freeDeliveryDistance: number,
 *   feePerKm: number,
 *   maxFee: number
 * }}
 */
// Simple: This gets the delivery fee config.
function getDeliveryFeeConfig(overrides = {}) {
    const config = getResolvedDeliveryConfig(overrides);

    return {
        baseFee: config.baseFee,
        freeDeliveryDistance: config.freeDeliveryDistance,
        feePerKm: config.feePerKm,
        maxFee: config.maxFee
    };
}

/**
 * Estimate delivery fee for an address before order placement
 * Used for displaying fee estimates in UI
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Estimated delivery fee
 */
// Simple: This calculates the delivery fee.
function estimateDeliveryFee(distanceKm, overrides = {}) {
    const result = calculateDeliveryFee(distanceKm, overrides);
    return result.totalFee;
}

module.exports = {
    calculateDeliveryFee,
    getDeliveryFeeConfig,
    estimateDeliveryFee
};
