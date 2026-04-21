const request = require('supertest');

const mockDelivery = {
  count: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn()
};

const mockOrder = {
  findByPk: jest.fn(),
  update: jest.fn()
};

const mockOrderItem = {};
const mockMenuItem = {};
const mockAddress = {};
const mockCustomer = {};
const mockStaff = {};
const mockOrderStatusHistory = {
  create: jest.fn()
};
const mockDeliveryStaffAvailability = {
  findAll: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
};
const mockSequelize = {
  Sequelize: { Op: { in: Symbol('in'), gte: Symbol('gte') } },
  literal: jest.fn((value) => value),
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn()
  })
};

jest.mock('../models', () => ({
  Delivery: mockDelivery,
  Order: mockOrder,
  OrderItem: mockOrderItem,
  MenuItem: mockMenuItem,
  Address: mockAddress,
  Customer: mockCustomer,
  Staff: mockStaff,
  DeliveryStaffAvailability: mockDeliveryStaffAvailability,
  OrderStatusHistory: mockOrderStatusHistory,
  sequelize: mockSequelize
}));
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../middleware/rateLimiter', () => ({
  publicLookupLimiter: (req, res, next) => next()
}));
jest.mock('../utils/distanceValidator', () => ({
  validateDeliveryDistanceWithFallback: jest.fn(),
  geocodeAddress: jest.fn()
}));
jest.mock('../utils/validationUtils', () => ({
  validateAddressLine: jest.fn((value) => Boolean(value && value.length >= 5)),
  validateCoordinates: jest.fn((lat, lng) => Number(lat) >= -90 && Number(lat) <= 90 && Number(lng) >= -180 && Number(lng) <= 180)
}));
jest.mock('../utils/deliveryFeeCalculator', () => ({
  calculateDeliveryFee: jest.fn((distanceKm) => ({
    baseFee: 100,
    distanceFee: distanceKm > 2 ? 50 : 0,
    totalFee: distanceKm > 2 ? 150 : 100,
    breakdown: 'mock breakdown',
    isFreeRange: false,
    isCapped: false
  })),
  getDeliveryFeeConfig: jest.fn(() => ({
    baseFee: 100,
    freeDeliveryDistance: 2,
    feePerKm: 50,
    maxFee: 400
  })),
  estimateDeliveryFee: jest.fn()
}));

const { validateDeliveryDistanceWithFallback, geocodeAddress } = require('../utils/distanceValidator');
const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/deliveryRoutes');

const app = createTestApp('/api/v1/delivery', router);

describe('delivery routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('validates required address content on public distance checks', async () => {
    const response = await request(app)
      .post('/api/v1/delivery/validate-distance')
      .send({ address: { addressLine1: '123', city: 'Colombo' } });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Address line/);
  });

  test('geocodes an address and returns delivery validation details', async () => {
    geocodeAddress.mockResolvedValue({ lat: 6.9, lng: 79.8, method: 'mock' });
    validateDeliveryDistanceWithFallback.mockResolvedValue({ isValid: true, distance: 3.1, maxDistance: 8 });

    const response = await request(app)
      .post('/api/v1/delivery/validate-distance')
      .send({ address: { addressLine1: '25 Flower Road', city: 'Colombo' } });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.distance).toBe(3.1);
  });

  test('calculates delivery fees for public checkout requests', async () => {
    const response = await request(app)
      .post('/api/v1/delivery/calculate-fee')
      .send({ distanceKm: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data.totalFee).toBe(150);
  });

  test('rejects invalid fee calculation inputs', async () => {
    const response = await request(app)
      .post('/api/v1/delivery/calculate-fee')
      .send({ distanceKm: -1 });

    expect(response.status).toBe(400);
  });

  test('returns delivery fee configuration publicly', async () => {
    const response = await request(app).get('/api/v1/delivery/fee-config');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.baseFee).toBe(100);
  });

  test('allows an authenticated customer to read their delivery location', async () => {
    setAuthUser({ id: 55, type: 'Customer', role: 'Customer' });
    mockDelivery.findOne.mockResolvedValue({
      DeliveryID: 7,
      CurrentLatitude: 6.9,
      CurrentLongitude: 79.8,
      LastLocationUpdate: new Date().toISOString(),
      Status: 'IN_TRANSIT',
      DeliveryStaffID: 12,
      order: { CustomerID: 55, OrderType: 'DELIVERY' }
    });

    const response = await request(app)
      .get('/api/v1/delivery/deliveries/7/location');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deliveryId).toBe(7);
  });

  test('rejects delivery location access for unrelated users', async () => {
    setAuthUser({ id: 77, type: 'Customer', role: 'Customer' });
    mockDelivery.findOne.mockResolvedValue({
      DeliveryID: 7,
      CurrentLatitude: 6.9,
      CurrentLongitude: 79.8,
      LastLocationUpdate: new Date().toISOString(),
      Status: 'IN_TRANSIT',
      DeliveryStaffID: 12,
      order: { CustomerID: 55, OrderType: 'DELIVERY' }
    });

    const response = await request(app)
      .get('/api/v1/delivery/deliveries/7/location');

    expect(response.status).toBe(403);
  });

  test('rejects staff users whose ID only matches the customer ID', async () => {
    setAuthUser({ id: 55, type: 'Staff', role: 'Delivery' });
    mockDelivery.findOne.mockResolvedValue({
      DeliveryID: 7,
      CurrentLatitude: 6.9,
      CurrentLongitude: 79.8,
      LastLocationUpdate: new Date().toISOString(),
      Status: 'IN_TRANSIT',
      DeliveryStaffID: 12,
      order: { CustomerID: 55, OrderType: 'DELIVERY' }
    });

    const response = await request(app)
      .get('/api/v1/delivery/deliveries/7/location');

    expect(response.status).toBe(403);
  });

  test('rejects customers whose ID only matches the delivery staff ID', async () => {
    setAuthUser({ id: 12, type: 'Customer', role: 'Customer' });
    mockDelivery.findOne.mockResolvedValue({
      DeliveryID: 7,
      CurrentLatitude: 6.9,
      CurrentLongitude: 79.8,
      LastLocationUpdate: new Date().toISOString(),
      Status: 'IN_TRANSIT',
      DeliveryStaffID: 12,
      order: { CustomerID: 55, OrderType: 'DELIVERY' }
    });

    const response = await request(app)
      .get('/api/v1/delivery/deliveries/7/location');

    expect(response.status).toBe(403);
  });

  test('allows the assigned delivery staff to read their delivery location', async () => {
    setAuthUser({ id: 12, type: 'Staff', role: 'Delivery' });
    mockDelivery.findOne.mockResolvedValue({
      DeliveryID: 7,
      CurrentLatitude: 6.9,
      CurrentLongitude: 79.8,
      LastLocationUpdate: new Date().toISOString(),
      Status: 'IN_TRANSIT',
      DeliveryStaffID: 12,
      order: { CustomerID: 55, OrderType: 'DELIVERY' }
    });

    const response = await request(app)
      .get('/api/v1/delivery/deliveries/7/location');

    expect(response.status).toBe(200);
  });

  test('returns conflict when customer delivery person is not assigned yet', async () => {
    setAuthUser({ id: 55, type: 'Customer', role: 'Customer' });
    mockDelivery.findOne.mockResolvedValue({
      DeliveryID: 9,
      CurrentLatitude: null,
      CurrentLongitude: null,
      LastLocationUpdate: null,
      Status: 'PENDING',
      DeliveryStaffID: null,
      order: { CustomerID: 55, OrderType: 'DELIVERY' }
    });

    const response = await request(app)
      .get('/api/v1/delivery/deliveries/9/location');

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/not been assigned/i);
  });

  test('protects delivery dashboard routes', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .get('/api/v1/delivery/dashboard/stats');

    expect(response.status).toBe(401);
  });

  test('restricts available-staff lookups to admins', async () => {
    setAuthUser({ id: 12, type: 'Staff', role: 'Delivery' });

    const response = await request(app)
      .get('/api/v1/delivery/staff/available');

    expect(response.status).toBe(403);
  });

  test('updates staff availability and persists the side effect', async () => {
    setAuthUser({ id: 12, type: 'Staff', role: 'Delivery' });
    mockDeliveryStaffAvailability.upsert.mockResolvedValue([{ DeliveryStaffID: 12, IsAvailable: false }, false]);

    const response = await request(app)
      .put('/api/v1/delivery/availability')
      .send({ isAvailable: false });

    expect(response.status).toBe(200);
    expect(mockDeliveryStaffAvailability.upsert).toHaveBeenCalledWith(expect.objectContaining({
      DeliveryStaffID: 12,
      IsAvailable: false
    }), expect.any(Object));
  });

  test('accepts explicit numeric coordinates including zero values', async () => {
    validateDeliveryDistanceWithFallback.mockResolvedValue({ isValid: true, distance: 0, maxDistance: 8 });

    const response = await request(app)
      .post('/api/v1/delivery/validate-distance')
      .send({ latitude: 0, longitude: 0 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  test('does not overwrite ETA when delivery is marked delivered', async () => {
    setAuthUser({ id: 12, type: 'Staff', role: 'Delivery' });

    const deliveryRecord = {
      DeliveryID: 99,
      DeliveryStaffID: 12,
      OrderID: 777,
      Status: 'IN_TRANSIT',
      DistanceKm: 5,
      update: jest.fn().mockResolvedValue(true)
    };

    mockDelivery.findByPk.mockResolvedValue(deliveryRecord);
    mockOrder.findByPk.mockResolvedValue({ OrderID: 777, Status: 'OUT_FOR_DELIVERY' });
    mockOrder.update.mockResolvedValue([1]);
    mockDeliveryStaffAvailability.update.mockResolvedValue([1]);
    mockOrderStatusHistory.create.mockResolvedValue({});

    const response = await request(app)
      .put('/api/v1/delivery/deliveries/99/status')
      .send({ status: 'DELIVERED' });

    expect(response.status).toBe(200);
    const updatePayload = deliveryRecord.update.mock.calls[0][0];
    expect(updatePayload.EstimatedDeliveryTime).toBeUndefined();
    expect(updatePayload.DeliveredAt).toBeDefined();
  });
});



