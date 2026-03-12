const request = require('supertest');

const validationState = { mode: 'allow' };

const mockOrder = {
  findByPk: jest.fn(),
  findAll: jest.fn()
};

const mockOrderItem = {};
const mockMenuItem = {};
const mockComboPack = {};
const mockCustomer = {};
const mockDelivery = {};
const mockAddress = {};
const mockPayment = {};
const mockSequelize = {
  Op: { between: Symbol('between') },
  literal: jest.fn((value) => value)
};

const mockOrderService = {
  createOrder: jest.fn(),
  confirmOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  cancelOrder: jest.fn()
};

jest.mock('../models', () => ({
  Order: mockOrder,
  OrderItem: mockOrderItem,
  MenuItem: mockMenuItem,
  ComboPack: mockComboPack,
  Customer: mockCustomer,
  Delivery: mockDelivery,
  Address: mockAddress,
  Payment: mockPayment,
  sequelize: mockSequelize
}));
jest.mock('../services/orderService', () => mockOrderService);
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../middleware/rateLimiter', () => {
  const passThrough = (req, res, next) => next();
  return {
    orderLimiter: passThrough,
    confirmOrderLimiter: passThrough
  };
});
jest.mock('../middleware/validation', () => ({
  validateOrderCancellation: (req, res, next) => {
    if (validationState.mode === 'invalid') {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }
    return next();
  }
}));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/orders');

const app = createTestApp('/api/v1/orders', router);

describe('order routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
    validationState.mode = 'allow';
  });

  test('rejects order creation when unauthenticated', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .post('/api/v1/orders')
      .send({ items: [{ menuItemId: 1, quantity: 1 }] });

    expect(response.status).toBe(401);
  });

  test('creates an order for an authenticated customer', async () => {
    setAuthUser({ id: 25, type: 'Customer', role: 'Customer' });
    mockOrderService.createOrder.mockResolvedValue({ OrderID: 501 });
    mockOrder.findByPk.mockResolvedValue({ OrderID: 501, Status: 'CONFIRMED', items: [] });

    const payload = {
      items: [{ menuItemId: 1, quantity: 2 }],
      orderType: 'TAKEAWAY'
    };

    const response = await request(app)
      .post('/api/v1/orders')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockOrderService.createOrder).toHaveBeenCalledWith(25, expect.objectContaining({
      orderType: 'TAKEAWAY'
    }), undefined);
  });

  test('filters GET /orders to the current customer', async () => {
    setAuthUser({ id: 88, type: 'Customer', role: 'Customer' });
    mockOrder.findAll.mockResolvedValue([]);

    const response = await request(app).get('/api/v1/orders');

    expect(response.status).toBe(200);
    expect(mockOrder.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ CustomerID: 88 })
    }));
  });

  test('confirms an order for cashier users', async () => {
    setAuthUser({ id: 9, type: 'Staff', role: 'Cashier' });
    mockOrderService.confirmOrder.mockResolvedValue({ OrderID: 1, Status: 'CONFIRMED' });

    const response = await request(app)
      .post('/api/v1/orders/1/confirm')
      .send({});

    expect(response.status).toBe(200);
    expect(mockOrderService.confirmOrder).toHaveBeenCalledWith('1', 9);
  });

  test('rejects staff-only status updates for customers', async () => {
    setAuthUser({ id: 4, type: 'Customer', role: 'Customer' });

    const response = await request(app)
      .patch('/api/v1/orders/1/status')
      .send({ status: 'READY' });

    expect(response.status).toBe(403);
  });

  test('validates cancellation requests before hitting the service', async () => {
    setAuthUser({ id: 4, type: 'Customer', role: 'Customer' });
    validationState.mode = 'invalid';

    const response = await request(app)
      .delete('/api/v1/orders/1')
      .send({ reason: '' });

    expect(response.status).toBe(400);
    expect(mockOrderService.cancelOrder).not.toHaveBeenCalled();
  });

  test('cancels an order and reports success when validation passes', async () => {
    setAuthUser({ id: 4, type: 'Customer', role: 'Customer' });
    mockOrderService.cancelOrder.mockResolvedValue({ OrderID: 1, items: [{ OrderItemID: 1 }] });

    const response = await request(app)
      .delete('/api/v1/orders/1')
      .send({ reason: 'Need to change address' });

    expect(response.status).toBe(200);
    expect(mockOrderService.cancelOrder).toHaveBeenCalledWith('1', 'Need to change address', 4, 'CUSTOMER');
  });
});