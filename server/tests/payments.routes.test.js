const request = require('supertest');
const crypto = require('crypto');

const mockOrder = {
  findByPk: jest.fn(),
  findOne: jest.fn()
};

const mockCustomer = {
  findByPk: jest.fn()
};

const mockPayment = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
};

const mockPaymentService = {
  initializePayment: jest.fn()
};

jest.mock('../models', () => ({ Order: mockOrder, Customer: mockCustomer, Payment: mockPayment }));
jest.mock('../utils/paymentService', () => mockPaymentService);
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../middleware/rateLimiter', () => ({
  paymentLimiter: (req, res, next) => next()
}));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/payments');

const app = createTestApp('/api/v1/payments', router);

describe('payment routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
    delete process.env.PAYHERE_MERCHANT_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  test('rejects payment initiation when unauthenticated', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 1, paymentMethod: 'CARD' });

    expect(response.status).toBe(401);
  });

  test('validates supported payment methods', async () => {
    setAuthUser({ id: 10, type: 'Customer', role: 'Customer' });

    const response = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 1, paymentMethod: 'BITCOIN' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Unsupported/);
  });

  test('prevents customers from initiating payments for someone else\'s order', async () => {
    setAuthUser({ id: 10, type: 'Customer', role: 'Customer' });
    mockOrder.findByPk.mockResolvedValue({ OrderID: 1, CustomerID: 99, Status: 'CONFIRMED' });

    const response = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 1, paymentMethod: 'CARD' });

    expect(response.status).toBe(403);
  });

  test('initializes a new payment for a valid customer order', async () => {
    setAuthUser({ id: 10, type: 'Customer', role: 'Customer' });
    mockOrder.findByPk.mockResolvedValue({ OrderID: 1, CustomerID: 10, Status: 'CONFIRMED' });
    mockPayment.findOne.mockResolvedValue(null);
    mockCustomer.findByPk.mockResolvedValue({ CustomerID: 10, Name: 'Customer', Email: 'user@example.com' });
    mockPaymentService.initializePayment.mockResolvedValue({ clientSecret: 'cs_test_123' });

    const response = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 1, paymentMethod: 'CARD' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockPaymentService.initializePayment).toHaveBeenCalled();
  });

  test('reuses an existing pending payment when method matches', async () => {
    setAuthUser({ id: 10, type: 'Customer', role: 'Customer' });
    const existingPayment = { PaymentID: 101, Method: 'CARD', Status: 'PENDING' };

    mockOrder.findByPk.mockResolvedValue({ OrderID: 1, CustomerID: 10, Status: 'CONFIRMED' });
    mockPayment.findOne.mockResolvedValue(existingPayment);
    mockCustomer.findByPk.mockResolvedValue({ CustomerID: 10, Name: 'Customer', Email: 'user@example.com' });
    mockPaymentService.initializePayment.mockResolvedValue({ clientSecret: 'cs_test_reuse' });

    const response = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 1, paymentMethod: 'CARD' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockPaymentService.initializePayment).toHaveBeenCalledWith(
      expect.objectContaining({ OrderID: 1 }),
      expect.objectContaining({ CustomerID: 10 }),
      'CARD',
      existingPayment
    );
  });

  test('rejects initiation when payment method is already set differently', async () => {
    setAuthUser({ id: 10, type: 'Customer', role: 'Customer' });

    mockOrder.findByPk.mockResolvedValue({ OrderID: 1, CustomerID: 10, Status: 'CONFIRMED' });
    mockPayment.findOne.mockResolvedValue({ PaymentID: 102, Method: 'ONLINE', Status: 'PENDING' });

    const response = await request(app)
      .post('/api/v1/payments/initiate')
      .send({ orderId: 1, paymentMethod: 'CARD' });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already set/i);
    expect(mockPaymentService.initializePayment).not.toHaveBeenCalled();
  });

  test('rejects PayHere webhooks with missing required fields', async () => {
    const response = await request(app)
      .post('/api/v1/payments/webhook/payhere')
      .send({ order_id: 'ORDER-1' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Missing field/);
  });

  test('returns not implemented when Stripe webhook secrets are absent', async () => {
    const response = await request(app)
      .post('/api/v1/payments/webhook/stripe')
      .send({});

    expect(response.status).toBe(501);
    expect(response.body.error).toMatch(/not configured/i);
  });

  test('accepts PayHere webhook when signature is valid', async () => {
    process.env.PAYHERE_MERCHANT_SECRET = 'merchant-secret';

    const order = {
      OrderID: 501,
      OrderNumber: 'ORD-501',
      FinalAmount: 1500,
      Status: 'CONFIRMED'
    };
    const payment = {
      PaymentID: 9001,
      Status: 'PENDING',
      update: jest.fn().mockResolvedValue(true)
    };

    mockOrder.findOne.mockResolvedValue(order);
    mockPayment.findOne
      .mockResolvedValueOnce(payment)
      .mockResolvedValueOnce(null);

    const payload = {
      merchant_id: 'MID123',
      order_id: 'ORD-501',
      payment_id: 'PH-TXN-1',
      status_code: '2',
      payhere_amount: '1500.00',
      payhere_currency: 'LKR'
    };

    const hashedSecret = crypto
      .createHash('md5')
      .update(process.env.PAYHERE_MERCHANT_SECRET)
      .digest('hex')
      .toUpperCase();

    payload.md5sig = crypto
      .createHash('md5')
      .update(
        `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`
      )
      .digest('hex')
      .toUpperCase();

    const response = await request(app)
      .post('/api/v1/payments/webhook/payhere')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(payment.update).toHaveBeenCalledWith(expect.objectContaining({
      Status: 'PAID',
      TransactionID: 'PH-TXN-1',
      GatewayStatus: 'SUCCESS'
    }));
  });

  test('rejects PayHere webhook when signature is invalid', async () => {
    process.env.PAYHERE_MERCHANT_SECRET = 'merchant-secret';

    const response = await request(app)
      .post('/api/v1/payments/webhook/payhere')
      .send({
        merchant_id: 'MID123',
        order_id: 'ORD-502',
        payment_id: 'PH-TXN-2',
        status_code: '2',
        payhere_amount: '1200.00',
        payhere_currency: 'LKR',
        md5sig: 'INVALID_SIGNATURE'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid payhere signature/i);
    expect(mockOrder.findOne).not.toHaveBeenCalled();
  });
});