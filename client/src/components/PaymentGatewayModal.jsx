// CODEMAP: FRONTEND_COMPONENTS_PAYMENTGATEWAYMODAL_JSX
// WHAT_THIS_IS: This file supports frontend behavior for PaymentGatewayModal.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/PaymentGatewayModal.jsx
// - Search text: PaymentGatewayModal.jsx
import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { FaCreditCard, FaLock, FaSpinner } from 'react-icons/fa';

// Simple: This shows the payment gateway modal section.
const PaymentGatewayModal = ({ isOpen, onClose, gateway, amount, onSuccess, onFailure }) => {
    const [processing, setProcessing] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: ''
    });
    const [errors, setErrors] = useState({});

    // Simple: This handles what happens when change is triggered.
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCardDetails(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Simple: This checks if the card is correct.
    const validateCard = () => {
        const newErrors = {};
        if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 16) {
            newErrors.cardNumber = 'Invalid card number';
        }
        if (!cardDetails.cardName) {
            newErrors.cardName = 'Cardholder name required';
        }
        if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
            newErrors.expiryDate = 'Invalid expiry (MM/YY)';
        }
        if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
            newErrors.cvv = 'Invalid CVV';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Simple: This handles what happens when payment is triggered.
    const handlePayment = () => {
        if (!validateCard()) return;

        setProcessing(true);

        // Simulate payment processing (70% success rate)
        setTimeout(() => {
            const success = Math.random() > 0.3;

            if (success) {
                onSuccess({
                    transactionId: 'TXN' + Date.now(),
                    gateway: gateway,
                    amount: amount,
                    cardLast4: cardDetails.cardNumber.slice(-4)
                });
            } else {
                onFailure({
                    error: 'Payment declined by bank',
                    errorCode: 'CARD_DECLINED',
                    gateway: gateway
                });
            }

            setProcessing(false);
            onClose();
        }, 2500);
    };

    // Simple: This cleans or formats the card number.
    const formatCardNumber = (value) => {
        return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${gateway} Payment`}>
            <div className="space-y-6">
                {/* Gateway Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaCreditCard className="text-3xl text-primary-600" />
                        <div>
                            <p className="font-semibold">{gateway}</p>
                            <p className="text-sm text-gray-600">Secure Payment</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="text-xl font-bold text-primary-600">LKR {amount.toFixed(2)}</p>
                    </div>
                </div>

                {/* Card Details Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Number
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="cardNumber"
                                value={formatCardNumber(cardDetails.cardNumber)}
                                onChange={(e) => handleChange({ target: { name: 'cardNumber', value: e.target.value.replace(/\s/g, '') } })}
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                className={`w-full pl-10 pr-4 py-2 border rounded-md ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            <FaCreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cardholder Name
                        </label>
                        <input
                            type="text"
                            name="cardName"
                            value={cardDetails.cardName}
                            onChange={handleChange}
                            placeholder="JOHN DOE"
                            className={`w-full px-4 py-2 border rounded-md ${errors.cardName ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.cardName && <p className="text-red-600 text-sm mt-1">{errors.cardName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                            </label>
                            <input
                                type="text"
                                name="expiryDate"
                                value={cardDetails.expiryDate}
                                onChange={handleChange}
                                placeholder="MM/YY"
                                maxLength={5}
                                className={`w-full px-4 py-2 border rounded-md ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.expiryDate && <p className="text-red-600 text-sm mt-1">{errors.expiryDate}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CVV
                            </label>
                            <input
                                type="password"
                                name="cvv"
                                value={cardDetails.cvv}
                                onChange={handleChange}
                                placeholder="123"
                                maxLength={4}
                                className={`w-full px-4 py-2 border rounded-md ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.cvv && <p className="text-red-600 text-sm mt-1">{errors.cvv}</p>}
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded">
                    <FaLock className="text-green-600" />
                    <p>Your payment information is encrypted and secure</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={handlePayment}
                        disabled={processing}
                        className="flex-1"
                    >
                        {processing ? (
                            <>
                                <FaSpinner className="inline animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            `Pay LKR ${amount.toFixed(2)}`
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentGatewayModal;

