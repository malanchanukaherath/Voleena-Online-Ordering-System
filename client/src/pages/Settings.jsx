import React, { useEffect, useState } from 'react';
import { FaCog, FaStore, FaBell, FaCreditCard, FaTruck, FaSave, FaClock } from 'react-icons/fa';
import { adminService } from '../services/dashboardService';
import { invalidatePublicSettingsCache } from '../services/publicSettingsApi';

const DEFAULT_SETTINGS = {
    // General Settings
    restaurantName: 'Voleena Foods',
    email: 'contact@voleenafoods.com',
    phone: '+94 11 234 5678',
    address: '123 Main Street, Colombo, Sri Lanka',
    timezone: 'Asia/Colombo',
    currency: 'LKR',

    // Business Hours
    businessHours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '22:00', closed: false },
    },

    // Order Settings
    orderPrefix: 'ORD',
    minOrderAmount: 500,
    maxOrderAmount: 50000,
    orderTimeout: 30,
    autoConfirmOrders: true,

    // Delivery Settings
    deliveryFee: 150,
    freeDeliveryThreshold: 0,
    maxDeliveryDistance: 15,
    estimatedDeliveryTime: 45,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    orderConfirmation: true,
    orderStatusUpdates: true,
    promotionalEmails: false,

    // Payment Settings
    cashOnDelivery: true,
    onlinePayment: true,
    cardPayment: true,
    minimumCashChange: 100,
};

// Simple: This combines or filters the settings.
const mergeSettings = (incoming = {}) => {
    const incomingBusinessHours = incoming.businessHours || {};
    const businessHours = Object.keys(DEFAULT_SETTINGS.businessHours).reduce((acc, day) => {
        acc[day] = {
            ...DEFAULT_SETTINGS.businessHours[day],
            ...(incomingBusinessHours[day] || {})
        };
        return acc;
    }, {});

    return {
        ...DEFAULT_SETTINGS,
        ...incoming,
        autoConfirmOrders: true,
        businessHours
    };
};

// Simple: This shows the settings section.
const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    useEffect(() => {
        let isMounted = true;

        // Simple: This gets the settings.
        const loadSettings = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const response = await adminService.getSettings();
                const serverSettings = response?.data || {};

                if (isMounted) {
                    setSettings(mergeSettings(serverSettings));
                }
            } catch (error) {
                if (isMounted) {
                    setLoadError(error.message || 'Failed to load settings. Showing defaults.');
                    setSettings(DEFAULT_SETTINGS);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    // Simple: This handles what happens when input change is triggered.
    const handleInputChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Simple: This handles what happens when business hours change is triggered.
    const handleBusinessHoursChange = (day, field, value) => {
        setSettings(prev => ({
            ...prev,
            businessHours: {
                ...prev.businessHours,
                [day]: {
                    ...prev.businessHours[day],
                    [field]: value
                }
            }
        }));
    };

    // Simple: This handles what happens when save is triggered.
    const handleSave = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess('');

        try {
            const response = await adminService.updateSettings(settings);
            const savedSettings = response?.data || settings;
            setSettings(mergeSettings(savedSettings));
            invalidatePublicSettingsCache();
            window.dispatchEvent(new CustomEvent('publicSettingsUpdated'));
            setSaveSuccess('Settings saved successfully.');
        } catch (error) {
            setSaveError(error.message || 'Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: FaStore },
        { id: 'hours', label: 'Business Hours', icon: FaClock },
        { id: 'orders', label: 'Orders', icon: FaCog },
        { id: 'delivery', label: 'Delivery', icon: FaTruck },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
        { id: 'payments', label: 'Payments', icon: FaCreditCard },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <FaCog className="text-orange-600 dark:text-orange-400 w-4 h-4" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">System Settings</h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 ml-12">Configure your restaurant system settings</p>
            </div>

            {loadError && (
                <div className="mb-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    {loadError}
                </div>
            )}

            {saveError && (
                <div className="mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    {saveError}
                </div>
            )}

            {saveSuccess && (
                <div className="mb-4 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    {saveSuccess}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                {isLoading && (
                    <div className="border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 text-sm text-blue-700 dark:text-blue-400">
                        Loading settings...
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-100 dark:border-slate-700">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-3.5 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 -mb-px ${
                                    activeTab === tab.id
                                        ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/10'
                                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/60'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">

                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">General Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Restaurant Name</label>
                                    <input
                                        type="text"
                                        value={settings.restaurantName}
                                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={settings.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Timezone</label>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    >
                                        <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                                        <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                                        <option value="Asia/Dubai">Asia/Dubai (GMT+4:00)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Address</label>
                                    <textarea
                                        value={settings.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Hours */}
                    {activeTab === 'hours' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">Business Hours</h2>
                            <div className="space-y-3">
                                {Object.keys(settings.businessHours).map(day => (
                                    <div key={day} className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700">
                                        <div className="w-28">
                                            <span className="text-sm font-semibold capitalize text-gray-800 dark:text-slate-200">{day}</span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.businessHours[day].closed}
                                                onChange={(e) => handleBusinessHoursChange(day, 'closed', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-slate-400">Closed</span>
                                        </label>
                                        {!settings.businessHours[day].closed && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Open</label>
                                                    <input
                                                        type="time"
                                                        value={settings.businessHours[day].open}
                                                        onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                                                        className="px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Close</label>
                                                    <input
                                                        type="time"
                                                        value={settings.businessHours[day].close}
                                                        onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                                                        className="px-2.5 py-1.5 text-sm border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Order Settings */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">Order Configuration</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Order Number Prefix</label>
                                    <input
                                        type="text"
                                        value={settings.orderPrefix}
                                        onChange={(e) => handleInputChange('orderPrefix', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Minimum Order Amount (LKR)</label>
                                    <input
                                        type="number"
                                        value={settings.minOrderAmount}
                                        onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Maximum Order Amount (LKR)</label>
                                    <input
                                        type="number"
                                        value={settings.maxOrderAmount}
                                        onChange={(e) => handleInputChange('maxOrderAmount', parseFloat(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Order Timeout (minutes)</label>
                                    <input
                                        type="number"
                                        value={settings.orderTimeout}
                                        onChange={(e) => handleInputChange('orderTimeout', parseInt(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="md:col-span-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                                    Orders are confirmed automatically.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Settings */}
                    {activeTab === 'delivery' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">Delivery Configuration</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Delivery Fee (LKR)</label>
                                    <input
                                        type="number"
                                        value={settings.deliveryFee}
                                        onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Free Delivery Threshold (LKR)</label>
                                    <input
                                        type="number"
                                        value={settings.freeDeliveryThreshold}
                                        onChange={(e) => handleInputChange('freeDeliveryThreshold', parseFloat(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Maximum Delivery Distance (km)</label>
                                    <input
                                        type="number"
                                        value={settings.maxDeliveryDistance}
                                        onChange={(e) => handleInputChange('maxDeliveryDistance', parseFloat(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Estimated Delivery Time (minutes)</label>
                                    <input
                                        type="number"
                                        value={settings.estimatedDeliveryTime}
                                        onChange={(e) => handleInputChange('estimatedDeliveryTime', parseInt(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">Notification Preferences</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Notification Channels</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNotifications}
                                                onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Email Notifications</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.smsNotifications}
                                                onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">SMS Notifications</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Order Notifications</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.orderConfirmation}
                                                onChange={(e) => handleInputChange('orderConfirmation', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Order Confirmation</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.orderStatusUpdates}
                                                onChange={(e) => handleInputChange('orderStatusUpdates', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Order Status Updates</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Marketing</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.promotionalEmails}
                                                onChange={(e) => handleInputChange('promotionalEmails', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Promotional Emails</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Settings */}
                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">Payment Methods</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-3">Accepted Payment Methods</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.cashOnDelivery}
                                                onChange={(e) => handleInputChange('cashOnDelivery', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Cash on Delivery</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.onlinePayment}
                                                onChange={(e) => handleInputChange('onlinePayment', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Online Payment</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.cardPayment}
                                                onChange={(e) => handleInputChange('cardPayment', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-slate-300">Card Payment</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                                        Minimum Cash Change Available (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.minimumCashChange}
                                        onChange={(e) => handleInputChange('minimumCashChange', parseFloat(e.target.value))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5">
                                        Delivery staff should carry at least this amount in change
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50/80 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">Changes apply immediately after saving.</p>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-orange-600 text-white rounded-xl hover:bg-orange-700 active:bg-orange-800 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                        {isSaving ? (
                            <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                            <FaSave className="h-3.5 w-3.5" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
