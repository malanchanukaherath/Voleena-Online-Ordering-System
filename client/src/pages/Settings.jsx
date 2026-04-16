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

    const handleInputChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

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
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FaCog className="text-orange-600" />
                    System Settings
                </h1>
                <p className="text-gray-600 mt-2">Configure your restaurant system settings</p>
            </div>

            {loadError && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {loadError}
                </div>
            )}

            {saveError && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {saveError}
                </div>
            )}

            {saveSuccess && (
                <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {saveSuccess}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {isLoading && (
                    <div className="border-b border-blue-200 bg-blue-50 px-6 py-3 text-sm text-blue-700">
                        Loading settings...
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 flex items-center gap-2 font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'border-b-2 border-orange-600 text-orange-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon />
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
                            <h2 className="text-xl font-semibold mb-4">General Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Restaurant Name
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.restaurantName}
                                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                                        <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                                        <option value="Asia/Dubai">Asia/Dubai (GMT+4:00)</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <textarea
                                        value={settings.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Hours */}
                    {activeTab === 'hours' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4">Business Hours</h2>

                            <div className="space-y-4">
                                {Object.keys(settings.businessHours).map(day => (
                                    <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-32">
                                            <span className="font-medium capitalize">{day}</span>
                                        </div>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.businessHours[day].closed}
                                                onChange={(e) => handleBusinessHoursChange(day, 'closed', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Closed</span>
                                        </label>

                                        {!settings.businessHours[day].closed && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-600">Open:</label>
                                                    <input
                                                        type="time"
                                                        value={settings.businessHours[day].open}
                                                        onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-600">Close:</label>
                                                    <input
                                                        type="time"
                                                        value={settings.businessHours[day].close}
                                                        onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
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
                            <h2 className="text-xl font-semibold mb-4">Order Configuration</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order Number Prefix
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.orderPrefix}
                                        onChange={(e) => handleInputChange('orderPrefix', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Order Amount (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.minOrderAmount}
                                        onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Order Amount (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.maxOrderAmount}
                                        onChange={(e) => handleInputChange('maxOrderAmount', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order Timeout (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.orderTimeout}
                                        onChange={(e) => handleInputChange('orderTimeout', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="md:col-span-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    Orders are confirmed automatically.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Settings */}
                    {activeTab === 'delivery' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4">Delivery Configuration</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Delivery Fee (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.deliveryFee}
                                        onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Free Delivery Threshold (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.freeDeliveryThreshold}
                                        onChange={(e) => handleInputChange('freeDeliveryThreshold', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Delivery Distance (km)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.maxDeliveryDistance}
                                        onChange={(e) => handleInputChange('maxDeliveryDistance', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estimated Delivery Time (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.estimatedDeliveryTime}
                                        onChange={(e) => handleInputChange('estimatedDeliveryTime', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium mb-3">Notification Channels</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.emailNotifications}
                                                onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Email Notifications</span>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.smsNotifications}
                                                onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">SMS Notifications</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium mb-3">Order Notifications</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.orderConfirmation}
                                                onChange={(e) => handleInputChange('orderConfirmation', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Order Confirmation</span>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.orderStatusUpdates}
                                                onChange={(e) => handleInputChange('orderStatusUpdates', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Order Status Updates</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium mb-3">Marketing</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.promotionalEmails}
                                                onChange={(e) => handleInputChange('promotionalEmails', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Promotional Emails</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Settings */}
                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium mb-3">Accepted Payment Methods</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.cashOnDelivery}
                                                onChange={(e) => handleInputChange('cashOnDelivery', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Cash on Delivery</span>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.onlinePayment}
                                                onChange={(e) => handleInputChange('onlinePayment', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Online Payment</span>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={settings.cardPayment}
                                                onChange={(e) => handleInputChange('cardPayment', e.target.checked)}
                                                className="rounded text-orange-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm">Card Payment</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Cash Change Available (LKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.minimumCashChange}
                                        onChange={(e) => handleInputChange('minimumCashChange', parseFloat(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Delivery staff should carry at least this amount in change
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <FaSave />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
