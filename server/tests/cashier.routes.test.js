const request = require('supertest');

const mockOrder = {
  count: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn()
};

const mockCustomer = {
  count: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
};

const mockOrderItem = {};
const mockMenuItem = {};
const mockDelivery = {};
const mockAddress = {};
const mockOrderStatusHistory = {
  create: jest.fn()
};
const mockPayment = {
  create: jest.fn()
};
const mockSequelize = {
  Sequelize: {
    Op: {
      gte: Symbol('gte'),
      in: Symbol('in'),
      like: Symbol('like'),
      between: Symbol('between'),
      not: Symbol('not')
    }
  },
  literal: jest.fn((value) => value)
};

const mockOrderService = {
  createOrder: jest.fn()
};

jest.mock('../models', () => ({
  Order: mockOrder,
  Customer: mockCustomer,
  OrderItem: mockOrderItem,
  MenuItem: mockMenuItem,
  Delivery: mockDelivery,
  Address: mockAddress,
  OrderStatusHistory: mockOrderStatusHistory,
  Payment: mockPayment,
  sequelize: mockSequelize
}));
jest.mock('../services/orderService', () => mockOrderService);
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/cashierRoutes');

const app = createTestApp('/api/v1/cashier', router);

describe('cashier routes', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
    setAuthUser({ id: 2, type: 'Staff', role: 'Cashier' });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('rejects walk-in order creation when unauthenticated', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .post('/api/v1/cashier/walkin-order')
      .send({ items: [{ menuItemId: 1, quantity: 1 }] });

    expect(response.status).toBe(401);
  });

  test('creates a guest walk-in order when no customer is selected', async () => {
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 1,
      Name: 'Walk-in Customer',
      Phone: '7000000000'
    });
    mockOrderService.createOrder.mockResolvedValue({
      OrderID: 501,
      FinalAmount: 1500
    });
    mockPayment.create.mockResolvedValue({ PaymentID: 71 });
    mockOrder.findByPk.mockResolvedValue({
      OrderID: 501,
      OrderNumber: 'VF2604110001'
    });

    const response = await request(app)
      .post('/api/v1/cashier/walkin-order')
      .send({
        items: [{ menuItemId: 1, quantity: 2 }],
        payment_method: 'CASH'
      });

    expect(response.status).toBe(201);
    expect(mockCustomer.findOne).toHaveBeenCalled();
    expect(mockCustomer.findByPk).not.toHaveBeenCalled();
    expect(mockOrderService.createOrder).toHaveBeenCalledWith(1, expect.objectContaining({
      orderType: 'WALK_IN'
    }));
    expect(mockPayment.create).toHaveBeenCalledWith(expect.objectContaining({
      OrderID: 501,
      Method: 'CASH',
      Status: 'PAID'
    }));
  });

  test('attaches the walk-in order to a selected active customer', async () => {
    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 7,
      Name: 'Jane Customer',
      Phone: '0771234567',
      AccountStatus: 'ACTIVE',
      IsActive: true
    });
    mockOrderService.createOrder.mockResolvedValue({
      OrderID: 777,
      FinalAmount: 2400
    });
    mockPayment.create.mockResolvedValue({ PaymentID: 88 });
    mockOrder.findByPk.mockResolvedValue({
      OrderID: 777,
      OrderNumber: 'VF2604110002',
      customer: {
        CustomerID: 7,
        Name: 'Jane Customer'
      }
    });

    const response = await request(app)
      .post('/api/v1/cashier/walkin-order')
      .send({
        customer_id: 7,
        items: [{ menu_item_id: 1, quantity: 1 }],
        payment_method: 'CARD'
      });

    expect(response.status).toBe(201);
    expect(mockCustomer.findOne).not.toHaveBeenCalled();
    expect(mockCustomer.findByPk).toHaveBeenCalledWith(7);
    expect(mockOrderService.createOrder).toHaveBeenCalledWith(7, expect.objectContaining({
      orderType: 'WALK_IN'
    }));
    expect(mockPayment.create).toHaveBeenCalledWith(expect.objectContaining({
      OrderID: 777,
      Method: 'CARD',
      Status: 'PENDING'
    }));
  });

  test('rejects walk-in orders for inactive customers', async () => {
    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 9,
      Name: 'Blocked Customer',
      AccountStatus: 'BLOCKED',
      IsActive: true
    });

    const response = await request(app)
      .post('/api/v1/cashier/walkin-order')
      .send({
        customer_id: 9,
        items: [{ menuItemId: 1, quantity: 1 }],
        payment_method: 'CASH'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/not active/i);
    expect(mockOrderService.createOrder).not.toHaveBeenCalled();
    expect(mockPayment.create).not.toHaveBeenCalled();
  });
});
