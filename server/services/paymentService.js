// CODEMAP: BACKEND_SERVICE_PAYMENTSERVICE
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
const axios = require('axios');
const crypto = require('crypto');
const { Payment, Order } = require('../models');

/**
 * PayHere Payment Gateway Integration (FR30, FR31)
 */
class PayHereService {
    constructor() {
        this.merchantId = process.env.PAYHERE_MERCHANT_ID;
        this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
        this.mode = process.env.PAYHERE_MODE || 'sandbox';
        this.baseUrl = this.mode === 'live'
            ? 'https://www.payhere.lk'
            : 'https://sandbox.payhere.lk';
    }

    /**
     * Generate payment hash for PayHere
     */
    generateHash(orderId, amount, currency = 'LKR') {
        const merchantSecret = this.merchantSecret;
        const hashedSecret = crypto
            .createHash('md5')
            .update(merchantSecret)
            .digest('hex')
            .toUpperCase();

        const amountFormatted = parseFloat(amount).toFixed(2);
        const hashString = `${this.merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`;

        return crypto
            .createHash('md5')
            .update(hashString)
            .digest('hex')
            .toUpperCase();
    }

    /**
     * Create payment request
     */
    async createPayment(order, customer) {
        const payment = await Payment.create({
            OrderID: order.OrderID,
            Amount: order.FinalAmount,
            Method: 'ONLINE',
            Status: 'PENDING'
        });

        const hash = this.generateHash(
            order.OrderNumber,
            order.FinalAmount
        );

        return {
            merchant_id: this.merchantId,
            return_url: process.env.PAYHERE_RETURN_URL,
            cancel_url: process.env.PAYHERE_CANCEL_URL,
            notify_url: process.env.PAYHERE_NOTIFY_URL,
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
        };
    }

    /**
     * Verify PayHere notification
     */
    verifyNotification(data) {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig
        } = data;

        const merchantSecret = this.merchantSecret;
        const hashedSecret = crypto
            .createHash('md5')
            .update(merchantSecret)
            .digest('hex')
            .toUpperCase();

        const localHash = crypto
            .createHash('md5')
            .update(
                `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`
            )
            .digest('hex')
            .toUpperCase();

        return localHash === md5sig;
    }

    /**
     * Handle payment notification (webhook)
     */
    async handleNotification(data) {
        if (!this.verifyNotification(data)) {
            throw new Error('Invalid payment notification signature');
        }

        const { order_id, payment_id, status_code } = data;

        // Find order by order number
        const order = await Order.findOne({
            where: { OrderNumber: order_id }
        });

        if (!order) {
            throw new Error('Order not found');
        }

        // Find payment record
        const payment = await Payment.findOne({
            where: { OrderID: order.OrderID }
        });

        if (!payment) {
            throw new Error('Payment record not found');
        }

        // Update payment status
        if (status_code === '2') {
            // Payment successful
            payment.Status = 'PAID';
            payment.TransactionID = payment_id;
            payment.PaidAt = new Date();
            payment.GatewayStatus = 'SUCCESS';
        } else if (status_code === '0') {
            // Payment pending
            payment.Status = 'PENDING';
            payment.GatewayStatus = 'PENDING';
        } else {
            // Payment failed
            payment.Status = 'FAILED';
            payment.GatewayStatus = `FAILED_${status_code}`;
        }

        await payment.save();

        return payment;
    }

    /**
     * Process refund (FR21)
     */
    async processRefund(payment, reason) {
        // PayHere doesn't have automated refund API
        // Keep the payment paid until the manual refund is completed outside the app.
        payment.GatewayStatus = 'MANUAL_REFUND_REQUIRED';
        payment.RefundedAt = null;
        payment.RefundReason = reason;
        await payment.save();

        // Log for manual processing
        console.log(`REFUND REQUIRED: Payment ${payment.PaymentID}, Amount: ${payment.Amount}, Reason: ${reason}`);

        return payment;
    }
}

/**
 * Stripe Payment Gateway Integration (FR30, FR31)
 */
class StripeService {
    constructor() {
        this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    }

    /**
     * Create payment intent
     */
    async createPaymentIntent(order, customer) {
        const payment = await Payment.create({
            OrderID: order.OrderID,
            Amount: order.FinalAmount,
            Method: 'ONLINE',
            Status: 'PENDING'
        });

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(order.FinalAmount * 100), // Convert to cents
            currency: 'lkr',
            metadata: {
                order_id: order.OrderID,
                order_number: order.OrderNumber,
                customer_id: customer.CustomerID
            },
            receipt_email: customer.Email
        });

        payment.TransactionID = paymentIntent.id;
        await payment.save();

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    }

    /**
     * Handle webhook event
     */
    async handleWebhook(event) {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await this.handlePaymentFailure(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }

    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(paymentIntent) {
        const payment = await Payment.findOne({
            where: { TransactionID: paymentIntent.id }
        });

        if (payment) {
            payment.Status = 'PAID';
            payment.PaidAt = new Date();
            payment.GatewayStatus = 'SUCCESS';
            await payment.save();
        }
    }

    /**
     * Handle failed payment
     */
    async handlePaymentFailure(paymentIntent) {
        const payment = await Payment.findOne({
            where: { TransactionID: paymentIntent.id }
        });

        if (payment) {
            payment.Status = 'FAILED';
            payment.GatewayStatus = paymentIntent.last_payment_error?.message || 'FAILED';
            await payment.save();
        }
    }

    /**
     * Process refund (FR21)
     */
    async processRefund(payment, reason) {
        const refund = await this.stripe.refunds.create({
            payment_intent: payment.TransactionID,
            reason: 'requested_by_customer',
            metadata: {
                refund_reason: reason
            }
        });

        payment.Status = 'REFUNDED';
        payment.RefundedAt = new Date();
        payment.RefundReason = reason;
        await payment.save();

        return refund;
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        try {
            return this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            throw new Error('Invalid webhook signature');
        }
    }
}

// Export singleton instances
const payHereService = new PayHereService();
const stripeService = new StripeService();

module.exports = {
    payHereService,
    stripeService,
    PayHereService,
    StripeService
};
