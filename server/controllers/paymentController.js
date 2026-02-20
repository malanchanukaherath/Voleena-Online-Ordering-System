const crypto = require('crypto');
const paymentService = require('../utils/paymentService');
const { Order, Customer, Payment } = require('../models');

const PAYHERE_SUCCESS = '2';
const PAYHERE_PENDING = '0';

function verifyPayHereSignature(payload) {
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantSecret) {
    throw new Error('PAYHERE_MERCHANT_SECRET not configured');
  }

  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const localSig = crypto
    .createHash('md5')
    .update(
      `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`
    )
    .digest('hex')
    .toUpperCase();

  return localSig === payload.md5sig;
}

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'orderId and paymentMethod are required' });
    }

    if (req.user.type !== 'Customer') {
      return res.status(403).json({ error: 'Only customers can initiate payments' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.CustomerID !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (['CANCELLED', 'DELIVERED'].includes(order.Status)) {
      return res.status(400).json({ error: 'Order is not eligible for payment' });
    }

    const existingPayment = await Payment.findOne({ where: { OrderID: orderId } });
    if (existingPayment && ['PAID', 'PENDING'].includes(existingPayment.Status)) {
      return res.status(409).json({ error: 'Payment already exists for this order' });
    }

    const customer = await Customer.findByPk(order.CustomerID);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const paymentData = await paymentService.initializePayment(order, customer, paymentMethod);

    return res.json({ success: true, data: paymentData });
  } catch (error) {
    console.error('Initiate payment error:', error);
    return res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

exports.payHereWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    const requiredFields = ['merchant_id', 'order_id', 'payment_id', 'status_code', 'payhere_amount', 'payhere_currency', 'md5sig'];

    for (const field of requiredFields) {
      if (!payload[field]) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    if (!verifyPayHereSignature(payload)) {
      return res.status(400).json({ error: 'Invalid PayHere signature' });
    }

    const order = await Order.findOne({ where: { OrderNumber: payload.order_id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let payment = await Payment.findOne({ where: { OrderID: order.OrderID } });
    if (!payment) {
      payment = await Payment.create({
        OrderID: order.OrderID,
        Amount: order.FinalAmount,
        Method: 'ONLINE',
        Status: 'PENDING'
      });
    }

    // ===== CRITICAL: Validate payment amount matches order total =====
    const paymentAmount = parseFloat(payload.payhere_amount);
    const expectedAmount = parseFloat(order.FinalAmount);
    
    if (Math.abs(paymentAmount - expectedAmount) > 0.01) {
      console.error(`❌ Amount mismatch: Payment ₹${paymentAmount} vs Order ₹${expectedAmount}`);
      return res.status(400).json({ 
        error: 'Payment amount does not match order total. Fraud detected.' 
      });
    }

    // ===== CRITICAL: Check for duplicate transaction ID =====
    const existingTransaction = await Payment.findOne({
      where: { TransactionID: payload.payment_id }
    });
    if (existingTransaction) {
      console.warn(`⚠️ Duplicate transaction ID detected: ${payload.payment_id}`);
      return res.status(400).json({ 
        error: 'Duplicate payment transaction detected.' 
      });
    }

    // ===== CRITICAL: Check order is not already cancelled =====
    if (order.Status === 'CANCELLED') {
      return res.status(400).json({ 
        error: 'Cannot process payment for cancelled order.' 
      });
    }

    const isPaid = payload.status_code === PAYHERE_SUCCESS;
    const isPending = payload.status_code === PAYHERE_PENDING;

    await payment.update({
      Status: isPaid ? 'PAID' : isPending ? 'PENDING' : 'FAILED',
      TransactionID: payload.payment_id,
      PaidAt: isPaid ? new Date() : null,
      GatewayStatus: isPaid ? 'SUCCESS' : isPending ? 'PENDING' : `FAILED_${payload.status_code}`
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('PayHere webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

exports.stripeWebhook = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(501).json({ error: 'Stripe webhook not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const signature = req.headers['stripe-signature'];

    if (!signature || !req.rawBody) {
      return res.status(400).json({ error: 'Missing Stripe signature or raw body' });
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const payment = await Payment.findOne({ where: { TransactionID: intent.id } });

      if (payment) {
        await payment.update({
          Status: event.type === 'payment_intent.succeeded' ? 'PAID' : 'FAILED',
          PaidAt: event.type === 'payment_intent.succeeded' ? new Date() : null,
          GatewayStatus: event.type === 'payment_intent.succeeded' ? 'SUCCESS' : (intent.last_payment_error?.message || 'FAILED')
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message || error);
    return res.status(400).json({ error: 'Stripe webhook validation failed' });
  }
};
