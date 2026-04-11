const request = require('supertest');

const mockOrder = {
  findAll: jest.fn(),
  findByPk: jest.fn(),
  count: jest.fn()
};

const mockOrderItem = {};
const mockMenuItem = {};
const mockDailyStock = {
  findAll: jest.fn(),
  findOrCreate: jest.fn()
};
const mockOrderStatusHistory = {};
const mockPayment = {};

const mockSequelize = {
  literal: jest.fn((value) => value),
  Sequelize: {
    Op: {
      in: Symbol('in'),
      ne: Symbol('ne'),
      and: Symbol('and'),
      or: Symbol('or'),
      gte: Symbol('gte')
    }
  }
};

const mockOrderService = {
  updateOrderStatus: jest.fn()
};

jest.mock('../models', () => ({
  Order: mockOrder,
  OrderItem: mockOrderItem,
  MenuItem: mockMenuItem,
  DailyStock: mockDailyStock,
  OrderStatusHistory: mockOrderStatusHistory,
  Payment: mockPayment,
  sequelize: mockSequelize,
  Category: {}
}));
jest.mock('../services/orderService', () => mockOrderService);
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));

const { resetAuthState, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/kitchenRoutes');

const app = createTestApp('/api/v1/kitchen', router);

describe('kitchen routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
    setAuthUser({ id: 21, type: 'Staff', role: 'Kitchen' });
    mockOrder.count.mockResolvedValue(0);
  });

  test('filters confirmed queue to paid or cash orders', async () => {
    mockOrder.findAll.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/v1/kitchen/orders')
      .query({ status: 'CONFIRMED' });

    expect(response.status).toBe(200);
    expect(mockOrder.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        Status: 'CONFIRMED',
        [mockSequelize.Sequelize.Op.or]: [
          { '$payment.Method$': 'CASH' },
          { '$payment.Status$': 'PAID' }
        ]
      })
    }));
  });

  test('blocks moving unpaid online order into preparation', async () => {
    mockOrder.findByPk.mockResolvedValue({
      OrderID: 10,
      Status: 'CONFIRMED',
      payment: {
        Method: 'ONLINE',
        Status: 'PENDING'
      }
    });

    const response = await request(app)
      .put('/api/v1/kitchen/orders/10/status')
      .send({ status: 'PREPARING' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/payment not completed/i);
    expect(mockOrderService.updateOrderStatus).not.toHaveBeenCalled();
  });

  test('allows moving cash order into preparation', async () => {
    const order = {
      OrderID: 11,
      OrderNumber: 'ORD-11',
      OrderType: 'DELIVERY',
      Status: 'CONFIRMED',
      payment: {
        Method: 'CASH',
        Status: 'PENDING'
      }
    };

    mockOrder.findByPk.mockResolvedValue(order);
    mockOrderService.updateOrderStatus.mockResolvedValue({ ...order, Status: 'PREPARING' });

    const response = await request(app)
      .put('/api/v1/kitchen/orders/11/status')
      .send({ status: 'PREPARING' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith('11', 'PREPARING', 21, 'Status updated by kitchen staff');
  });
});
