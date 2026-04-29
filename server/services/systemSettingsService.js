// CODEMAP: BACKEND_SERVICE_SYSTEMSETTINGSSERVICE
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
const ADMIN_SETTINGS_KEY = 'admin_settings_payload_v1';
const ADMIN_SETTINGS_DESCRIPTION = 'Admin system settings payload (JSON)';
const SETTINGS_CACHE_TTL_MS = Number.parseInt(process.env.ADMIN_SETTINGS_CACHE_TTL_MS || '30000', 10);

let cachedAdminSettings = null;
let cachedAt = 0;

const DEFAULT_SETTINGS = Object.freeze({
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
    orderPrefix: 'ORD',
    minOrderAmount: 500,
    maxOrderAmount: 50000,
    orderTimeout: 30,
    autoConfirmOrders: true,
    deliveryFee: Number.parseFloat(process.env.DELIVERY_FEE || process.env.BASE_DELIVERY_FEE || '150'),
    freeDeliveryThreshold: 0,
    maxDeliveryDistance: 15,
    estimatedDeliveryTime: 45,
    emailNotifications: true,
    smsNotifications: true,
    orderConfirmation: true,
    orderStatusUpdates: true,
    promotionalEmails: false,
    cashOnDelivery: true,
    onlinePayment: true,
    cardPayment: true,
    minimumCashChange: 100
});

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const LEGACY_BRAND_PATTERN = /voleena/i;

// Simple: This handles clone default settings logic.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function cloneDefaultSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

// Simple: This cleans or formats the string.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeString(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
}

// Simple: This checks whether legacy brand value is true.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function isLegacyBrandValue(value) {
    return typeof value === 'string' && LEGACY_BRAND_PATTERN.test(value);
}

// Simple: This cleans or formats the restaurant name.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeRestaurantName(value, fallback) {
    if (isLegacyBrandValue(value)) {
        return fallback;
    }

    return normalizeString(value, fallback);
}

// Simple: This cleans or formats the email.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeEmail(value, fallback) {
    if (isLegacyBrandValue(value)) {
        return fallback;
    }

    return normalizeString(value, fallback);
}

// Simple: This cleans or formats the order prefix.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeOrderPrefix(value, fallback) {
    const normalized = normalizeString(value, fallback)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);

    if (normalized.length < 2) {
        return fallback;
    }

    return normalized;
}

// Simple: This cleans or formats the number.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeNumber(value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, isInteger = false } = {}) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    const normalized = isInteger ? Math.trunc(parsed) : parsed;

    if (normalized < min) return fallback;
    if (normalized > max) return fallback;

    return normalized;
}

// Simple: This cleans or formats the boolean.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeBoolean(value, fallback) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    return fallback;
}

// Simple: This cleans or formats the business hours.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeBusinessHours(hours) {
    const defaults = cloneDefaultSettings().businessHours;

    if (!hours || typeof hours !== 'object') {
        return defaults;
    }

    const normalized = {};

    for (const day of DAY_KEYS) {
        const dayValue = hours[day] || {};
        const dayDefaults = defaults[day];

        normalized[day] = {
            open: normalizeString(dayValue.open, dayDefaults.open),
            close: normalizeString(dayValue.close, dayDefaults.close),
            closed: normalizeBoolean(dayValue.closed, dayDefaults.closed)
        };
    }

    return normalized;
}

// Simple: This cleans or formats the settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeSettings(rawSettings) {
    const defaults = cloneDefaultSettings();
    const source = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};

    return {
        restaurantName: normalizeRestaurantName(source.restaurantName, defaults.restaurantName),
        email: normalizeEmail(source.email, defaults.email),
        phone: normalizeString(source.phone, defaults.phone),
        address: normalizeString(source.address, defaults.address),
        timezone: normalizeString(source.timezone, defaults.timezone),
        currency: normalizeString(source.currency, defaults.currency),
        businessHours: normalizeBusinessHours(source.businessHours),
        orderPrefix: normalizeOrderPrefix(source.orderPrefix, defaults.orderPrefix),
        minOrderAmount: normalizeNumber(source.minOrderAmount, defaults.minOrderAmount, { min: 0 }),
        maxOrderAmount: normalizeNumber(source.maxOrderAmount, defaults.maxOrderAmount, { min: 0 }),
        orderTimeout: normalizeNumber(source.orderTimeout, defaults.orderTimeout, { min: 1, max: 240, isInteger: true }),
        autoConfirmOrders: true,
        deliveryFee: normalizeNumber(source.deliveryFee, defaults.deliveryFee, { min: 0 }),
        freeDeliveryThreshold: normalizeNumber(source.freeDeliveryThreshold, defaults.freeDeliveryThreshold, { min: 0 }),
        maxDeliveryDistance: normalizeNumber(source.maxDeliveryDistance, defaults.maxDeliveryDistance, { min: 1 }),
        estimatedDeliveryTime: normalizeNumber(source.estimatedDeliveryTime, defaults.estimatedDeliveryTime, { min: 1, max: 360, isInteger: true }),
        emailNotifications: normalizeBoolean(source.emailNotifications, defaults.emailNotifications),
        smsNotifications: normalizeBoolean(source.smsNotifications, defaults.smsNotifications),
        orderConfirmation: normalizeBoolean(source.orderConfirmation, defaults.orderConfirmation),
        orderStatusUpdates: normalizeBoolean(source.orderStatusUpdates, defaults.orderStatusUpdates),
        promotionalEmails: normalizeBoolean(source.promotionalEmails, defaults.promotionalEmails),
        cashOnDelivery: normalizeBoolean(source.cashOnDelivery, defaults.cashOnDelivery),
        onlinePayment: normalizeBoolean(source.onlinePayment, defaults.onlinePayment),
        cardPayment: normalizeBoolean(source.cardPayment, defaults.cardPayment),
        minimumCashChange: normalizeNumber(source.minimumCashChange, defaults.minimumCashChange, { min: 0 })
    };
}

// Simple: This cleans or formats the cache ttl.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function normalizeCacheTtl() {
    if (!Number.isFinite(SETTINGS_CACHE_TTL_MS) || SETTINGS_CACHE_TTL_MS < 0) {
        return 30000;
    }
    return SETTINGS_CACHE_TTL_MS;
}

// Simple: This handles invalidate settings cache logic.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function invalidateSettingsCache() {
    cachedAdminSettings = null;
    cachedAt = 0;
}

// Simple: This gets the public settings from admin settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function getPublicSettingsFromAdminSettings(settings) {
    return {
        restaurantName: settings.restaurantName,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        timezone: settings.timezone,
        currency: settings.currency,
        businessHours: settings.businessHours,
        order: {
            prefix: settings.orderPrefix,
            minOrderAmount: settings.minOrderAmount,
            maxOrderAmount: settings.maxOrderAmount,
            autoConfirmOrders: true,
            timeoutMinutes: settings.orderTimeout
        },
        delivery: {
            baseFee: settings.deliveryFee,
            freeDeliveryThreshold: settings.freeDeliveryThreshold,
            maxDistanceKm: settings.maxDeliveryDistance,
            estimatedDeliveryTimeMinutes: settings.estimatedDeliveryTime
        },
        paymentMethods: {
            cashOnDelivery: settings.cashOnDelivery,
            cardPayment: settings.cardPayment,
            onlinePayment: settings.onlinePayment
        }
    };
}

// Simple: This gets the system setting model.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function getSystemSettingModel() {
    try {
        const models = require('../models');
        const model = models?.SystemSetting;

        if (!model || typeof model.findOne !== 'function') {
            return null;
        }

        return model;
    } catch {
        return null;
    }
}

// Simple: This checks whether system settings table missing error is true.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function isSystemSettingsTableMissingError(error) {
    const mysqlCode = error?.original?.code || error?.parent?.code;
    const message = [error?.message, error?.original?.sqlMessage, error?.parent?.sqlMessage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return (
        mysqlCode === 'ER_NO_SUCH_TABLE'
        || (message.includes('no such table') && message.includes('system_settings'))
        || (message.includes("doesn't exist") && message.includes('system_settings'))
    );
}

// Simple: This cleans or formats the stored settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
function parseStoredSettings(settingValue) {
    if (!settingValue || typeof settingValue !== 'string') {
        return {};
    }

    try {
        const parsed = JSON.parse(settingValue);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

// Simple: This gets the admin settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function getAdminSettings() {
    const ttlMs = normalizeCacheTtl();
    if (cachedAdminSettings && Date.now() - cachedAt < ttlMs) {
        return JSON.parse(JSON.stringify(cachedAdminSettings));
    }

    const SystemSetting = getSystemSettingModel();
    if (!SystemSetting) {
        const defaults = cloneDefaultSettings();
        cachedAdminSettings = defaults;
        cachedAt = Date.now();
        return JSON.parse(JSON.stringify(defaults));
    }

    try {
        const setting = await SystemSetting.findOne({ where: { SettingKey: ADMIN_SETTINGS_KEY } });
        const parsed = parseStoredSettings(setting?.SettingValue);
        const normalized = normalizeSettings(parsed);
        cachedAdminSettings = normalized;
        cachedAt = Date.now();
        return JSON.parse(JSON.stringify(normalized));
    } catch (error) {
        if (isSystemSettingsTableMissingError(error)) {
            const defaults = cloneDefaultSettings();
            cachedAdminSettings = defaults;
            cachedAt = Date.now();
            return JSON.parse(JSON.stringify(defaults));
        }
        throw error;
    }
}

// Simple: This gets the runtime settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function getRuntimeSettings() {
    return getAdminSettings();
}

// Simple: This gets the public settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function getPublicSettings() {
    const settings = await getAdminSettings();
    return getPublicSettingsFromAdminSettings(settings);
}

// Simple: This updates the admin settings.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
async function updateAdminSettings(rawSettings, updatedBy = null) {
    if (!rawSettings || typeof rawSettings !== 'object' || Array.isArray(rawSettings)) {
        const validationError = new Error('Settings payload must be a JSON object');
        validationError.statusCode = 400;
        throw validationError;
    }

    const normalized = normalizeSettings(rawSettings);
    const SystemSetting = getSystemSettingModel();

    if (!SystemSetting) {
        const tableError = new Error('System settings storage is not available. Apply the latest database schema and try again.');
        tableError.statusCode = 503;
        throw tableError;
    }

    try {
        const existing = await SystemSetting.findOne({ where: { SettingKey: ADMIN_SETTINGS_KEY } });

        if (existing) {
            await existing.update({
                SettingValue: JSON.stringify(normalized),
                Description: ADMIN_SETTINGS_DESCRIPTION,
                UpdatedBy: updatedBy || null,
                UpdatedAt: new Date()
            });
        } else {
            await SystemSetting.create({
                SettingKey: ADMIN_SETTINGS_KEY,
                SettingValue: JSON.stringify(normalized),
                Description: ADMIN_SETTINGS_DESCRIPTION,
                UpdatedBy: updatedBy || null,
                UpdatedAt: new Date()
            });
        }

        invalidateSettingsCache();

        return normalized;
    } catch (error) {
        if (isSystemSettingsTableMissingError(error)) {
            const tableError = new Error('System settings storage is not available. Apply the latest database schema and try again.');
            tableError.statusCode = 503;
            throw tableError;
        }

        throw error;
    }
}

module.exports = {
    getAdminSettings,
    getRuntimeSettings,
    getPublicSettings,
    updateAdminSettings,
    invalidateSettingsCache,
    normalizeSettings,
    DEFAULT_SETTINGS
};
