import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
const isStripeConfigured = Boolean(
    stripePublishableKey && stripePublishableKey.startsWith('pk_') && !stripePublishableKey.includes('your_')
);
let stripePromise = null;

const getStripePromise = () => {
    if (!isStripeConfigured) {
        return null;
    }

    if (!stripePromise) {
        stripePromise = loadStripe(stripePublishableKey);
    }

    return stripePromise;
};

/**
 * Payment form component that handles Stripe card payment
 */
const StripePaymentForm = ({ clientSecret, total, billingDetails, onSuccess, onCancel, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardError, setCardError] = useState(null);

    const handleCardChange = (event) => {
        if (event.error) {
            setCardError(event.error.message);
        } else {
            setCardError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setCardError('Stripe is not loaded. Please refresh and try again.');
            return;
        }

        if (!clientSecret) {
            setCardError('Payment session is missing. Please try checkout again.');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setCardError('Card form is not ready yet. Please wait a moment and try again.');
            return;
        }

        setIsProcessing(true);
        setCardError(null);

        try {
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: billingDetails?.name || undefined,
                        email: billingDetails?.email || undefined,
                        phone: billingDetails?.phone || undefined
                    }
                }
            });

            if (result.error) {
                setCardError(result.error.message);
                onError?.(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                onSuccess?.(result.paymentIntent);
            } else {
                setCardError(`Payment failed with status: ${result.paymentIntent.status}`);
                onError?.(`Payment status: ${result.paymentIntent.status}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setCardError(error.message || 'Payment processing failed');
            onError?.(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Element */}
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
                <CardElement
                    onChange={handleCardChange}
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4'
                                }
                            },
                            invalid: {
                                color: '#fa755a',
                                iconColor: '#fa755a'
                            }
                        }
                    }}
                />
            </div>

            {/* Error Message */}
            {cardError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {cardError}
                </div>
            )}

            {/* Test Card Info */}
            {import.meta.env.DEV && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <p className="font-semibold mb-1">Test Card (Sandbox):</p>
                    <p className="font-mono text-xs mb-1">Card: 4242 4242 4242 4242</p>
                    <p className="font-mono text-xs mb-1">Expiry: 12/25 (any future date)</p>
                    <p className="font-mono text-xs">CVC: 123 (any 3 digits)</p>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isProcessing || !stripe || !elements || !clientSecret || cardError !== null}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        `Pay LKR ${total.toFixed(2)}`
                    )}
                </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
                🔒 Secured by Stripe. Your card details are encrypted.
            </p>
        </form>
    );
};

/**
 * Stripe Payment Modal
 * Wraps the payment form with Stripe Elements provider
 */
export const StripePaymentModal = ({
    isOpen,
    clientSecret,
    orderId,
    total,
    billingDetails,
    onSuccess,
    onCancel,
    onError
}) => {
    if (!isOpen) return null;

    const stripeElementsPromise = clientSecret ? getStripePromise() : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
                <p className="text-gray-600 text-sm mb-6">
                    Order #{orderId} • <span className="font-semibold">LKR {total.toFixed(2)}</span>
                </p>

                {clientSecret && stripeElementsPromise ? (
                    <Elements stripe={stripeElementsPromise} options={{ clientSecret }}>
                        <StripePaymentForm
                            clientSecret={clientSecret}
                            total={total}
                            billingDetails={billingDetails}
                            onSuccess={onSuccess}
                            onCancel={onCancel}
                            onError={onError}
                        />
                    </Elements>
                ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                        {isStripeConfigured
                            ? 'Payment session is unavailable. Please try checkout again.'
                            : 'Card payments are not configured for this environment. Please use another payment method.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StripePaymentModal;
