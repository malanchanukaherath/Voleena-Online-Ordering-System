import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { LoadScript, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';
import { getCart, clearCart } from '../utils/cartStorage';
import { createAddress, createOrder, initiatePayment, validateDeliveryDistance } from '../services/orderApi';

const RESTAURANT_LOCATION = {
    lat: 7.120035696626918,
    lng: 80.05250172082567,
};

const DELIVERY_MAP_LIBRARIES = ['places'];

const Checkout = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        orderType: 'DELIVERY',
        name: '',
        email: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        postalCode: '',
        paymentMethod: 'CASH',
        specialInstructions: '',
    });

    const [errors, setErrors] = useState({});
    const [distanceInfo, setDistanceInfo] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(100);
    const [deliveryFeeBreakdown, setDeliveryFeeBreakdown] = useState('');
    const [validatingDistance, setValidatingDistance] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [paymentClientSecret, setPaymentClientSecret] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [mapCenter, setMapCenter] = useState(RESTAURANT_LOCATION);
    const [searchAutocomplete, setSearchAutocomplete] = useState(null);
    const [mapSearchValue, setMapSearchValue] = useState('');
    const [deliveryAddressMethod, setDeliveryAddressMethod] = useState('');
    const cartItems = useMemo(() => getCart(), []);
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const fetchDeliveryFeeByDistance = async (distanceKm) => {
        if (!distanceKm) return;

        try {
            const feeResponse = await fetch('/api/v1/delivery/calculate-fee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ distanceKm })
            });
            const feeData = await feeResponse.json();
            if (feeData.success) {
                setDeliveryFee(feeData.data.totalFee);
                setDeliveryFeeBreakdown(feeData.data.breakdown);
            }
        } catch (err) {
            console.error('Failed to calculate delivery fee:', err);
        }
    };

    const validateCoordinatesForDelivery = async (lat, lng, outsideMessagePrefix = 'Selected location') => {
        try {
            setValidatingDistance(true);
            const response = await validateDeliveryDistance({ latitude: lat, longitude: lng });

            if (response.data?.success) {
                const data = response.data.data;
                setDistanceInfo({
                    isValid: data.isValid,
                    distance: data.distance,
                    maxDistance: data.maxDistance,
                    method: data.method
                });

                if (data.isValid && data.distance) {
                    await fetchDeliveryFeeByDistance(data.distance);
                }

                if (!data.isValid) {
                    setErrors(prev => ({
                        ...prev,
                        distance: `${outsideMessagePrefix} is outside our delivery area (${data.distance.toFixed(2)}km > ${data.maxDistance}km)`,
                        distanceSuggestion: null
                    }));
                } else {
                    setErrors(prev => {
                        const next = { ...prev };
                        delete next.distance;
                        delete next.distanceSuggestion;
                        return next;
                    });
                    setLocationError('');
                }
            }
        } catch (error) {
            console.error('Coordinate validation error:', error);
            setLocationError(error.response?.data?.message || 'Unable to validate selected location');
        } finally {
            setValidatingDistance(false);
        }
    };

    const extractCityFromAddressComponents = (components = []) => {
        const locality = components.find(component =>
            component.types.includes('locality') ||
            component.types.includes('postal_town') ||
            component.types.includes('administrative_area_level_2') ||
            component.types.includes('administrative_area_level_1')
        );

        return locality?.long_name || '';
    };

    const extractPostalCodeFromAddressComponents = (components = []) => {
        const postalCode = components.find(component => component.types.includes('postal_code'));
        return postalCode?.long_name || '';
    };

    const reverseGeocodeAndAutofill = async (lat, lng) => {
        if (!(window.google && window.google.maps && window.google.maps.Geocoder)) {
            return;
        }

        try {
            const geocoder = new window.google.maps.Geocoder();
            const { results } = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: { lat, lng } }, (res, status) => {
                    if (status === 'OK' && Array.isArray(res) && res.length > 0) {
                        resolve({ results: res });
                        return;
                    }

                    reject(new Error(status || 'Reverse geocoding failed'));
                });
            });

            const primaryResult = results[0];
            const components = primaryResult?.address_components || [];
            const streetNumber = components.find(component => component.types.includes('street_number'))?.long_name;
            const route = components.find(component => component.types.includes('route'))?.long_name;
            const neighborhood = components.find(component =>
                component.types.includes('neighborhood') ||
                component.types.includes('sublocality') ||
                component.types.includes('sublocality_level_1')
            )?.long_name;

            const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || neighborhood || primaryResult?.formatted_address || `Pinned location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
            const city = extractCityFromAddressComponents(components);
            const postalCode = extractPostalCodeFromAddressComponents(components);

            setMapSearchValue(primaryResult?.formatted_address || '');
            setFormData(prev => ({
                ...prev,
                addressLine1,
                city: city || prev.city,
                postalCode: postalCode || prev.postalCode
            }));
        } catch (error) {
            console.warn('Reverse geocoding failed for pinned location:', error.message);

            // Keep the flow safe: validation still works with coordinates even if reverse geocoding fails.
            setFormData(prev => ({
                ...prev,
                addressLine1: prev.addressLine1 || `Pinned location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
            }));
        }
    };

    const extractCityFromPlace = (place) => {
        return extractCityFromAddressComponents(place?.address_components || []);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDeliveryAddressMethodChange = (method) => {
        setDeliveryAddressMethod(method);
        setErrors(prev => {
            const next = { ...prev };
            delete next.deliveryAddressMethod;
            delete next.location;
            delete next.submit;
            return next;
        });

        setDistanceInfo(null);
        setDeliveryFee(100);
        setDeliveryFeeBreakdown('');
        setLocationError('');

        if (method === 'MANUAL') {
            setCurrentLocation(null);
            setMapCenter(RESTAURANT_LOCATION);
        }
    };

    /**
     * Get current GPS location and validate it for delivery
     */
    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }

        setGettingLocation(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setCurrentLocation({ lat, lng });
                setMapCenter({ lat, lng });
                setGettingLocation(false);

                await reverseGeocodeAndAutofill(lat, lng);

                await validateCoordinatesForDelivery(lat, lng, 'Your current location');
            },
            (error) => {
                setGettingLocation(false);
                if (error.code === 1) {
                    setLocationError('Location access denied. Please enable location permissions.');
                } else if (error.code === 2) {
                    setLocationError('Unable to determine your location right now.');
                } else if (error.code === 3) {
                    setLocationError('Location request timed out. Please try again.');
                } else {
                    setLocationError('Unable to get your current location.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    };

    const handleMapClick = async (event) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
        }

        setCurrentLocation({ lat, lng });
        setMapCenter({ lat, lng });
        setLocationError('');

        await reverseGeocodeAndAutofill(lat, lng);

        await validateCoordinatesForDelivery(lat, lng, 'Pinned location');
    };

    const handleMarkerDragEnd = async (event) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
        }

        setCurrentLocation({ lat, lng });
        setMapCenter({ lat, lng });

        await reverseGeocodeAndAutofill(lat, lng);

        await validateCoordinatesForDelivery(lat, lng, 'Pinned location');
    };

    const handlePlaceChanged = async () => {
        if (!searchAutocomplete) {
            return;
        }

        const place = searchAutocomplete.getPlace();
        const lat = place?.geometry?.location?.lat?.();
        const lng = place?.geometry?.location?.lng?.();

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            setLocationError('No precise coordinates were found for this search. Try selecting a suggested area.');
            return;
        }

        const placeLabel = place?.formatted_address || place?.name || '';
        const detectedCity = extractCityFromPlace(place);
        const detectedPostalCode = extractPostalCodeFromAddressComponents(place?.address_components || []);

        setMapSearchValue(placeLabel);
        setCurrentLocation({ lat, lng });
        setMapCenter({ lat, lng });
        setLocationError('');

        setFormData(prev => ({
            ...prev,
            addressLine1: placeLabel || prev.addressLine1,
            city: detectedCity || prev.city,
            postalCode: detectedPostalCode || prev.postalCode
        }));

        await validateCoordinatesForDelivery(lat, lng, 'Selected searched location');
    };

    /**
     * Validate delivery distance when address changes or on blur
     * Only validates if address line is at least 5 characters and city is provided
     */
    const validateDeliveryAddressDistance = async () => {
        // Skip validation if not delivery order
        if (formData.orderType !== 'DELIVERY') {
            return;
        }

        // Skip validation if required fields are not properly filled
        // (addressLine1 must be at least 5 chars, city must be provided)
        if (!formData.addressLine1 || formData.addressLine1.trim().length < 5) {
            return; // Silently skip - user is still typing
        }

        if (!formData.city || formData.city.trim().length < 2) {
            return; // Silently skip - user hasn't entered city yet
        }

        setValidatingDistance(true);
        try {
            const payload = {
                address: {
                    addressLine1: formData.addressLine1,
                    city: formData.city,
                    district: formData.postalCode
                }
            };

            console.log('[Distance Validation] Sending request with:', payload);
            const response = await validateDeliveryDistance(payload);

            console.log('[Distance Validation] Response:', response.data);

            if (response.data?.success) {
                const data = response.data.data;
                setDistanceInfo({
                    isValid: data.isValid,
                    distance: data.distance,
                    maxDistance: data.maxDistance,
                    method: data.method
                });

                // Calculate delivery fee based on distance
                if (data.isValid && data.distance) {
                    try {
                        const feeResponse = await fetch('/api/v1/delivery/calculate-fee', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ distanceKm: data.distance })
                        });
                        const feeData = await feeResponse.json();
                        if (feeData.success) {
                            setDeliveryFee(feeData.data.totalFee);
                            setDeliveryFeeBreakdown(feeData.data.breakdown);
                        }
                    } catch (err) {
                        console.error('Failed to calculate delivery fee:', err);
                    }
                }

                if (!data.isValid) {
                    setErrors(prev => ({
                        ...prev,
                        distance: `Delivery address is outside our service area (${data.distance.toFixed(2)}km > ${data.maxDistance}km)`
                    }));
                } else {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.distance;
                        return newErrors;
                    });
                }
            }
        } catch (error) {
            console.error('Distance validation error:', error);

            // Show specific error message from server if available
            const errorMessage = error.response?.data?.message || 'Unable to validate delivery distance';
            const suggestion = error.response?.data?.suggestion;

            setDistanceInfo(null);
            setErrors(prev => ({
                ...prev,
                distance: errorMessage,
                distanceSuggestion: suggestion === 'USE_GPS_LOCATION' ? 'Use map pin/search or the "Use Current Location" button to set coordinates accurately.' : null
            }));
        } finally {
            setValidatingDistance(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

        if (formData.orderType === 'DELIVERY') {
            if (!deliveryAddressMethod) {
                newErrors.deliveryAddressMethod = 'Please choose one delivery address method';
            } else if (deliveryAddressMethod === 'GPS') {
                if (!currentLocation) newErrors.location = 'Please pin your delivery location or use your current location';
            } else if (deliveryAddressMethod === 'MANUAL') {
                if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
                if (!formData.city.trim()) newErrors.city = 'City is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (cartItems.length === 0) {
            setErrors({ cart: 'Your cart is empty' });
            return;
        }

        if (formData.orderType === 'DELIVERY' && !deliveryAddressMethod) {
            setErrors(prev => ({
                ...prev,
                deliveryAddressMethod: 'Please choose one delivery address method'
            }));
            return;
        }

        try {
            let addressId = null;

            if (formData.orderType === 'DELIVERY') {
                // Validate delivery distance before placing order
                let distanceValidation;

                if (deliveryAddressMethod === 'GPS') {
                    if (!currentLocation) {
                        throw new Error('Please pin your delivery location or use your current location');
                    }

                    distanceValidation = await validateDeliveryDistance({
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng
                    });
                } else {
                    // Otherwise, use address
                    distanceValidation = await validateDeliveryDistance({
                        address: {
                            addressLine1: formData.addressLine1,
                            city: formData.city,
                            district: formData.postalCode
                        }
                    });
                }

                if (!distanceValidation.data?.success) {
                    throw new Error(distanceValidation.data?.message || 'Unable to validate delivery address');
                }

                const validationData = distanceValidation.data.data;
                if (!validationData.isValid) {
                    throw new Error(
                        `Delivery address is outside our service area (${validationData.distance.toFixed(2)}km > ${validationData.maxDistance}km)`
                    );
                }

                const fallbackGpsAddress = currentLocation
                    ? `Pinned location (${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)})`
                    : '';

                const resolvedAddressLine1 = formData.addressLine1.trim() || (deliveryAddressMethod === 'GPS' ? fallbackGpsAddress : '');
                const resolvedCity = formData.city.trim() || (deliveryAddressMethod === 'GPS' ? 'Location Pin' : '');

                if (!resolvedAddressLine1 || !resolvedCity) {
                    throw new Error('Delivery address details are incomplete. Please provide address and city.');
                }

                // Create address - include coordinates only for GPS mode
                const addressResponse = await createAddress({
                    addressLine1: resolvedAddressLine1,
                    addressLine2: formData.addressLine2 || null,
                    city: resolvedCity,
                    postalCode: formData.postalCode || null,
                    district: null,
                    latitude: deliveryAddressMethod === 'GPS' ? currentLocation?.lat || null : null,
                    longitude: deliveryAddressMethod === 'GPS' ? currentLocation?.lng || null : null
                });
                addressId = addressResponse.data?.address?.id || addressResponse.data?.addressId || null;
            }

            const orderPayload = {
                orderType: formData.orderType,
                addressId,
                specialInstructions: formData.specialInstructions,
                items: cartItems.map((item) => ({
                    menuItemId: item.type === 'menu' ? item.menuItemId || item.id : null,
                    comboId: item.type === 'combo' ? item.comboId || item.id : null,
                    quantity: item.quantity,
                    notes: item.notes || null
                }))
            };

            const orderResponse = await createOrder(orderPayload);
            const orderId = orderResponse.data?.data?.OrderID;

            if (!orderId) {
                throw new Error('Order creation failed');
            }

            if (formData.paymentMethod === 'CARD') {
                // Stripe card payment - show payment modal
                const paymentResponse = await initiatePayment(orderId, formData.paymentMethod);
                const paymentData = paymentResponse.data?.data;

                if (paymentData?.clientSecret) {
                    setCurrentOrderId(orderId);
                    setPaymentClientSecret(paymentData.clientSecret);
                    setShowStripeModal(true);
                    return;
                }

                throw new Error('Failed to initialize card payment');
            }

            if (formData.paymentMethod === 'ONLINE') {
                // PayHere payment - redirect to payment form
                const paymentResponse = await initiatePayment(orderId, formData.paymentMethod);
                const paymentData = paymentResponse.data?.data;

                if (paymentData?.paymentUrl && paymentData?.paymentData) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = paymentData.paymentUrl;

                    Object.entries(paymentData.paymentData).forEach(([key, value]) => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = value;
                        form.appendChild(input);
                    });

                    document.body.appendChild(form);
                    form.submit();
                    return;
                }
            }

            clearCart();
            navigate(`/order-confirmation/${orderId}`);
        } catch (error) {
            console.error('Checkout error:', error);
            const message = error.response?.data?.message || error.message || 'Failed to place order';
            const nextErrors = { submit: message };

            if (message.toLowerCase().includes('delivery address is outside')) {
                nextErrors.addressLine1 = message;
            }

            if (message.toLowerCase().includes('geocode')) {
                nextErrors.addressLine1 = 'We could not validate this address. Please check the address details.';
            }

            setErrors(nextErrors);
        }
    };

    // Cart summary (no tax - business decision to show only delivery fee)
    const cartSummary = {
        subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryFee: formData.orderType === 'DELIVERY' ? deliveryFee : 0,
    };
    cartSummary.total = cartSummary.subtotal + cartSummary.deliveryFee;

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Type */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Order Type</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, orderType: 'DELIVERY' }))}
                                    className={`p-4 border-2 rounded-lg transition-colors ${formData.orderType === 'DELIVERY'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <div className="font-semibold">Delivery</div>
                                    <div className="text-sm text-gray-600">Distance-based fee</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, orderType: 'TAKEAWAY' }))}
                                    className={`p-4 border-2 rounded-lg transition-colors ${formData.orderType === 'TAKEAWAY'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <div className="font-semibold">Takeaway</div>
                                    <div className="text-sm text-gray-600">Free</div>
                                </button>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <Input
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    required
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={errors.email}
                                        required
                                    />
                                    <Input
                                        label="Phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        error={errors.phone}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address (with Distance Validation) */}
                        {formData.orderType === 'DELIVERY' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                                
                                {/* Two Options Box */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Choose how to provide your delivery address:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleDeliveryAddressMethodChange('GPS')}
                                            className={`text-left flex items-start space-x-3 p-3 bg-white rounded border-2 transition-colors ${deliveryAddressMethod === 'GPS'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <FaMapMarkerAlt className="text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">GPS Location</p>
                                                <p className="text-xs text-gray-600 mt-1">Pin on map or use your current location</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeliveryAddressMethodChange('MANUAL')}
                                            className={`text-left flex items-start space-x-3 p-3 bg-white rounded border-2 transition-colors ${deliveryAddressMethod === 'MANUAL'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Manual Entry</p>
                                                <p className="text-xs text-gray-600 mt-1">Type your full delivery address</p>
                                            </div>
                                        </button>
                                    </div>

                                    {errors.deliveryAddressMethod && (
                                        <p className="text-sm text-red-600 mt-3">{errors.deliveryAddressMethod}</p>
                                    )}
                                </div>

                                {deliveryAddressMethod === 'GPS' && (
                                    <>
                                        <div className="mb-4">
                                            <button
                                                type="button"
                                                onClick={handleUseCurrentLocation}
                                                disabled={gettingLocation}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {gettingLocation ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Getting current location...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaMapMarkerAlt />
                                                        Use Current Location
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {googleMapsApiKey ? (
                                            <div className="mb-6 rounded-lg border border-gray-200 overflow-hidden">
                                                <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={DELIVERY_MAP_LIBRARIES}>
                                                    <div className="p-4 border-b border-gray-200 bg-white">
                                                        <p className="text-sm font-medium text-gray-800 mb-2">Pin exact delivery point on map</p>
                                                        <p className="text-xs text-gray-600 mb-3">
                                                            Search a nearby area, then click or drag the marker to the exact location.
                                                        </p>
                                                        <Autocomplete
                                                            onLoad={setSearchAutocomplete}
                                                            onPlaceChanged={handlePlaceChanged}
                                                            options={{
                                                                componentRestrictions: { country: 'lk' },
                                                                fields: ['formatted_address', 'geometry', 'address_components', 'name']
                                                            }}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={mapSearchValue}
                                                                onChange={(e) => setMapSearchValue(e.target.value)}
                                                                placeholder="Search area, street, or landmark (e.g., Kalagedihena, Gampaha)"
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                            />
                                                        </Autocomplete>
                                                    </div>

                                                    <GoogleMap
                                                        mapContainerStyle={{ width: '100%', height: '320px' }}
                                                        center={currentLocation || mapCenter}
                                                        zoom={currentLocation ? 16 : 13}
                                                        onClick={handleMapClick}
                                                        options={{
                                                            fullscreenControl: false,
                                                            mapTypeControl: false,
                                                            streetViewControl: false,
                                                        }}
                                                    >
                                                        {currentLocation && (
                                                            <Marker
                                                                position={currentLocation}
                                                                draggable
                                                                onDragEnd={handleMarkerDragEnd}
                                                            />
                                                        )}
                                                    </GoogleMap>
                                                </LoadScript>

                                                <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-700">
                                                    Tip: This works even when you are not physically at the delivery address. Pick the home/office location directly on the map.
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                                Map pinning is unavailable because Google Maps key is missing. You can still use your current GPS location.
                                            </div>
                                        )}

                                        {errors.location && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                {errors.location}
                                            </div>
                                        )}

                                        {locationError && (
                                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                                                {locationError}
                                            </div>
                                        )}

                                        {currentLocation && (
                                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-start">
                                                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="font-medium">GPS coordinates captured successfully!</p>
                                                    <p className="text-xs mt-1 opacity-90">Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</p>
                                                    {(formData.addressLine1 || formData.city) && (
                                                        <p className="text-xs mt-1">Detected address: {formData.addressLine1 || 'Pinned location'}{formData.city ? `, ${formData.city}` : ''}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Input
                                            label="Additional Delivery Details (Optional)"
                                            name="addressLine2"
                                            value={formData.addressLine2}
                                            onChange={handleChange}
                                            placeholder="Apartment, floor, landmark, etc."
                                        />
                                    </>
                                )}

                                {deliveryAddressMethod === 'MANUAL' && (
                                    <div className="space-y-4">
                                        <Input
                                            label="Address Line 1"
                                            name="addressLine1"
                                            value={formData.addressLine1}
                                            onChange={handleChange}
                                            onBlur={validateDeliveryAddressDistance}
                                            error={errors.addressLine1}
                                            required
                                        />
                                        <Input
                                            label="Address Line 2"
                                            name="addressLine2"
                                            value={formData.addressLine2}
                                            onChange={handleChange}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="City"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                onBlur={validateDeliveryAddressDistance}
                                                error={errors.city}
                                                required
                                            />
                                            <Input
                                                label="Postal Code"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}

                                {deliveryAddressMethod && validatingDistance && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                        Validating delivery distance...
                                    </div>
                                )}

                                {deliveryAddressMethod && distanceInfo && (
                                    <div className={`mt-4 p-3 rounded border-2 ${distanceInfo.isValid
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-red-50 border-red-200 text-red-700'
                                        }`}>
                                        <div className="text-sm font-semibold">
                                            Delivery Distance: {distanceInfo.distance.toFixed(2)} km
                                        </div>
                                        <div className="text-xs mt-1">
                                            {distanceInfo.isValid
                                                ? `✓ Within service area (max ${distanceInfo.maxDistance}km)`
                                                : `✗ Outside service area (max ${distanceInfo.maxDistance}km)`
                                            }
                                        </div>
                                        <div className="text-xs mt-1 opacity-75">
                                            Calculated via {distanceInfo.method === 'google_maps' ? 'Google Maps' : 'straight-line approximation'}
                                        </div>
                                    </div>
                                )}

                                {deliveryAddressMethod && errors.distance && (
                                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <p className="text-sm text-red-700 font-medium">{errors.distance}</p>
                                                {errors.distanceSuggestion && (
                                                    <div className="mt-3">
                                                        <p className="text-sm text-red-600 mb-2">
                                                            {errors.distanceSuggestion}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleDeliveryAddressMethodChange('GPS');
                                                                handleUseCurrentLocation();
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                        >
                                                            <FaMapMarkerAlt className="mr-1.5" />
                                                            Use My GPS Location
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                            <Select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                options={[
                                    { value: 'CASH', label: 'Cash on Delivery' },
                                    { value: 'CARD', label: 'Card Payment (Stripe)' },
                                    { value: 'ONLINE', label: 'Online Payment (Coming Soon)', disabled: true },
                                ]}
                            />
                            {formData.paymentMethod === 'CARD' && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                    💳 Secure card payments powered by Stripe. Your card details are never stored on our servers.
                                </div>
                            )}
                        </div>

                        {/* Special Instructions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Special Instructions</h2>
                            <Textarea
                                name="specialInstructions"
                                value={formData.specialInstructions}
                                onChange={handleChange}
                                placeholder="Any special requests or delivery instructions..."
                                rows={3}
                                maxLength={500}
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>LKR {cartSummary.subtotal.toFixed(2)}</span>
                                </div>
                                {formData.orderType === 'DELIVERY' && (
                                    <div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery Fee</span>
                                            <span>LKR {cartSummary.deliveryFee.toFixed(2)}</span>
                                        </div>
                                        {distanceInfo && deliveryFeeBreakdown && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {distanceInfo.distance.toFixed(2)}km - {deliveryFeeBreakdown}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-primary-600">LKR {cartSummary.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {errors.submit && (
                                <p className="text-sm text-red-600 mb-3">{errors.submit}</p>
                            )}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full mb-3"
                                disabled={cartItems.length === 0 || isSubmitting || (formData.orderType === 'DELIVERY' && !distanceInfo?.isValid)}
                            >
                                {isSubmitting ? 'Placing Order...' : 'Place Order'}
                            </Button>

                            <Link
                                to="/cart"
                                className="block text-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </form>

            {/* Stripe Payment Modal */}
            <StripePaymentModal
                isOpen={showStripeModal}
                clientSecret={paymentClientSecret}
                orderId={currentOrderId}
                total={cartSummary.total}
                onSuccess={(paymentIntent) => {
                    // Payment succeeded - redirect to confirmation
                    clearCart();
                    navigate(`/order-confirmation/${currentOrderId}`);
                }}
                onCancel={() => {
                    setShowStripeModal(false);
                    setCurrentOrderId(null);
                    setPaymentClientSecret(null);
                }}
                onError={(error) => {
                    console.error('Payment error:', error);
                    setErrors(prev => ({
                        ...prev,
                        payment: error || 'Payment failed. Please try again.'
                    }));
                }}
            />
        </div>
    );
};

export default Checkout;
