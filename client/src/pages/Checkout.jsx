import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { FaCheckCircle } from 'react-icons/fa';

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
    const [locationVerified, setLocationVerified] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const verifyDeliveryLocation = () => {
        // Mock verification - in production, use Google Maps API
        const mockDistance = Math.random() * 20; // Random distance 0-20km
        if (mockDistance <= 15) {
            setLocationVerified(true);
            alert(`✅ Delivery location verified! Distance: ${mockDistance.toFixed(2)}km`);
        } else {
            setLocationVerified(false);
            alert(`❌ Sorry, delivery location is ${mockDistance.toFixed(2)}km away. We only deliver within 15km radius.`);
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
            if (!locationVerified) newErrors.location = 'Please verify delivery location';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Mock order creation - in production, call API
        const orderId = 'ORD' + Date.now();
        console.log('Creating order:', formData);

        // Redirect to confirmation page
        navigate(`/order-confirmation/${orderId}`);
    };

    // Mock cart summary
    const cartSummary = {
        subtotal: 1250.00,
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

                        {/* Delivery Address */}
                        {formData.orderType === 'DELIVERY' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                                <div className="space-y-4">
                                    <Input
                                        label="Address Line 1"
                                        name="addressLine1"
                                        value={formData.addressLine1}
                                        onChange={handleChange}
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

                                    <div>
                                        <Button
                                            type="button"
                                            onClick={verifyDeliveryLocation}
                                            variant="outline"
                                            className="w-full md:w-auto"
                                        >
                                            Verify Delivery Location (15km limit)
                                        </Button>
                                        {locationVerified && (
                                            <div className="mt-2 flex items-center text-green-600">
                                                <FaCheckCircle className="mr-2" />
                                                <span className="text-sm">Location verified ✓</span>
                                            </div>
                                        )}
                                        {errors.location && (
                                            <p className="mt-2 text-sm text-red-600">{errors.location}</p>
                                        )}
                                    </div>
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
                                    { value: 'CARD', label: 'Card Payment (Coming Soon)', disabled: true },
                                    { value: 'ONLINE', label: 'Online Payment (Coming Soon)', disabled: true },
                                ]}
                            />
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

                            <Button type="submit" size="lg" className="w-full mb-3">
                                Place Order
                            </Button>

                            <Link to="/cart" className="block text-center text-sm text-gray-600 hover:text-gray-900">
                                ← Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Checkout;
