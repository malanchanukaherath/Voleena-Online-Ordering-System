const { Payment } = require('../models');
const notificationService = require('./notificationService');
const crypto = require('crypto');

const SUPPORTED_PAYMENT_METHODS = new Set(['CASH', 'CARD', 'ONLINE']);

// Simple: This checks whether configured stripe value is available.
function hasConfiguredStripeValue(value, prefix) {
    return typeof value === 'string' && value.trim().startsWith(prefix) && !value.includes('your_');
}

// Simple: This checks whether configured pay here value is available.
function hasConfiguredPayHereValue(value) {
    return typeof value === 'string' && value.trim().length > 0 && !value.includes('your_');
}

// Simple: This checks whether valid http url is true.
function isValidHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return false;
    }

    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

// Simple: This handles to minor units logic.
function toMinorUnits(amount) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Order total is invalid for payment processing');
    }

    return Math.round(numericAmount * 100);
}

// Simple: This creates the gateway status.
function buildGatewayStatus(status, detail) {
    return [status, detail]
        .filter(Boolean)
        .join('_')
        .toUpperCase()
        .replace(/[^A-Z0-9_]+/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 50);
}

/**
 * Payment Service
 * Handles payment processing with third-party gateways (FR30, FR31)
 * Supports: PayHere, Stripe, Cash on Delivery
 */
class PaymentService {
    // This sets up this service before it is used.
    constructor() {
        this.payHereConfig = {
            merchantId: process.env.PAYHERE_MERCHANT_ID,
            merchantSecret: process.env.PAYHERE_MERCHANT_SECRET,
            mode: process.env.PAYHERE_MODE || 'sandbox' // 'sandbox' or 'live'
        };

        this.stripeConfig = {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        };
    }

    /**
     * Initialize payment
     * @param {Object} order - Order object
     * @param {Object} customer - Customer object
     * @param {string} paymentMethod - 'CASH', 'CARD', 'ONLINE', 'WALLET'
     * @returns {Promise<Object>} Payment details
     */
    //add to cart
    async initializePayment(order, customer, paymentMethod = 'CASH', existingPayment = null) {
        let payment = existingPayment;

        try {
            if (!SUPPORTED_PAYMENT_METHODS.has(paymentMethod)) {
                throw new Error('Unsupported payment method');
            }

            if (!payment) {
                payment = await Payment.create({
                    OrderID: order.OrderID,
                    Amount: order.FinalAmount,
                    Method: paymentMethod,
                    Status: 'PENDING',
                    GatewayStatus: paymentMethod === 'CASH' ? 'PAY_ON_DELIVERY' : 'PENDING'
                });
            } else {
                if (payment.Method !== paymentMethod) {
                    throw new Error(`Existing payment method is ${payment.Method}. Requested ${paymentMethod}.`);
                }

                const updates = {
                    Amount: order.FinalAmount
                };

                if (paymentMethod === 'CASH') {
                    updates.Status = payment.Status === 'PAID' ? 'PAID' : 'PENDING';
                    updates.GatewayStatus = payment.Status === 'PAID' ? payment.GatewayStatus || 'PAID' : 'PAY_ON_DELIVERY';
                    updates.TransactionID = null;
                } else if (payment.Status === 'FAILED') {
                    updates.Status = 'PENDING';
                    updates.GatewayStatus = buildGatewayStatus('RETRY_PENDING', paymentMethod);
                }

                await payment.update(updates);
            }

            // Handle different payment methods
            if (paymentMethod === 'CASH') {
                return {
                    success: true,
                    paymentId: payment.PaymentID,
                    method: 'CASH',
                    message: 'Cash on delivery order created'
                };
            }

            if (paymentMethod === 'ONLINE') {
                // Initialize online payment gateway
                const paymentData = await this.initializeOnlinePayment(order, customer, payment);
                return paymentData;
            }

            if (paymentMethod === 'CARD') {
                // Initialize card payment (Stripe)
                const paymentData = await this.initializeCardPayment(order, customer, payment);
                return paymentData;
            }
        } catch (error) {
            if (payment && paymentMethod !== 'CASH') {
                try {
                    await payment.update({
                        Status: 'FAILED',
                        GatewayStatus: buildGatewayStatus('INIT_FAILED', paymentMethod)
                    });
                } catch (updateError) {
                    console.error('Ã¢ÂÅ’ Failed to persist payment initialization failure:', updateError.message);
                }
            }

            console.error('Ã¢ÂÅ’ Payment initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Initialize PayHere payment
     */
    async initializeOnlinePayment(order, customer, payment) {
        const frontendBase = String(process.env.FRONTEND_URL || '').replace(/\/+$/, '');
        const backendBase = String(process.env.BACKEND_URL || '').replace(/\/+$/, '');
        const configuredReturnUrl = String(process.env.PAYHERE_RETURN_URL || '').trim();
        const configuredCancelUrl = String(process.env.PAYHERE_CANCEL_URL || '').trim();
        const configuredNotifyUrl = String(process.env.PAYHERE_NOTIFY_URL || '').trim();

        const merchantId = String(this.payHereConfig.merchantId || '').trim();
        const merchantSecret = String(this.payHereConfig.merchantSecret || '').trim();

        const returnUrl = configuredReturnUrl || `${frontendBase}/order-confirmation/${order.OrderID}`;
        const cancelUrl = configuredCancelUrl || `${frontendBase}/checkout`;
        const notifyUrl = configuredNotifyUrl || `${backendBase}/api/v1/payments/webhook/payhere`;

        const missingOrInvalid = [];

        if (!hasConfiguredPayHereValue(merchantId)) {
            missingOrInvalid.push('PAYHERE_MERCHANT_ID');
        }

        if (!hasConfiguredPayHereValue(merchantSecret)) {
            missingOrInvalid.push('PAYHERE_MERCHANT_SECRET');
        }

        if (!isValidHttpUrl(returnUrl)) {
            missingOrInvalid.push('PAYHERE_RETURN_URL or FRONTEND_URL');
        }

        if (!isValidHttpUrl(cancelUrl)) {
            missingOrInvalid.push('PAYHERE_CANCEL_URL or FRONTEND_URL');
        }

        if (!isValidHttpUrl(notifyUrl)) {
            missingOrInvalid.push('PAYHERE_NOTIFY_URL or BACKEND_URL');
        }

        if (missingOrInvalid.length > 0) {
            throw new Error(`Online payments are not configured: missing or invalid ${missingOrInvalid.join(', ')}`);
        }

        const hash = this.generatePayHereHash(
            merchantId,
            order.OrderNumber,
            order.FinalAmount,
            'LKR'
        );

        const mode = String(this.payHereConfig.mode || 'sandbox').toLowerCase();
        const payHereHost = mode === 'live' ? 'www' : 'sandbox';

        return {
            success: true,
            paymentId: payment.PaymentID,
            method: 'ONLINE',
            gateway: 'PayHere',
            paymentUrl: `https://${payHereHost}.payhere.lk/pay/checkout`,
            paymentData: {
                merchant_id: merchantId,
                return_url: returnUrl,
                cancel_url: cancelUrl,
                notify_url: notifyUrl,
                order_id: order.OrderNumber,
                items: `Order #${order.OrderNumber}`,
                currency: 'LKR',
                amount: order.FinalAmount.toFixed(2),
                first_name: customer.Name.split(' ')[0],
                last_name: customer.Name.split(' ').slice(1).join(' ') || '',
                email: customer.Email,
                phone: customer.Phone,
                address: '',
                city: '',
                country: 'Sri Lanka',
                hash: hash
            }
        };
    }

    /**
     * Initialize Stripe card payment
     */
    async initializeCardPayment(order, customer, payment) {
        if (!hasConfiguredStripeValue(this.stripeConfig.secretKey, 'sk_') || !hasConfiguredStripeValue(this.stripeConfig.publishableKey, 'pk_')) {
            throw new Error('Card payments are not configured');
        }

        const stripe = require('stripe')(this.stripeConfig.secretKey);
        const amount = toMinorUnits(order.FinalAmount);

        if (payment.TransactionID) {
            try {
                const existingIntent = await stripe.paymentIntents.retrieve(payment.TransactionID);

                if (existingIntent?.status === 'succeeded') {
                    await payment.update({
                        Status: 'PAID',
                        PaidAt: payment.PaidAt || new Date(),
                        GatewayStatus: 'SUCCESS'
                    });

                    return {
                        success: true,
                        paymentId: payment.PaymentID,
                        method: 'CARD',
                        gateway: 'Stripe',
                        status: 'PAID'
                    };
                }

                if (existingIntent?.client_secret && ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'].includes(existingIntent.status)) {
                    return {
                        success: true,
                        paymentId: payment.PaymentID,
                        method: 'CARD',
                        gateway: 'Stripe',
                        clientSecret: existingIntent.client_secret,
                        publishableKey: this.stripeConfig.publishableKey
                    };
                }
            } catch (retrieveError) {
                console.warn(`Failed to reuse Stripe payment intent ${payment.TransactionID}:`, retrieveError.message);
            }
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'lkr',
            payment_method_types: ['card'],
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic'
                }
            },
            description: `Order #${order.OrderNumber}`,
            receipt_email: customer.Email,
            metadata: {
                orderId: order.OrderID,
                orderNumber: order.OrderNumber,
                paymentId: payment.PaymentID,
                customerId: customer.CustomerID || customer.id || ''
            }
        }, {
            idempotencyKey: `order-${order.OrderID}-payment-${payment.PaymentID}`
        });

        await payment.update({
            TransactionID: paymentIntent.id
        });

        return {
            success: true,
            paymentId: payment.PaymentID,
            method: 'CARD',
            gateway: 'Stripe',
            clientSecret: paymentIntent.client_secret,
            publishableKey: this.stripeConfig.publishableKey
        };
    }

    /**
     * Process payment callback/webhook
     */
    async processPaymentCallback(paymentId, status, gatewayResponse = {}) {
        try {
            const payment = await Payment.findByPk(paymentId);
            
            if (!payment) {
                throw new Error('Payment not found');
            }

            const isSuccess = status === 'SUCCESS' || status === 'PAID';

            await payment.update({
                Status: isSuccess ? 'PAID' : 'FAILED',
                PaidAt: isSuccess ? new Date() : null,
                GatewayStatus: isSuccess ? 'SUCCESS' : 'FAILED'
            });

            // Send notification to customer (FR31)
            const { Order, Customer } = require('../models');
            const order = await Order.findByPk(payment.OrderID);
            const customer = await Customer.findByPk(order.CustomerID);

            if (isSuccess) {
                await notificationService.sendPaymentNotification(order, customer, payment);
                console.log(`Ã¢Å“â€¦ Payment successful for Order #${order.OrderNumber}`);
            } else {
                await notificationService.sendPaymentNotification(order, customer, payment);
                if (order && !['CANCELLED', 'DELIVERED'].includes(order.Status)) {
                    const orderService = require('../services/orderService');
                    await orderService.cancelOrder(
                        order.OrderID,
                        `Payment callback failed: ${gatewayResponse?.status || status || 'FAILED'}`,
                        null,
                        'SYSTEM'
                    );
                }
                console.log(`Ã¢ÂÅ’ Payment failed for Order #${order.OrderNumber}`);
            }

            return {
                success: isSuccess,
                payment: payment
            };

        } catch (error) {
            console.error('Ã¢ÂÅ’ Payment callback processing failed:', error.message);
            throw error;
        }
    }

    /**
     * Process refund (FR21)
     */
    async processRefund(orderId, reason = 'Order cancelled') {
        try {
            const payment = await Payment.findOne({
                where: {
                    OrderID: orderId,
                    Status: 'PAID'
                }
            });

            if (!payment) {
                console.log('No payment found to refund');
                return { success: true, message: 'No refund needed' };
            }

            // Only refund online payments
            if (payment.Method === 'CASH') {
                console.log('Cash payment - no refund processing needed');
                return { success: true, message: 'Cash order - no refund' };
            }

            // Process refund based on payment method
            let refundResult = null;

            if (payment.Method === 'CARD') {
                refundResult = await this.processStripeRefund(payment);
            } else if (payment.Method === 'ONLINE') {
                refundResult = await this.processPayHereRefund(payment);
            }

            // Update payment record
            await payment.update({
                Status: 'REFUNDED',
                RefundedAt: new Date(),
                RefundReason: reason,
                GatewayStatus: 'REFUNDED'
            });

            // Send refund notification
            const { Order, Customer } = require('../models');
            const order = await Order.findByPk(orderId);
            const customer = await Customer.findByPk(order.CustomerID);

            await notificationService.sendRefundNotification(order, customer, payment.Amount);

            console.log(`Ã¢Å“â€¦ Refund processed for Order #${order.OrderNumber}: LKR ${payment.Amount}`);

            return {
                success: true,
                refundAmount: payment.Amount,
                message: 'Refund initiated successfully'
            };

        } catch (error) {
            console.error('Ã¢ÂÅ’ Refund processing failed:', error.message);
            throw error;
        }
    }

    /**
     * Process Stripe refund
     */
    async processStripeRefund(payment) {
        if (!this.stripeConfig.secretKey) {
            console.log('Stripe not configured - mock refund');
            return { success: true, method: 'mock' };
        }

        const stripe = require('stripe')(this.stripeConfig.secretKey);
        
        const refund = await stripe.refunds.create({
            payment_intent: payment.TransactionID,
            amount: Math.round(payment.Amount * 100)
        });

        return { success: true, refundId: refund.id };
    }

    /**
     * Process PayHere refund
     */
    async processPayHereRefund(payment) {
        // PayHere refund process (manual for now)
        console.log(`PayHere refund initiated for transaction: ${payment.TransactionID}`);
        return { success: true, method: 'manual' };
    }

    /**
     * Generate PayHere hash for security
     */
    generatePayHereHash(merchantId, orderId, amount, currency) {
        const merchantSecret = this.payHereConfig.merchantSecret;
        const hashedSecret = crypto
            .createHash('md5')
            .update(merchantSecret)
            .digest('hex')
            .toUpperCase();

        const amountFormatted = parseFloat(amount).toFixed(2);
        const hash = crypto
            .createHash('md5')
            .update(`${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`)
            .digest('hex')
            .toUpperCase();

        return hash;
    }

    /**
     * Generate unique transaction ID
     */
    generateTransactionID() {
        return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    /**
     * Mock payment flow for development
     */
    async mockPaymentFlow(payment, method) {
        console.log(`Ã°Å¸â€™Â³ Mock ${method} payment initialized`);
        
        return {
            success: true,
            paymentId: payment.PaymentID,
            method: method,
            gateway: 'MOCK',
            message: 'Mock payment - auto-confirm in 3 seconds',
            mockAutoConfirm: true
        };
    }
}

module.exports = new PaymentService();
