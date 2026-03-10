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
function calculateDeliveryFee(distanceKm) {
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

    const baseFee = BASE_DELIVERY_FEE;
    
    // Check if within free delivery range
    if (distanceKm <= FREE_DELIVERY_DISTANCE_KM) {
        return {
            baseFee: baseFee,
            distanceFee: 0,
            totalFee: baseFee,
            breakdown: `Base fee (within ${FREE_DELIVERY_DISTANCE_KM} km)`,
            isFreeRange: true
        };
    }

    // Calculate distance-based surcharge
    const extraDistance = distanceKm - FREE_DELIVERY_DISTANCE_KM;
    const distanceFee = Math.ceil(extraDistance) * DELIVERY_FEE_PER_KM; // Round up km to nearest integer
    
    // Calculate total with cap
    let totalFee = baseFee + distanceFee;
    const isCapped = totalFee > MAX_DELIVERY_FEE;
    
    if (isCapped) {
        totalFee = MAX_DELIVERY_FEE;
    }

    return {
        baseFee: baseFee,
        distanceFee: isCapped ? MAX_DELIVERY_FEE - baseFee : distanceFee,
        totalFee: parseFloat(totalFee.toFixed(2)),
        breakdown: isCapped 
            ? `${baseFee} (base) + ${distanceFee} (distance) = ${baseFee + distanceFee} → ${totalFee} (capped at max)`
            : `${baseFee} (base) + ${distanceFee} (${Math.ceil(extraDistance)} km × ${DELIVERY_FEE_PER_KM})`,
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
function getDeliveryFeeConfig() {
    return {
        baseFee: BASE_DELIVERY_FEE,
        freeDeliveryDistance: FREE_DELIVERY_DISTANCE_KM,
        feePerKm: DELIVERY_FEE_PER_KM,
        maxFee: MAX_DELIVERY_FEE
    };
}

/**
 * Estimate delivery fee for an address before order placement
 * Used for displaying fee estimates in UI
 * 
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Estimated delivery fee
 */
function estimateDeliveryFee(distanceKm) {
    const result = calculateDeliveryFee(distanceKm);
    return result.totalFee;
}

module.exports = {
    calculateDeliveryFee,
    getDeliveryFeeConfig,
    estimateDeliveryFee
};
