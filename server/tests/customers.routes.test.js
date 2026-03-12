const request = require('supertest');

const mockCustomer = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn()
};

const mockAddress = {
  create: jest.fn(),
  findAll: jest.fn()
};

jest.mock('../models', () => ({ Customer: mockCustomer, Address: mockAddress }));
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../utils/auditLogger', () => ({
  logCustomerCreation: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../services/distanceValidation', () => ({
  geocodeAddress: jest.fn()
}));

const { logCustomerCreation } = require('../utils/auditLogger');
const { geocodeAddress } = require('../services/distanceValidation');
const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/customers');

const app = createTestApp('/api/v1/customers', router);

describe('customer routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('rejects customer creation when unauthenticated', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Jane', phone: '+94770000000' });

    expect(response.status).toBe(401);
  });

  test('rejects customer creation for disallowed roles', async () => {
    setAuthUser({ type: 'Staff', role: 'Kitchen' });

    const response = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Jane', phone: '+94770000000' });

    expect(response.status).toBe(403);
  });

  test('returns the existing customer when a duplicate is found', async () => {
    setAuthUser({ type: 'Staff', role: 'Cashier' });
    mockCustomer.findOne.mockResolvedValue({
      CustomerID: 44,
      Name: 'Existing',
      Phone: '+94770000000',
      Email: 'existing@example.com',
      AccountStatus: 'ACTIVE',
      IsActive: true,
      IsEmailVerified: true,
      IsPhoneVerified: false
    });

    const response = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Existing', phone: '+94770000000', email: 'existing@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.exists).toBe(true);
    expect(logCustomerCreation).toHaveBeenCalled();
  });

  test('creates a new customer and optional address', async () => {
    setAuthUser({ type: 'Staff', role: 'Cashier' });
    mockCustomer.findOne.mockResolvedValueOnce(null);
    mockCustomer.findOne.mockResolvedValueOnce(null);
    mockCustomer.create.mockResolvedValue({
      CustomerID: 77,
      Name: 'New Customer',
      Phone: '+94771112233',
      Email: 'new@example.com',
      AccountStatus: 'ACTIVE',
      IsActive: true
    });
    mockAddress.create.mockResolvedValue({
      AddressID: 91,
      AddressLine1: '10 Main Street',
      City: 'Colombo',
      PostalCode: '10000'
    });

    const response = await request(app)
      .post('/api/v1/customers')
      .send({
        name: 'New Customer',
        phone: '+94771112233',
        email: 'new@example.com',
        address: {
          addressLine1: '10 Main Street',
          city: 'Colombo',
          postalCode: '10000'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.exists).toBe(false);
    expect(mockCustomer.create).toHaveBeenCalled();
    expect(mockAddress.create).toHaveBeenCalled();
  });

  test('returns the logged-in customer profile with addresses', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 5,
      Name: 'Customer Profile',
      addresses: [{ AddressID: 1 }]
    });

    const response = await request(app).get('/api/v1/customers/me');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCustomer.findByPk).toHaveBeenCalledWith(5, expect.any(Object));
  });

  test('validates required address fields before creating an address', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });

    const response = await request(app)
      .post('/api/v1/customers/me/addresses')
      .send({ city: 'Colombo' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
  });

  test('geocodes and stores a customer address when coordinates are missing', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    geocodeAddress.mockResolvedValue({ lat: 6.9271, lng: 79.8612 });
    mockAddress.create.mockResolvedValue({
      AddressID: 51,
      AddressLine1: '15 Test Road',
      City: 'Colombo',
      PostalCode: '10000',
      Latitude: 6.9271,
      Longitude: 79.8612
    });

    const response = await request(app)
      .post('/api/v1/customers/me/addresses')
      .send({
        addressLine1: '15 Test Road',
        city: 'Colombo',
        postalCode: '10000'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(geocodeAddress).toHaveBeenCalled();
    expect(mockAddress.create).toHaveBeenCalledWith(expect.objectContaining({
      CustomerID: 5,
      Latitude: 6.9271,
      Longitude: 79.8612
    }));
  });

  test('returns 404 when updating a missing customer', async () => {
    setAuthUser({ type: 'Staff', role: 'Cashier' });
    mockCustomer.findByPk.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/v1/customers/999')
      .send({ name: 'Updated' });

    expect(response.status).toBe(404);
  });
});