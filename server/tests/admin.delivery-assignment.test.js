const mockOrder = {
  findByPk: jest.fn(),
  update: jest.fn()
};

const mockDelivery = {
  findOne: jest.fn()
};

const mockStaff = {
  findOne: jest.fn()
};

const mockRole = {};

const mockDeliveryStaffAvailability = {
  findOrCreate: jest.fn(),
  count: jest.fn(),
  update: jest.fn()
};

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
  LOCK: {
    UPDATE: 'UPDATE'
  }
};

const mockSequelize = {
  Transaction: {
    ISOLATION_LEVELS: {
      SERIALIZABLE: 'SERIALIZABLE'
    }
  },
  Sequelize: {
    Op: {
      in: Symbol('in')
    }
  },
  transaction: jest.fn().mockResolvedValue(mockTransaction)
};

const mockAppNotificationService = {
  notifyStaffById: jest.fn().mockResolvedValue(true),
  notifyCustomer: jest.fn().mockResolvedValue(true),
  notifyStaffRoles: jest.fn().mockResolvedValue(true)
};

jest.mock('../models', () => ({
  Staff: mockStaff,
  Customer: {},
  Order: mockOrder,
  MenuItem: {},
  Category: {},
  ComboPack: {},
  Promotion: {},
  DailyStock: {},
  Role: mockRole,
  Delivery: mockDelivery,
  DeliveryStaffAvailability: mockDeliveryStaffAvailability,
  Feedback: {},
  sequelize: mockSequelize
}));

jest.mock('../utils/deliveryEta', () => ({
  calculateEstimatedDeliveryTime: jest.fn(() => new Date('2026-04-17T12:00:00.000Z'))
}));

jest.mock('../services/systemSettingsService', () => ({}));
jest.mock('../services/appNotificationService', () => mockAppNotificationService);

const adminController = require('../controllers/adminController');

// Code Review: Function createResponse in server\tests\admin.delivery-assignment.test.js. Used in: server/tests/admin.delivery-assignment.test.js.
const createResponse = () => {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  jest.spyOn(res, 'status');
  jest.spyOn(res, 'json');

  return res;
};

// Code Review: Function createBaseDeliveryRecord in server\tests\admin.delivery-assignment.test.js. Used in: server/tests/admin.delivery-assignment.test.js.
const createBaseDeliveryRecord = () => ({
  DeliveryID: 501,
  OrderID: 101,
  DeliveryStaffID: null,
  Status: 'PENDING',
  DistanceKm: 3.4,
  update: jest.fn().mockResolvedValue(true)
});

describe('adminController.assignDeliveryStaff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.findByPk.mockReset();
    mockOrder.update.mockReset();
    mockDelivery.findOne.mockReset();
    mockStaff.findOne.mockReset();
    mockDeliveryStaffAvailability.findOrCreate.mockReset();
    mockDeliveryStaffAvailability.count.mockReset();
    mockDeliveryStaffAvailability.update.mockReset();
    mockSequelize.transaction.mockReset();
    mockAppNotificationService.notifyStaffById.mockReset();
    mockAppNotificationService.notifyCustomer.mockReset();
    mockAppNotificationService.notifyStaffRoles.mockReset();

    mockSequelize.transaction.mockResolvedValue(mockTransaction);
    mockOrder.update.mockResolvedValue([1]);
    mockAppNotificationService.notifyStaffById.mockResolvedValue(true);
    mockAppNotificationService.notifyCustomer.mockResolvedValue(true);
    mockAppNotificationService.notifyStaffRoles.mockResolvedValue(true);
  });

  test('allows manual assignment to unavailable rider when no riders are currently available', async () => {
    const delivery = createBaseDeliveryRecord();

    mockOrder.findByPk.mockResolvedValue({ OrderID: 101, OrderNumber: 'ORD-101', CustomerID: null });
    mockDelivery.findOne
      .mockResolvedValueOnce(delivery)
      .mockResolvedValueOnce(null);
    mockStaff.findOne.mockResolvedValue({ StaffID: 55, Name: 'Rider One' });
    mockDeliveryStaffAvailability.findOrCreate.mockResolvedValue([
      { DeliveryStaffID: 55, IsAvailable: false, CurrentOrderID: null }
    ]);
    mockDeliveryStaffAvailability.count.mockResolvedValue(0);
    mockDeliveryStaffAvailability.update.mockResolvedValue([1]);

    const req = {
      body: {
        orderId: 101,
        staffId: 55
      },
      user: { id: 1 }
    };
    const res = createResponse();

    await adminController.assignDeliveryStaff(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    expect(mockDeliveryStaffAvailability.count).toHaveBeenCalledTimes(1);
    expect(mockDeliveryStaffAvailability.update).toHaveBeenCalledTimes(1);
    expect(mockDeliveryStaffAvailability.update.mock.calls[0][1].where.DeliveryStaffID).toBe(55);
    expect(mockDeliveryStaffAvailability.update.mock.calls[0][1].where.IsAvailable).toBeUndefined();
    expect(delivery.update).toHaveBeenCalled();
  });

  test('rejects assignment to unavailable rider when at least one rider is available', async () => {
    const delivery = createBaseDeliveryRecord();

    mockOrder.findByPk.mockResolvedValue({ OrderID: 101, OrderNumber: 'ORD-101', CustomerID: null });
    mockDelivery.findOne.mockResolvedValue(delivery);
    mockStaff.findOne.mockResolvedValue({ StaffID: 55, Name: 'Rider One' });
    mockDeliveryStaffAvailability.findOrCreate.mockResolvedValue([
      { DeliveryStaffID: 55, IsAvailable: false, CurrentOrderID: null }
    ]);
    mockDeliveryStaffAvailability.count.mockResolvedValue(2);

    const req = {
      body: {
        orderId: 101,
        staffId: 55
      },
      user: { id: 1 }
    };
    const res = createResponse();

    await adminController.assignDeliveryStaff(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.payload.error).toMatch(/currently unavailable/i);
    expect(mockTransaction.rollback).toHaveBeenCalled();
    expect(delivery.update).not.toHaveBeenCalled();
  });

  test('rejects assignment when selected rider is handling another active delivery', async () => {
    const delivery = createBaseDeliveryRecord();

    mockOrder.findByPk.mockResolvedValue({ OrderID: 101, OrderNumber: 'ORD-101', CustomerID: null });
    mockDelivery.findOne
      .mockResolvedValueOnce(delivery)
      .mockResolvedValueOnce({ DeliveryID: 999, Status: 'IN_TRANSIT' });
    mockStaff.findOne.mockResolvedValue({ StaffID: 55, Name: 'Rider One' });
    mockDeliveryStaffAvailability.findOrCreate.mockResolvedValue([
      { DeliveryStaffID: 55, IsAvailable: false, CurrentOrderID: 999 }
    ]);

    const req = {
      body: {
        orderId: 101,
        staffId: 55
      },
      user: { id: 1 }
    };
    const res = createResponse();

    await adminController.assignDeliveryStaff(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.payload.error).toMatch(/already handling another active delivery/i);
    expect(mockDeliveryStaffAvailability.count).not.toHaveBeenCalled();
    expect(delivery.update).not.toHaveBeenCalled();
  });

  test('does not allow force assignment when available riders exist', async () => {
    const delivery = createBaseDeliveryRecord();

    mockOrder.findByPk.mockResolvedValue({ OrderID: 101, OrderNumber: 'ORD-101', CustomerID: null });
    mockDelivery.findOne.mockResolvedValue(delivery);
    mockStaff.findOne.mockResolvedValue({ StaffID: 55, Name: 'Rider One' });
    mockDeliveryStaffAvailability.findOrCreate.mockResolvedValue([
      { DeliveryStaffID: 55, IsAvailable: false, CurrentOrderID: null }
    ]);
    mockDeliveryStaffAvailability.count.mockResolvedValue(1);

    const req = {
      body: {
        orderId: 101,
        staffId: 55,
        forceAssign: true
      },
      user: { id: 1 }
    };
    const res = createResponse();

    await adminController.assignDeliveryStaff(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.payload.error).toMatch(/only allowed when no delivery staff are currently available/i);
    expect(delivery.update).not.toHaveBeenCalled();
  });
});
