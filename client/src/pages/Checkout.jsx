import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { StripePaymentModal } from '../components/payment/StripePaymentModal';
import { getCart, clearCart } from '../utils/cartStorage';
import { createAddress, createOrder, initiatePayment, validateDeliveryDistance } from '../services/orderApi';

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
    const [validatingDistance, setValidatingDistance] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [paymentClientSecret, setPaymentClientSecret] = useState(null);
    const cartItems = useMemo(() => getCart(), []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    /**
     * Validate delivery distance when address changes or on blur
     */
    const validateDeliveryAddressDistance = async () => {
        if (formData.orderType !== 'DELIVERY' || !formData.addressLine1 || !formData.city) {
            return;
        }

        setValidatingDistance(true);
        try {
            const response = await validateDeliveryDistance({
                address: {
                    addressLine1: formData.addressLine1,
                    city: formData.city,
                    district: formData.postalCode
                }
            });

            if (response.data?.success) {
                const data = response.data.data;
                setDistanceInfo({
                    isValid: data.isValid,
                    distance: data.distance,
                    maxDistance: data.maxDistance,
                    method: data.method
                });

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
            setDistanceInfo(null);
            setErrors(prev => ({
                ...prev,
                distance: 'Unable to validate delivery distance'
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
            if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
            if (!formData.city.trim()) newErrors.city = 'City is required';
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

        try {
            let addressId = null;

            if (formData.orderType === 'DELIVERY') {
                const addressResponse = await createAddress({
                    addressLine1: formData.addressLine1,
                    addressLine2: formData.addressLine2 || null,
                    city: formData.city,
                    postalCode: formData.postalCode || null,
                    district: null,
                    latitude: null,
                    longitude: null
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

        // Cart summary
        const cartSummary = {
            subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryFee: formData.orderType === 'DELIVERY' ? 100.00 : 0,
            tax: 100.00,
        };
        cartSummary.total = cartSummary.subtotal + cartSummary.deliveryFee + cartSummary.tax;

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
                                        <div className="text-sm text-gray-600">LKR 100.00</div>
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

                                        {/* Distance Validation Status */}
                                        {validatingDistance && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                                                Validating delivery distance...
                                            </div>
                                        )}

                                        {distanceInfo && (
                                            <div className={`p-3 rounded border-2 ${distanceInfo.isValid
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

                                        {errors.distance && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                {errors.distance}
                                            </div>
                                        )}
                                    </div>
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
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Delivery Fee</span>
                                            <span>LKR {cartSummary.deliveryFee.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (8%)</span>
                                        <span>LKR {cartSummary.tax.toFixed(2)}</span>
                                    </div>
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
