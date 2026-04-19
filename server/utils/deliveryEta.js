const DEFAULT_MINUTES_PER_KM = 3;

const STAGE_BUFFER_MINUTES = {
    CONFIRMED: 15,
    PREPARING: 10,
    READY: 5,
    ASSIGNED: 0,
    PICKED_UP: 0,
    IN_TRANSIT: 0,
    OUT_FOR_DELIVERY: 0
};

// Code Review: Function getTravelMinutes in server\utils\deliveryEta.js. Used in: server/utils/deliveryEta.js.
function getTravelMinutes({ durationSeconds, distanceKm }) {
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
        return Math.ceil(durationSeconds / 60);
    }

    if (Number.isFinite(distanceKm) && distanceKm > 0) {
        return Math.ceil(distanceKm * DEFAULT_MINUTES_PER_KM);
    }

    return null;
}

// Code Review: Function getStageBufferMinutes in server\utils\deliveryEta.js. Used in: server/utils/deliveryEta.js.
function getStageBufferMinutes(stage) {
    return STAGE_BUFFER_MINUTES[stage] || 0;
}

// Code Review: Function calculateEstimatedDeliveryTime in server\utils\deliveryEta.js. Used in: server/controllers/adminController.js, server/controllers/deliveryController.js, server/services/orderService.js.
function calculateEstimatedDeliveryTime({ stage, durationSeconds, distanceKm, baseTime = new Date() }) {
    const travelMinutes = getTravelMinutes({ durationSeconds, distanceKm });

    if (!Number.isFinite(travelMinutes)) {
        return null;
    }

    const totalMinutes = travelMinutes + getStageBufferMinutes(stage);
    return new Date(baseTime.getTime() + totalMinutes * 60000);
}

module.exports = {
    calculateEstimatedDeliveryTime,
    getTravelMinutes,
    getStageBufferMinutes
};