import { API_BASE_URL } from '../config/api';

const CACHE_TTL_MS = 60 * 1000;

let cachedSettings = null;
let cachedAt = 0;

const DEFAULT_PUBLIC_SETTINGS = {
    restaurantName: 'Voleena Foods',
    email: 'contact@voleenafoods.com',
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

export const invalidatePublicSettingsCache = () => {
    cachedSettings = null;
    cachedAt = 0;
};

export const getDefaultPublicSettings = () => normalizePublicSettings();
