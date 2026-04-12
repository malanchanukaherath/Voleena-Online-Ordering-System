const request = require('supertest');

const mockOrder = {
  count: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn()
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
const mockComboPack = {};
const mockDelivery = {};
const mockAddress = {};
const mockStaff = {};
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
  ComboPack: mockComboPack,
  Delivery: mockDelivery,
  Address: mockAddress,
  Staff: mockStaff,
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

  test('rejects receipt retrieval when unauthenticated', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .get('/api/v1/cashier/orders/501/receipt');

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
    mockOrder.update.mockResolvedValue([1]);
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
    mockOrder.update.mockResolvedValue([1]);
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

  test('returns receipt payload for manual reprint by order id', async () => {
    mockOrder.findByPk.mockResolvedValue({
      OrderID: 501,
      OrderNumber: 'VF2604110001',
      OrderType: 'WALK_IN',
      TotalAmount: 1500,
      DiscountAmount: 0,
      DeliveryFee: 0,
      FinalAmount: 1500,
      created_at: new Date('2026-04-11T10:30:00.000Z'),
      customer: {
        CustomerID: 1,
        Name: 'Walk-in Customer',
        Phone: '7000000000',
        Email: null
      },
      payment: {
        PaymentID: 71,
        Method: 'CASH',
        Status: 'PAID',
        Amount: 1500,
        PaidAt: new Date('2026-04-11T10:31:00.000Z')
      },
      items: [
        {
          OrderItemID: 90,
          MenuItemID: 1,
          ComboID: null,
          Quantity: 2,
          UnitPrice: 750,
          menuItem: {
            MenuItemID: 1,
            Name: 'Chicken Kottu',
            Price: 750
          },
          combo: null
        }
      ],
      confirmer: {
        StaffID: 2,
        Name: 'Cashier One'
      }
    });

    const response = await request(app)
      .get('/api/v1/cashier/orders/501/receipt');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.receipt).toBeDefined();
    expect(response.body.receipt.orderId).toBe(501);
    expect(response.body.receipt.receiptNumber).toBe('VF2604110001');
    expect(response.body.receipt.items).toHaveLength(1);
    expect(response.body.receipt.payment.method).toBe('CASH');
  });
});
