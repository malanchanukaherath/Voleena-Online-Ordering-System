const { SystemSetting } = require('../models');

const ADMIN_SETTINGS_KEY = 'admin_settings_payload_v1';
const ADMIN_SETTINGS_DESCRIPTION = 'Admin system settings payload (JSON)';

const DEFAULT_SETTINGS = Object.freeze({
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
    orderPrefix: 'ORD',
    minOrderAmount: 500,
    maxOrderAmount: 50000,
    orderTimeout: 30,
    autoConfirmOrders: false,
    deliveryFee: 150,
    freeDeliveryThreshold: 2500,
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

function cloneDefaultSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function normalizeString(value, fallback) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
}

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

function normalizeBoolean(value, fallback) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    return fallback;
}

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

function normalizeSettings(rawSettings) {
    const defaults = cloneDefaultSettings();
    const source = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};

    return {
        restaurantName: normalizeString(source.restaurantName, defaults.restaurantName),
        email: normalizeString(source.email, defaults.email),
        phone: normalizeString(source.phone, defaults.phone),
        address: normalizeString(source.address, defaults.address),
        timezone: normalizeString(source.timezone, defaults.timezone),
        currency: normalizeString(source.currency, defaults.currency),
        businessHours: normalizeBusinessHours(source.businessHours),
        orderPrefix: normalizeString(source.orderPrefix, defaults.orderPrefix),
        minOrderAmount: normalizeNumber(source.minOrderAmount, defaults.minOrderAmount, { min: 0 }),
        maxOrderAmount: normalizeNumber(source.maxOrderAmount, defaults.maxOrderAmount, { min: 0 }),
        orderTimeout: normalizeNumber(source.orderTimeout, defaults.orderTimeout, { min: 1, max: 240, isInteger: true }),
        autoConfirmOrders: normalizeBoolean(source.autoConfirmOrders, defaults.autoConfirmOrders),
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

async function getAdminSettings() {
    try {
        const setting = await SystemSetting.findOne({ where: { SettingKey: ADMIN_SETTINGS_KEY } });
        const parsed = parseStoredSettings(setting?.SettingValue);
        return normalizeSettings(parsed);
    } catch (error) {
        if (isSystemSettingsTableMissingError(error)) {
            return cloneDefaultSettings();
        }
        throw error;
    }
}

async function updateAdminSettings(rawSettings, updatedBy = null) {
    if (!rawSettings || typeof rawSettings !== 'object' || Array.isArray(rawSettings)) {
        const validationError = new Error('Settings payload must be a JSON object');
        validationError.statusCode = 400;
        throw validationError;
    }

    const normalized = normalizeSettings(rawSettings);

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
    updateAdminSettings,
    normalizeSettings,
    DEFAULT_SETTINGS
};
