// CODEMAP: FRONTEND_SERVICES_PUBLICSETTINGSAPI_JS
// WHAT_THIS_IS: This file supports frontend behavior for publicSettingsApi.js.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: services/publicSettingsApi.js
// - Search text: publicSettingsApi.js
import { API_BASE_URL } from '../config/api';

const CACHE_TTL_MS = 60 * 1000;

let cachedSettings = null;
let cachedAt = 0;

const DEFAULT_PUBLIC_SETTINGS = {
    restaurantName: 'OrderFlow',
    email: 'contact@orderflow.com',
    phone: '+94 11 234 5678',
    address: '123 Main Street, Colombo, Sri Lanka',
    timezone: 'Asia/Colombo',
    currency: 'LKR',
    businessHours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '22:00', closed: false }
    },
    order: {
        prefix: 'ORD',
        minOrderAmount: 500,
        maxOrderAmount: 50000,
        autoConfirmOrders: true,
        timeoutMinutes: 30
    },
    delivery: {
        baseFee: 150,
        freeDeliveryThreshold: 0,
        maxDistanceKm: 15,
        estimatedDeliveryTimeMinutes: 45
    },
    paymentMethods: {
        cashOnDelivery: true,
        cardPayment: true,
        onlinePayment: true
    }
};

// Simple: This combines or filters the business hours.
const mergeBusinessHours = (incomingHours = {}) => {
    const defaults = DEFAULT_PUBLIC_SETTINGS.businessHours;
    return Object.keys(defaults).reduce((acc, day) => {
        acc[day] = {
            ...defaults[day],
            ...(incomingHours[day] || {})
        };
        return acc;
    }, {});
};

// Simple: This cleans or formats the public settings.
export const normalizePublicSettings = (incoming = {}) => ({
    ...DEFAULT_PUBLIC_SETTINGS,
    ...incoming,
    order: {
        ...DEFAULT_PUBLIC_SETTINGS.order,
        ...(incoming.order || {})
    },
    delivery: {
        ...DEFAULT_PUBLIC_SETTINGS.delivery,
        ...(incoming.delivery || {})
    },
    paymentMethods: {
        ...DEFAULT_PUBLIC_SETTINGS.paymentMethods,
        ...(incoming.paymentMethods || {})
    },
    businessHours: mergeBusinessHours(incoming.businessHours || {})
});

// Simple: This gets the public settings.
export const getPublicSettings = async ({ forceRefresh = false } = {}) => {
    const now = Date.now();

    if (!forceRefresh && cachedSettings && now - cachedAt < CACHE_TTL_MS) {
        return cachedSettings;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/settings/public`);
    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Failed to fetch public settings');
    }

    const normalized = normalizePublicSettings(payload?.data || {});
    cachedSettings = normalized;
    cachedAt = now;
    return normalized;
};

// Simple: This handles invalidate public settings cache logic.
export const invalidatePublicSettingsCache = () => {
    cachedSettings = null;
    cachedAt = 0;
};

// Simple: This gets the default public settings.
export const getDefaultPublicSettings = () => normalizePublicSettings();

