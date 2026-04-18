import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { LoadScript, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';
import { getCart, clearCart } from '../utils/cartStorage';
import { calculateDeliveryFeeByDistance, confirmCardPayment, createOrder, initiatePayment, validateDeliveryDistance } from '../services/orderApi';
import { getCustomerAddresses, getCustomerProfile } from '../services/profileService';
import { usePublicSettings } from '../hooks/usePublicSettings';

const RESTAURANT_LOCATION = {
    lat: 7.120035696626918,
    lng: 80.05250172082567,
};

const DELIVERY_MAP_LIBRARIES = ['places'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DELIVERY_LOCATION_MODES = {
    ADDRESS: 'ADDRESS',
    PIN: 'PIN',
};

const mapSavedAddress = (address = {}) => ({
    id: address.AddressID ?? address.address_id ?? address.id ?? null,
    addressLine1: (address.AddressLine1 ?? address.addressLine1 ?? '').trim(),
    addressLine2: (address.AddressLine2 ?? address.addressLine2 ?? '').trim(),
    city: (address.City ?? address.city ?? '').trim(),
    postalCode: (address.PostalCode ?? address.postalCode ?? '').trim(),
});

const formatSavedAddressLabel = (address) => {
    const parts = [address.addressLine1, address.city, address.postalCode].filter(Boolean);
    return parts.join(', ');
};

const Checkout = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        orderType: 'DELIVERY',
        isPreorder: false,
        scheduledDatetime: '',
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
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [gpsDetectedAddress, setGpsDetectedAddress] = useState('');
    const cartItems = useMemo(() => getCart(), []);
    const { settings: publicSettings } = usePublicSettings();
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
    const isStripeClientConfigured = Boolean(
        stripePublishableKey && stripePublishableKey.startsWith('pk_') && !stripePublishableKey.includes('your_')
    );
    const paymentMethodSettings = publicSettings.paymentMethods || {};
    const availablePaymentOptions = useMemo(() => {
        const options = [];

        if (paymentMethodSettings.cashOnDelivery !== false) {
            options.push({ value: 'CASH', label: 'Cash on Delivery' });
        }

        if (paymentMethodSettings.cardPayment !== false) {
            options.push({ value: 'CARD', label: 'Card Payment (Stripe)' });
        }

        if (paymentMethodSettings.onlinePayment !== false) {
            options.push({ value: 'ONLINE', label: 'Online Payment (PayHere)' });
        }

        if (options.length === 0) {
            options.push({ value: 'CASH', label: 'Cash on Delivery' });
        }

        return options;
    }, [paymentMethodSettings.cashOnDelivery, paymentMethodSettings.cardPayment, paymentMethodSettings.onlinePayment]);

    const selectedSavedAddress = useMemo(() => (
        savedAddresses.find((address) => String(address.id) === String(selectedAddressId)) || null
    ), [savedAddresses, selectedAddressId]);

    const savedAddressOptions = useMemo(() => (
        savedAddresses
            .filter((address) => address.id !== null && address.id !== undefined)
            .map((address) => ({
                value: String(address.id),
                label: formatSavedAddressLabel(address)
            }))
    ), [savedAddresses]);

    const fetchDeliveryFeeByDistance = useCallback(async (distanceKm) => {
        const numericDistance = Number(distanceKm);
        if (!Number.isFinite(numericDistance) || numericDistance < 0) {
            return;
        }

        try {
            const feeResponse = await calculateDeliveryFeeByDistance(numericDistance);
            if (feeResponse.data?.success) {
                setDeliveryFee(feeResponse.data.data.totalFee);
                setDeliveryFeeBreakdown(feeResponse.data.data.breakdown);
            }
        } catch (err) {
            console.error('Failed to calculate delivery fee:', err);
        }
    }, []);

    const validateDeliveryAddressDistance = useCallback(async (addressOverride) => {
        const candidateAddress = {
            addressLine1: String(addressOverride?.addressLine1 ?? ''),
            city: String(addressOverride?.city ?? ''),
            postalCode: String(addressOverride?.postalCode ?? '')
        };

        if (!candidateAddress.addressLine1 || candidateAddress.addressLine1.trim().length < 5) {
            return;
        }

        if (!candidateAddress.city || candidateAddress.city.trim().length < 2) {
            return;
        }

        setValidatingDistance(true);
        try {
            const payload = {
                address: {
                    addressLine1: candidateAddress.addressLine1.trim(),
                    city: candidateAddress.city.trim(),
                    postalCode: candidateAddress.postalCode?.trim() || null
                }
            };

            const response = await validateDeliveryDistance(payload);

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
                        distance: `Delivery address is outside our service area (${data.distance.toFixed(2)}km > ${data.maxDistance}km)`
                    }));
                } else {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.distance;
                        delete newErrors.savedAddressId;
                        return newErrors;
                    });
                }
            }
        } catch (error) {
            console.error('Distance validation error:', error);

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
    }, [fetchDeliveryFeeByDistance]);

    useEffect(() => {
        if (formData.orderType === 'DELIVERY' && !deliveryAddressMethod) {
            setDeliveryAddressMethod(DELIVERY_LOCATION_MODES.ADDRESS);
        }
    }, [deliveryAddressMethod, formData.orderType]);

    useEffect(() => {
        const baseDeliveryFee = Number(publicSettings.delivery?.baseFee);
        if (Number.isFinite(baseDeliveryFee) && formData.orderType === 'DELIVERY' && !distanceInfo) {
            setDeliveryFee(baseDeliveryFee);
        }

        if (!availablePaymentOptions.some((opt) => opt.value === formData.paymentMethod)) {
            setFormData((prev) => ({
                ...prev,
                paymentMethod: availablePaymentOptions[0]?.value || 'CASH'
            }));
        }
    }, [publicSettings.delivery?.baseFee, formData.orderType, formData.paymentMethod, distanceInfo, availablePaymentOptions]);

    useEffect(() => {
        let isMounted = true;

        const loadCheckoutDefaults = async () => {
            const [profileResult, addressResult] = await Promise.allSettled([
                getCustomerProfile(),
                getCustomerAddresses(),
            ]);

            if (!isMounted) {
                return;
            }

            if (profileResult.status === 'fulfilled') {
                const profile = profileResult.value?.data?.data || {};
                setFormData((prev) => ({
                    ...prev,
                    name: (profile.Name ?? profile.name ?? prev.name ?? '').trim(),
                    email: (profile.Email ?? profile.email ?? prev.email ?? '').trim(),
                    phone: (profile.Phone ?? profile.phone ?? prev.phone ?? '').trim(),
                }));
            }

            if (addressResult.status === 'fulfilled') {
                const savedRows = addressResult.value?.data?.data || [];
                const mappedAddresses = savedRows.map(mapSavedAddress).filter((address) => address.id !== null && address.id !== undefined);

                setSavedAddresses(mappedAddresses);

                const defaultAddress = mappedAddresses[0] || null;
                const hasSavedAddress = Boolean(defaultAddress?.addressLine1 && defaultAddress?.city);

                if (hasSavedAddress) {
                    setSelectedAddressId(String(defaultAddress.id));
                    setFormData((prev) => ({
                        ...prev,
                        addressLine1: defaultAddress.addressLine1,
                        addressLine2: defaultAddress.addressLine2,
                        city: defaultAddress.city,
                        postalCode: defaultAddress.postalCode,
                    }));
                    setDeliveryAddressMethod(DELIVERY_LOCATION_MODES.ADDRESS);
                    setCurrentLocation(null);
                    setMapCenter(RESTAURANT_LOCATION);
                    setMapSearchValue('');
                    setGpsDetectedAddress('');
                    setLocationError('');

                    await validateDeliveryAddressDistance(defaultAddress);
                } else {
                    setSelectedAddressId('');
                }
            }
        };

        loadCheckoutDefaults();

        return () => {
            isMounted = false;
        };
    }, [validateDeliveryAddressDistance]);

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
                        delete next.location;
                        delete next.savedAddressId;
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
            const composedDetectedAddress = [addressLine1, city].filter(Boolean).join(', ');

            setMapSearchValue(primaryResult?.formatted_address || '');
            setGpsDetectedAddress(composedDetectedAddress || primaryResult?.formatted_address || '');
        } catch (error) {
            console.warn('Reverse geocoding failed for pinned location:', error.message);
            setGpsDetectedAddress('');
            setLocationError('Location pin captured, but we could not auto-detect a readable area name. You can still continue with GPS pinning.');
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

    // Prevent accidental order placement when pressing Enter inside form fields.
    const handleFormKeyDown = (e) => {
        if (e.key !== 'Enter') {
            return;
        }

        const target = e.target;
        const tagName = target?.tagName?.toLowerCase();
        const inputType = target?.getAttribute?.('type')?.toLowerCase() || '';
        const isTextarea = tagName === 'textarea';
        const isButton = tagName === 'button';
        const isActionInput = tagName === 'input' && ['submit', 'button'].includes(inputType);

        if (isTextarea || isButton || isActionInput) {
            return;
        }

        e.preventDefault();
    };

    const handleMapSearchKeyDown = async (e) => {
        if (e.key !== 'Enter') {
            return;
        }

        // Keep Enter from triggering checkout submit when searching locations.
        e.preventDefault();
        e.stopPropagation();

        await handlePlaceChanged();
    };

    const clearDeliveryValidationErrors = () => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next.deliveryAddressMethod;
            delete next.location;
            delete next.submit;
            delete next.distance;
            delete next.distanceSuggestion;
            delete next.addressLine1;
            delete next.city;
            delete next.savedAddressId;
            return next;
        });
    };

    const handleSavedAddressChange = async (e) => {
        const nextAddressId = e.target.value;
        setSelectedAddressId(nextAddressId);
        clearDeliveryValidationErrors();

        const nextAddress = savedAddresses.find((address) => String(address.id) === String(nextAddressId));
        if (!nextAddress) {
            setDistanceInfo(null);
            return;
        }

        setFormData((prev) => ({
            ...prev,
            addressLine1: nextAddress.addressLine1,
            addressLine2: nextAddress.addressLine2,
            city: nextAddress.city,
            postalCode: nextAddress.postalCode
        }));

        if (formData.orderType === 'DELIVERY' && deliveryAddressMethod === DELIVERY_LOCATION_MODES.ADDRESS) {
            setDistanceInfo(null);
            setDeliveryFee(Number(publicSettings.delivery?.baseFee) || 100);
            setDeliveryFeeBreakdown('');
            await validateDeliveryAddressDistance(nextAddress);
        }
    };

    const handleDeliveryAddressMethodChange = (method) => {
        setDeliveryAddressMethod(method);
        clearDeliveryValidationErrors();

        setDistanceInfo(null);
        setDeliveryFee(Number(publicSettings.delivery?.baseFee) || 100);
        setDeliveryFeeBreakdown('');
        setLocationError('');

        if (method === DELIVERY_LOCATION_MODES.ADDRESS) {
            setCurrentLocation(null);
            setMapCenter(RESTAURANT_LOCATION);
            setGpsDetectedAddress('');

            if (selectedSavedAddress) {
                setFormData((prev) => ({
                    ...prev,
                    addressLine1: selectedSavedAddress.addressLine1,
                    addressLine2: selectedSavedAddress.addressLine2,
                    city: selectedSavedAddress.city,
                    postalCode: selectedSavedAddress.postalCode
                }));
                validateDeliveryAddressDistance(selectedSavedAddress);
            }
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

    const geocodeFromSearchText = async (searchText) => {
        if (!(window.google && window.google.maps && window.google.maps.Geocoder)) {
            throw new Error('Google Maps geocoder is not available');
        }

        const query = (searchText || '').trim();
        if (!query) {
            throw new Error('Please type a location to search');
        }

        const geocoder = new window.google.maps.Geocoder();
        const { results } = await new Promise((resolve, reject) => {
            geocoder.geocode(
                {
                    address: query,
                    componentRestrictions: { country: 'LK' }
                },
                (res, status) => {
                    if (status === 'OK' && Array.isArray(res) && res.length > 0) {
                        resolve({ results: res });
                        return;
                    }

                    reject(new Error(status || 'Geocoding failed'));
                }
            );
        });

        return results[0] || null;
    };

    const handlePlaceChanged = async () => {
        if (!searchAutocomplete && !mapSearchValue.trim()) {
            setLocationError('Type and search for a delivery area first.');
            return;
        }

        let place = searchAutocomplete?.getPlace?.();
        let lat = place?.geometry?.location?.lat?.();
        let lng = place?.geometry?.location?.lng?.();

        // Fallback: if Enter is pressed without selecting a suggestion,
        // geocode the typed text so users can still search by place name.
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            try {
                const geocodedPlace = await geocodeFromSearchText(mapSearchValue);
                if (geocodedPlace) {
                    place = geocodedPlace;
                    lat = geocodedPlace.geometry?.location?.lat?.();
                    lng = geocodedPlace.geometry?.location?.lng?.();
                }
            } catch (geocodeError) {
                console.error('Search geocoding error:', geocodeError);
            }
        }

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            setLocationError('No precise coordinates were found for this search. Try selecting a suggestion or check API key restrictions.');
            return;
        }

        const placeLabel = place?.formatted_address || place?.name || '';
        const detectedCity = extractCityFromPlace(place);
        const detectedStreet = placeLabel || place?.name || '';

        setMapSearchValue(placeLabel);
        setGpsDetectedAddress([detectedStreet, detectedCity].filter(Boolean).join(', '));
        setCurrentLocation({ lat, lng });
        setMapCenter({ lat, lng });
        setLocationError('');

        await validateCoordinatesForDelivery(lat, lng, 'Selected searched location');
    };

    const validateForm = () => {
        const newErrors = {};
        const normalizedEmail = formData.email.trim();
        const phoneDigits = formData.phone.replace(/\D/g, '');
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const minOrderAmount = Number(publicSettings.order?.minOrderAmount || 0);
        const maxOrderAmount = Number(publicSettings.order?.maxOrderAmount || 0);

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

        if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
            newErrors.email = 'Enter a valid email address';
        }

        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        else if (phoneDigits.length < 9 || phoneDigits.length > 15) newErrors.phone = 'Enter a valid phone number';

        if (formData.isPreorder) {
            if (!formData.scheduledDatetime) {
                newErrors.scheduledDatetime = 'Please choose a preorder time';
            } else {
                const scheduled = new Date(formData.scheduledDatetime);
                if (Number.isNaN(scheduled.getTime())) {
                    newErrors.scheduledDatetime = 'Invalid preorder time';
                } else if (scheduled.getTime() < Date.now() + 15 * 60 * 1000) {
                    newErrors.scheduledDatetime = 'Preorder time must be at least 15 minutes from now';
                }
            }
        }

        if (formData.orderType === 'DELIVERY') {
            if (savedAddresses.length === 0) {
                newErrors.savedAddressId = 'Add at least one saved address in your profile before placing a delivery order.';
            } else if (!selectedAddressId) {
                newErrors.savedAddressId = 'Please select one of your saved addresses.';
            }

            if (!deliveryAddressMethod) {
                newErrors.deliveryAddressMethod = 'Please choose one delivery address method';
            } else if (deliveryAddressMethod === DELIVERY_LOCATION_MODES.PIN) {
                if (!currentLocation) newErrors.location = 'Please pin your delivery location or use your current location';
            }
        }

        if (formData.paymentMethod === 'CARD' && !isStripeClientConfigured) {
            newErrors.paymentMethod = 'Card payments are temporarily unavailable. Please use cash on delivery.';
        }

        if (!availablePaymentOptions.some((opt) => opt.value === formData.paymentMethod)) {
            newErrors.paymentMethod = `${formData.paymentMethod} payments are currently disabled by system settings.`;
        }

        if (minOrderAmount > 0 && subtotal < minOrderAmount) {
            newErrors.cart = `Minimum order amount is LKR ${minOrderAmount.toFixed(2)}.`;
        }

        if (maxOrderAmount > 0 && subtotal > maxOrderAmount) {
            newErrors.cart = `Maximum order amount is LKR ${maxOrderAmount.toFixed(2)}.`;
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
            setIsSubmitting(true);
            setErrors(prev => {
                const next = { ...prev };
                delete next.submit;
                delete next.payment;
                return next;
            });

            if (formData.paymentMethod === 'CARD' && !isStripeClientConfigured) {
                throw new Error('Card payments are not configured for this environment');
            }

            if (!availablePaymentOptions.some((opt) => opt.value === formData.paymentMethod)) {
                throw new Error(`${formData.paymentMethod} payments are currently disabled by system settings`);
            }

            let addressId = null;

            if (formData.orderType === 'DELIVERY') {
                if (!selectedSavedAddress || !selectedSavedAddress.id) {
                    throw new Error('Please select one of your saved profile addresses for delivery.');
                }

                // Validate delivery distance before placing order
                let distanceValidation;

                if (deliveryAddressMethod === DELIVERY_LOCATION_MODES.PIN) {
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
                            addressLine1: selectedSavedAddress.addressLine1,
                            city: selectedSavedAddress.city,
                            postalCode: selectedSavedAddress.postalCode || null
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
                addressId = selectedSavedAddress.id;
            }

            const orderPayload = {
                orderType: formData.orderType,
                addressId,
                paymentMethod: formData.paymentMethod,
                contactPhone: formData.phone.trim(),
                isPreorder: Boolean(formData.isPreorder),
                scheduledDatetime: formData.isPreorder && formData.scheduledDatetime
                    ? new Date(formData.scheduledDatetime).toISOString()
                    : null,
                specialInstructions: formData.specialInstructions,
                items: cartItems.map((item) => ({
                    menuItemId: item.type === 'menu' ? item.menuItemId || item.id : null,
                    comboId: item.type === 'combo' ? item.comboId || item.id : null,
                    quantity: item.quantity,
                    notes: item.notes || null
                })),
                ...(formData.orderType === 'DELIVERY' && Number.isFinite(currentLocation?.lat) && Number.isFinite(currentLocation?.lng)
                    ? {
                        deliveryCoordinates: {
                            latitude: currentLocation.lat,
                            longitude: currentLocation.lng
                        }
                    }
                    : {})
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

                throw new Error('Failed to initialize online payment');
            }

            clearCart();
            navigate(`/order-confirmation/${orderId}`);
        } catch (error) {
            console.error('Checkout error:', error);
            const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to place order';
            const nextErrors = { submit: message };

            if (message.toLowerCase().includes('delivery address is outside')) {
                nextErrors.savedAddressId = message;
            }

            if (message.toLowerCase().includes('geocode')) {
                nextErrors.savedAddressId = 'We could not validate this address. Please update your saved profile address details.';
            }

            setErrors(nextErrors);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cart summary (business decision: show only delivery fee)
    const freeDeliveryThreshold = Number(publicSettings.delivery?.freeDeliveryThreshold || 0);
    const hasFreeDeliveryByOrderValue = freeDeliveryThreshold > 0
        && formData.orderType === 'DELIVERY'
        && cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) >= freeDeliveryThreshold;

    const cartSummary = {
        subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryFee: formData.orderType === 'DELIVERY' ? (hasFreeDeliveryByOrderValue ? 0 : deliveryFee) : 0,
    };
    cartSummary.total = cartSummary.subtotal + cartSummary.deliveryFee;
    const needsDeliveryLocation = formData.orderType === 'DELIVERY' && (
        !deliveryAddressMethod
        || (deliveryAddressMethod === DELIVERY_LOCATION_MODES.PIN && (!currentLocation || !distanceInfo?.isValid))
        || (deliveryAddressMethod === DELIVERY_LOCATION_MODES.ADDRESS && !distanceInfo?.isValid)
    );

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
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

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Schedule</h2>
                            <div className="mb-4 rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-800">
                                <p className="font-semibold">Preorder and Bulk Orders</p>
                                <p className="mt-1">
                                    Planning ahead or ordering in larger quantities? Use preorder scheduling and add your bulk details in Special Instructions.
                                </p>
                                <p className="mt-1">
                                    If current stock is not enough for immediate processing, you can still place it as a preorder request.
                                </p>
                            </div>
                            <label className="flex items-center gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    checked={formData.isPreorder}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        isPreorder: e.target.checked,
                                        scheduledDatetime: e.target.checked ? prev.scheduledDatetime : ''
                                    }))}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-gray-800">Place this as a preorder</span>
                            </label>

                            {formData.isPreorder && (
                                <Input
                                    label="Preorder Date & Time"
                                    name="scheduledDatetime"
                                    type="datetime-local"
                                    value={formData.scheduledDatetime}
                                    onChange={handleChange}
                                    error={errors.scheduledDatetime}
                                    min={new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16)}
                                    required
                                />
                            )}

                            {!formData.isPreorder && (
                                <p className="text-sm text-gray-500">Order will be processed immediately after placement.</p>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                The phone number here is used for this order only. Your verified profile phone stays separate for delivery safety.
                            </p>
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
                                        helperText="Optional"
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
                                <h2 className="text-xl font-semibold mb-2">Delivery Address</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    We use your location to confirm you are in our delivery area and calculate the final delivery fee.
                                </p>
                                
                                {/* Step 1: Select saved address */}
                                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                                    <p className="text-sm font-semibold text-gray-900 mb-3">Step 1: Select saved delivery address</p>
                                    {savedAddressOptions.length > 0 ? (
                                        <>
                                            <Select
                                                label="Saved Delivery Address"
                                                name="selectedAddressId"
                                                value={selectedAddressId}
                                                onChange={handleSavedAddressChange}
                                                options={savedAddressOptions}
                                                error={errors.savedAddressId}
                                                helperText="We use this saved address as your official delivery address for the order."
                                                required
                                            />

                                            {selectedSavedAddress && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700">
                                                    <p className="font-medium text-gray-900">Selected Address</p>
                                                    <p className="mt-1">{selectedSavedAddress.addressLine1}</p>
                                                    {selectedSavedAddress.addressLine2 && <p>{selectedSavedAddress.addressLine2}</p>}
                                                    <p>{[selectedSavedAddress.city, selectedSavedAddress.postalCode].filter(Boolean).join(', ')}</p>
                                                </div>
                                            )}

                                            <div className="mt-3 text-sm">
                                                <Link to="/profile" className="text-primary-700 hover:text-primary-900 underline">
                                                    Manage addresses in profile
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                            <p className="font-medium">No saved addresses found.</p>
                                            <p className="mt-1">Add at least one address in your profile before placing a delivery order.</p>
                                            <Link to="/profile" className="inline-block mt-2 text-red-800 underline hover:text-red-900">
                                                Go to Profile
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Choose validation method */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm font-semibold text-gray-900 mb-3">Step 2: Confirm delivery location</p>
                                    <p className="text-xs text-gray-600 mb-3">Pick one method to verify delivery distance and fee.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleDeliveryAddressMethodChange(DELIVERY_LOCATION_MODES.ADDRESS)}
                                            className={`text-left flex items-start space-x-3 p-3 bg-white rounded border-2 transition-colors ${deliveryAddressMethod === DELIVERY_LOCATION_MODES.ADDRESS
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Use selected address</p>
                                                <p className="text-xs text-gray-600 mt-1">Quick and simple validation from your saved address</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDeliveryAddressMethodChange(DELIVERY_LOCATION_MODES.PIN)}
                                            className={`text-left flex items-start space-x-3 p-3 bg-white rounded border-2 transition-colors ${deliveryAddressMethod === DELIVERY_LOCATION_MODES.PIN
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
                                                <p className="text-sm font-medium text-gray-900">Pin exact location (recommended)</p>
                                                <p className="text-xs text-gray-600 mt-1">Best accuracy for roads and delivery routing</p>
                                            </div>
                                        </button>
                                    </div>

                                    {errors.deliveryAddressMethod && (
                                        <p className="text-sm text-red-600 mt-3">{errors.deliveryAddressMethod}</p>
                                    )}
                                </div>

                                {deliveryAddressMethod === DELIVERY_LOCATION_MODES.PIN && (
                                    <>
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                            Your selected saved address is still used for the order record. Map pin is used only for accurate delivery distance validation.
                                        </div>

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
                                                                onKeyDown={handleMapSearchKeyDown}
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
                                                Map pinning is unavailable because the frontend Google Maps key is missing at build time (`VITE_GOOGLE_MAPS_API_KEY`). You can still use your current GPS location.
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
                                                    {gpsDetectedAddress && (
                                                        <p className="text-xs mt-1">Detected nearby area: {gpsDetectedAddress}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {deliveryAddressMethod === DELIVERY_LOCATION_MODES.ADDRESS && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                        Distance validation uses your selected saved address. Choose map pin mode if you want more precise road-based validation.
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
                                                                handleDeliveryAddressMethodChange(DELIVERY_LOCATION_MODES.PIN);
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
                                options={availablePaymentOptions}
                            />
                            {formData.paymentMethod === 'CARD' && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                    💳 Secure card payments powered by Stripe. Your card details are never stored on our servers.
                                </div>
                            )}
                            {formData.paymentMethod === 'ONLINE' && (
                                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700">
                                    🌐 You will be redirected to PayHere to complete payment securely.
                                </div>
                            )}
                            {errors.paymentMethod && (
                                <p className="mt-3 text-sm text-red-600">{errors.paymentMethod}</p>
                            )}
                        </div>

                        {/* Special Instructions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Special Instructions</h2>
                            <p className="text-sm text-gray-500 mb-3">
                                For bulk or special-event preorders, include preferred packaging, quantity notes, and timing details here.
                            </p>
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
                                        {hasFreeDeliveryByOrderValue && (
                                            <div className="text-xs text-green-600 mt-1">
                                                Free delivery applied (orders above LKR {freeDeliveryThreshold.toFixed(2)}).
                                            </div>
                                        )}
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
                            {errors.payment && (
                                <p className="text-sm text-red-600 mb-3">{errors.payment}</p>
                            )}
                            {errors.cart && (
                                <p className="text-sm text-red-600 mb-3">{errors.cart}</p>
                            )}
                            {needsDeliveryLocation && !errors.submit && !errors.cart && (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                                    Choose and validate your delivery location to place a delivery order.
                                </p>
                            )}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full mb-3"
                                disabled={cartItems.length === 0 || isSubmitting || needsDeliveryLocation}
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
                billingDetails={{
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim()
                }}
                onSuccess={async (paymentIntent) => {
                    const completedOrderId = currentOrderId;
                    let paymentSyncWarning = false;

                    try {
                        if (completedOrderId && paymentIntent?.id) {
                            await confirmCardPayment(completedOrderId, paymentIntent.id);
                        }
                    } catch (syncError) {
                        console.error('Card payment confirmation sync failed:', syncError);
                        paymentSyncWarning = true;
                    }

                    setShowStripeModal(false);
                    setCurrentOrderId(null);
                    setPaymentClientSecret(null);
                    clearCart();
                    if (completedOrderId) {
                        navigate(`/order-confirmation/${completedOrderId}`, {
                            state: paymentSyncWarning
                                ? {
                                    paymentSyncWarning: true,
                                    paymentIntentId: paymentIntent?.id || null
                                }
                                : null
                        });
                    }
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
                        submit: '',
                        payment: error || 'Payment failed. Please try again.'
                    }));
                }}
            />
        </div>
    );
};

export default Checkout;
