const crypto = require('crypto');
const paymentService = require('../utils/paymentService');
const { Order, Customer, Payment } = require('../models');
const appNotificationService = require('../services/appNotificationService');
const orderService = require('../services/orderService');

const PAYHERE_SUCCESS = '2';
const PAYHERE_PENDING = '0';
const ALLOWED_PAYMENT_METHODS = new Set(['CASH', 'CARD', 'ONLINE']);
const STRIPE_WEBHOOK_EVENTS = new Set([
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_intent.processing'
]);

function normalizePaymentMethod(paymentMethod) {
  return typeof paymentMethod === 'string' ? paymentMethod.trim().toUpperCase() : '';
}

function hasConfiguredStripeValue(value, prefix) {
  return typeof value === 'string' && value.trim().startsWith(prefix) && !value.includes('your_');
}

function amountsMatch(left, right) {
  return Math.abs(Number(left) - Number(right)) <= 0.01;
}

function buildGatewayStatus(status, detail) {
  return [status, detail]
    .filter(Boolean)
    .join('_')
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);
}

async function cancelOrderAfterPaymentFailure(order, reason) {
  if (!order || ['CANCELLED', 'DELIVERED'].includes(order.Status)) {
    return;
  }

  await orderService.cancelOrder(
    order.OrderID,
    reason || 'Payment failed',
    null,
    'SYSTEM'
  );
}

async function notifyPaymentUpdate(order, payment, nextStatus) {
  try {
    if (!order || !payment) {
      return;
    }

    const orderNumber = order.OrderNumber || order.OrderID;
    const method = payment.Method || 'PAYMENT';

    const customerMessageByStatus = {
      PAID: `Payment received for order #${orderNumber}.`,
      FAILED: `Payment failed for order #${orderNumber}. Please try again.`,
      PENDING: `Payment for order #${orderNumber} is pending settlement.`
    };

    const staffMessageByStatus = {
      PAID: `Order #${orderNumber} payment completed via ${method}.`,
      FAILED: `Order #${orderNumber} payment failed (${method}).`,
      PENDING: `Order #${orderNumber} payment is pending review (${method}).`
    };

    if (order.CustomerID && order.OrderType !== 'WALK_IN' && ['PAID', 'FAILED'].includes(nextStatus)) {
      await appNotificationService.notifyCustomer(order.CustomerID, {
        eventType: 'PAYMENT_STATUS_UPDATED',
        title: `Order #${orderNumber}`,
        message: customerMessageByStatus[nextStatus] || `Payment status updated to ${nextStatus}.`,
        priority: nextStatus === 'FAILED' ? 'HIGH' : 'MEDIUM',
        relatedOrderId: order.OrderID,
        payload: {
          orderId: order.OrderID,
          orderNumber,
          paymentId: payment.PaymentID,
          paymentMethod: method,
          paymentStatus: nextStatus
        },
        dedupeKey: `PAYMENT_STATUS_UPDATED:CUSTOMER:${order.CustomerID}:${payment.PaymentID}:${nextStatus}`
      });
    }

    if (nextStatus === 'FAILED') {
      await appNotificationService.notifyStaffRoles(['Cashier', 'Admin'], {
        eventType: 'PAYMENT_STATUS_UPDATED',
        title: `Order #${orderNumber}`,
        message: staffMessageByStatus[nextStatus] || `Payment status updated to ${nextStatus}.`,
        priority: 'HIGH',
        relatedOrderId: order.OrderID,
        payload: {
          orderId: order.OrderID,
          orderNumber,
          paymentId: payment.PaymentID,
          paymentMethod: method,
          paymentStatus: nextStatus
        },
        dedupeKey: `PAYMENT_STATUS_UPDATED:STAFF:${payment.PaymentID}:${nextStatus}`
      });
    }

    if (nextStatus === 'PENDING') {
      await appNotificationService.notifyStaffRoles(['Admin'], {
        eventType: 'PAYMENT_STATUS_UPDATED',
        title: `Order #${orderNumber}`,
        message: staffMessageByStatus[nextStatus] || `Payment status updated to ${nextStatus}.`,
        priority: 'MEDIUM',
        relatedOrderId: order.OrderID,
        payload: {
          orderId: order.OrderID,
          orderNumber,
          paymentId: payment.PaymentID,
          paymentMethod: method,
          paymentStatus: nextStatus
        },
        dedupeKey: `PAYMENT_STATUS_UPDATED:STAFF:${payment.PaymentID}:${nextStatus}`
      });
    }
  } catch (error) {
    console.error('[APP_NOTIFICATION] payment update:', error.message);
  }
}

async function findStripePaymentRecord(intent) {
  const metadataPaymentId = Number.parseInt(intent.metadata?.paymentId, 10);

  if (Number.isInteger(metadataPaymentId)) {
    return Payment.findByPk(metadataPaymentId);
  }

  return Payment.findOne({ where: { TransactionID: intent.id } });
}

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

  const remoteSig = String(payload.md5sig || '').toUpperCase();
  const localBuffer = Buffer.from(localSig, 'utf8');
  const remoteBuffer = Buffer.from(remoteSig, 'utf8');

  if (localBuffer.length !== remoteBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(localBuffer, remoteBuffer);
}

exports.initiatePayment = async (req, res) => {
  let order = null;
  let paymentMethod = '';

  try {
    const { orderId } = req.body;
    paymentMethod = normalizePaymentMethod(req.body.paymentMethod);

    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'orderId and paymentMethod are required' });
    }

    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    if (req.user.type !== 'Customer') {
      return res.status(403).json({ error: 'Only customers can initiate payments' });
    }

    order = await Order.findByPk(orderId);
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
    if (existingPayment) {
      if (existingPayment.Method !== paymentMethod) {
        return res.status(409).json({
          error: `Payment method already set to ${existingPayment.Method} for this order`
        });
      }

      if (existingPayment.Status === 'PAID') {
        return res.status(409).json({ error: 'Payment is already completed for this order' });
      }
    }

    const customer = await Customer.findByPk(order.CustomerID);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const paymentData = await paymentService.initializePayment(order, customer, paymentMethod, existingPayment || null);

    return res.json({ success: true, data: paymentData });
  } catch (error) {
    console.error('Initiate payment error:', error);
    if (order && ['CARD', 'ONLINE'].includes(paymentMethod)) {
      try {
        await cancelOrderAfterPaymentFailure(order, `Payment initialization failed: ${error.message || 'Unknown error'}`);
      } catch (cancelError) {
        console.error('Failed to cancel order after payment initialization error:', cancelError.message || cancelError);
      }
    }
    return res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

exports.confirmCardPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ error: 'orderId and paymentIntentId are required' });
    }

    if (req.user.type !== 'Customer') {
      return res.status(403).json({ error: 'Only customers can confirm card payments' });
    }

    if (!hasConfiguredStripeValue(process.env.STRIPE_SECRET_KEY, 'sk_')) {
      return res.status(501).json({ error: 'Stripe server configuration is missing' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.CustomerID !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.Status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot confirm payment for a cancelled order' });
    }

    const payment = await Payment.findOne({
      where: {
        OrderID: orderId,
        Method: 'CARD'
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Card payment record not found for this order' });
    }

    if (payment.Status === 'PAID') {
      return res.json({
        success: true,
        duplicate: true,
        data: {
          paymentId: payment.PaymentID,
          status: payment.Status
        }
      });
    }

    if (payment.TransactionID && payment.TransactionID !== paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent does not match the initialized payment record' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!intent) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    if (intent.status !== 'succeeded') {
      if (['requires_payment_method', 'canceled'].includes(intent.status)) {
        await payment.update({
          Status: 'FAILED',
          PaidAt: null,
          TransactionID: intent.id,
          GatewayStatus: buildGatewayStatus('FAILED', intent.status)
        });

        await notifyPaymentUpdate(order, payment, 'FAILED');
        await cancelOrderAfterPaymentFailure(order, `Card payment failed with status: ${intent.status}`);
      }

      return res.status(400).json({ error: `Payment is not completed yet (status: ${intent.status})` });
    }

    const expectedAmount = Number(payment.Amount ?? order.FinalAmount ?? order.TotalAmount ?? 0);
    const receivedAmount = Number((intent.amount_received ?? intent.amount ?? 0) / 100);
    const isCurrencyValid = String(intent.currency || '').toLowerCase() === 'lkr';

    if (!amountsMatch(receivedAmount, expectedAmount) || !isCurrencyValid) {
      return res.status(400).json({ error: 'Payment verification failed due to currency or amount mismatch' });
    }

    await payment.update({
      Status: 'PAID',
      PaidAt: new Date(),
      TransactionID: intent.id,
      GatewayStatus: 'SUCCESS'
    });

    await notifyPaymentUpdate(order, payment, 'PAID');

    return res.json({
      success: true,
      data: {
        paymentId: payment.PaymentID,
        status: 'PAID',
        orderId: order.OrderID
      }
    });
  } catch (error) {
    console.error('Confirm card payment error:', error);
    return res.status(500).json({ error: 'Failed to confirm card payment' });
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
    if (existingTransaction && existingTransaction.PaymentID !== payment.PaymentID) {
      console.warn(`⚠️ Duplicate transaction ID detected: ${payload.payment_id}`);
      return res.status(400).json({ 
        error: 'Duplicate payment transaction detected.' 
      });
    }

    if (existingTransaction && existingTransaction.PaymentID === payment.PaymentID) {
      if (existingTransaction.Status === 'FAILED') {
        await cancelOrderAfterPaymentFailure(order, `PayHere payment failed: ${existingTransaction.GatewayStatus || 'FAILED'}`);
      }

      return res.json({ success: true, duplicate: true });
    }

    // ===== CRITICAL: Check order is not already cancelled =====
    if (order.Status === 'CANCELLED') {
      return res.status(400).json({ 
        error: 'Cannot process payment for cancelled order.' 
      });
    }

    const isPaid = payload.status_code === PAYHERE_SUCCESS;
    const isPending = payload.status_code === PAYHERE_PENDING;
    const isFailed = !isPaid && !isPending;

    await payment.update({
      Status: isPaid ? 'PAID' : isPending ? 'PENDING' : 'FAILED',
      TransactionID: payload.payment_id,
      PaidAt: isPaid ? new Date() : null,
      GatewayStatus: isPaid ? 'SUCCESS' : isPending ? 'PENDING' : buildGatewayStatus('FAILED', payload.status_code)
    });

    await notifyPaymentUpdate(order, payment, isPaid ? 'PAID' : isPending ? 'PENDING' : 'FAILED');

    if (isFailed) {
      await cancelOrderAfterPaymentFailure(order, `PayHere payment failed with status code: ${payload.status_code}`);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('PayHere webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

exports.stripeWebhook = async (req, res) => {
  try {
    if (!hasConfiguredStripeValue(process.env.STRIPE_SECRET_KEY, 'sk_') || !hasConfiguredStripeValue(process.env.STRIPE_WEBHOOK_SECRET, 'whsec_')) {
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

    if (!STRIPE_WEBHOOK_EVENTS.has(event.type)) {
      return res.json({ received: true, ignored: true });
    }

    const intent = event.data.object;
    const payment = await findStripePaymentRecord(intent);

    if (!payment) {
      console.warn(`⚠️ Stripe webhook received for unknown payment intent: ${intent.id}`);
      return res.json({ received: true, ignored: true });
    }

    const order = await Order.findByPk(payment.OrderID);
    const expectedAmount = Number(payment.Amount ?? order?.FinalAmount);
    const intentAmount = Number((intent.amount_received ?? intent.amount ?? 0) / 100);
    const isCurrencyValid = String(intent.currency || '').toLowerCase() === 'lkr';
    const isOrderCancelled = order?.Status === 'CANCELLED';
    const amountMismatch = !amountsMatch(intentAmount, expectedAmount);

    if (event.type === 'payment_intent.succeeded') {
      if (payment.Status === 'PAID') {
        return res.json({ received: true, duplicate: true });
      }

      if (payment.Method !== 'CARD' || !order || isOrderCancelled || amountMismatch || !isCurrencyValid) {
        const reviewReason = !order
          ? 'MISSING_ORDER'
          : payment.Method !== 'CARD'
            ? 'METHOD_MISMATCH'
            : isOrderCancelled
              ? 'CANCELLED_ORDER'
              : amountMismatch
                ? 'AMOUNT_MISMATCH'
                : 'INVALID_CURRENCY';

        await payment.update({
          Status: 'PENDING',
          PaidAt: null,
          GatewayStatus: buildGatewayStatus('REVIEW', reviewReason)
        });

        await notifyPaymentUpdate(order, payment, 'PENDING');

        console.error(`❌ Stripe payment requires manual review: ${intent.id} (${reviewReason})`);
        return res.json({ received: true, review: true });
      }

      await payment.update({
        Status: 'PAID',
        TransactionID: intent.id,
        PaidAt: new Date(),
        GatewayStatus: 'SUCCESS'
      });

      await notifyPaymentUpdate(order, payment, 'PAID');
    }

    if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      const failureReason = event.type === 'payment_intent.canceled' ? 'canceled' : 'failed';

      await payment.update({
        Status: 'FAILED',
        PaidAt: null,
        GatewayStatus: buildGatewayStatus(
          failureReason === 'canceled' ? 'CANCELED' : 'FAILED',
          intent.last_payment_error?.code || intent.status
        )
      });

      await notifyPaymentUpdate(order, payment, 'FAILED');
      await cancelOrderAfterPaymentFailure(order, `Stripe payment ${failureReason}: ${intent.last_payment_error?.code || intent.status || intent.id}`);
    }

    if (event.type === 'payment_intent.processing') {
      await payment.update({
        Status: 'PENDING',
        PaidAt: null,
        GatewayStatus: buildGatewayStatus('PENDING', intent.status)
      });

      await notifyPaymentUpdate(order, payment, 'PENDING');
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message || error);
    return res.status(400).json({ error: 'Stripe webhook validation failed' });
  }
};
