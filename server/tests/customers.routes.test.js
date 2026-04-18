const request = require('supertest');
const bcrypt = require('bcryptjs');

const mockCustomer = {
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn()
};

const mockAddress = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn()
};

const mockOTPVerification = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn()
};

jest.mock('../models', () => ({ Customer: mockCustomer, Address: mockAddress, OTPVerification: mockOTPVerification }));
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../middleware/rateLimiter', () => {
  const passThrough = (req, res, next) => next();
  return { otpLimiter: passThrough };
});
jest.mock('../utils/auditLogger', () => ({
  logCustomerCreation: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../services/verificationEmailService', () => ({
  sendEmailVerificationLink: jest.fn().mockResolvedValue({ success: true, provider: 'console' })
}));
jest.mock('../services/smsService', () => ({
  sendOTPSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'sms-test-id' })
}));
jest.mock('../services/distanceValidation', () => ({
  geocodeAddress: jest.fn()
}));

const { logCustomerCreation } = require('../utils/auditLogger');
const { sendEmailVerificationLink } = require('../services/verificationEmailService');
const { sendOTPSMS } = require('../services/smsService');
const { geocodeAddress } = require('../services/distanceValidation');
const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/customers');

const app = createTestApp('/api/v1/customers', router);

describe('customer routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
    mockAddress.count.mockResolvedValue(0);
    mockOTPVerification.update.mockResolvedValue([0]);
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

  test('updates the logged-in customer profile settings', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    const save = jest.fn().mockResolvedValue(undefined);
    const customerRecord = {
      CustomerID: 5,
      Name: 'Old Name',
      Email: 'old@example.com',
      Phone: '+94770000000',
      IsPhoneVerified: true,
      Password: await bcrypt.hash('CurrentPass123', 10),
      PreferredNotification: 'BOTH',
      ProfileImageURL: null,
      save,
      toJSON: jest.fn(function toJSON() {
        return {
          CustomerID: this.CustomerID,
          Name: this.Name,
          Email: this.Email,
          Phone: this.Phone,
          IsPhoneVerified: this.IsPhoneVerified,
          PreferredNotification: this.PreferredNotification
        };
      })
    };

    mockCustomer.findByPk.mockResolvedValue(customerRecord);
    mockCustomer.findOne.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/v1/customers/me')
      .send({
        name: 'Updated Name',
        email: 'old@example.com',
        phone: '+94771112233',
        preferredNotification: 'SMS'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(save).toHaveBeenCalled();
    expect(customerRecord.Name).toBe('Updated Name');
    expect(customerRecord.PreferredNotification).toBe('SMS');
    expect(customerRecord.Email).toBe('old@example.com');
    expect(customerRecord.IsPhoneVerified).toBe(false);
    expect(sendEmailVerificationLink).not.toHaveBeenCalled();
  });

  test('sends phone verification OTP for the logged-in customer', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 5,
      Phone: '+94770000000',
      IsPhoneVerified: false,
      IsActive: true,
      AccountStatus: 'ACTIVE'
    });
    mockOTPVerification.create.mockResolvedValue({ OTPID: 101 });

    const response = await request(app)
      .post('/api/v1/customers/me/phone-verification/request')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockOTPVerification.update).toHaveBeenCalled();
    expect(mockOTPVerification.create).toHaveBeenCalled();
    expect(sendOTPSMS).toHaveBeenCalledWith('+94770000000', expect.any(String), 'PHONE_VERIFICATION');
  });

  test('verifies profile phone using OTP', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    const save = jest.fn().mockResolvedValue(undefined);

    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 5,
      Phone: '+94770000000',
      IsPhoneVerified: false,
      IsActive: true,
      AccountStatus: 'ACTIVE',
      save
    });
    mockOTPVerification.findOne.mockResolvedValue({ OTPID: 333 });

    const response = await request(app)
      .post('/api/v1/customers/me/phone-verification/verify')
      .send({ otp: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockOTPVerification.findOne).toHaveBeenCalled();
    expect(mockOTPVerification.update).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });

  test('rejects email change when current password is missing', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });

    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 5,
      Name: 'Old Name',
      Email: 'old@example.com',
      Phone: '+94770000000',
      PreferredNotification: 'BOTH',
      Password: await bcrypt.hash('CurrentPass123', 10),
      save: jest.fn(),
      toJSON: jest.fn()
    });
    mockCustomer.findOne.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/v1/customers/me')
      .send({
        name: 'Updated Name',
        email: 'new@example.com',
        phone: '+94771112233',
        preferredNotification: 'SMS'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Current password is required/i);
    expect(sendEmailVerificationLink).not.toHaveBeenCalled();
  });

  test('requests email verification when changing customer email', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    const save = jest.fn().mockResolvedValue(undefined);

    const customerRecord = {
      CustomerID: 5,
      Name: 'Old Name',
      Email: 'old@example.com',
      Phone: '+94770000000',
      PreferredNotification: 'BOTH',
      Password: await bcrypt.hash('CurrentPass123', 10),
      save,
      toJSON: jest.fn(function toJSON() {
        return {
          CustomerID: this.CustomerID,
          Name: this.Name,
          Email: this.Email,
          Phone: this.Phone,
          PreferredNotification: this.PreferredNotification
        };
      })
    };

    mockCustomer.findByPk.mockResolvedValue(customerRecord);
    mockCustomer.findOne.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/v1/customers/me')
      .send({
        name: 'Updated Name',
        email: 'new@example.com',
        phone: '+94771112233',
        preferredNotification: 'SMS',
        currentPassword: 'CurrentPass123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.emailChangePending).toBe(true);
    expect(response.body.pendingEmail).toBe('new@example.com');
    expect(customerRecord.Email).toBe('old@example.com');
    expect(save).toHaveBeenCalled();
    expect(sendEmailVerificationLink).toHaveBeenCalledWith(
      'new@example.com',
      'Updated Name',
      expect.stringContaining('/verify-email?token=')
    );
  });

  test('rejects profile update when email belongs to another customer', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockCustomer.findByPk.mockResolvedValue({ CustomerID: 5 });
    mockCustomer.findOne.mockResolvedValue({ CustomerID: 9, Email: 'taken@example.com', Phone: '+94771112233' });

    const response = await request(app)
      .put('/api/v1/customers/me')
      .send({
        name: 'Updated Name',
        email: 'taken@example.com',
        phone: '+94771112233',
        preferredNotification: 'BOTH'
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/Email is already used/i);
  });

  test('changes password for the logged-in customer', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    const save = jest.fn().mockResolvedValue(undefined);
    const customerRecord = {
      CustomerID: 5,
      Password: await bcrypt.hash('CurrentPass123', 10),
      save
    };

    mockCustomer.findByPk.mockResolvedValue(customerRecord);

    const response = await request(app)
      .put('/api/v1/customers/me/password')
      .send({
        currentPassword: 'CurrentPass123',
        newPassword: 'NewSecret123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(customerRecord.Password).toBe('NewSecret123');
    expect(save).toHaveBeenCalled();
  });

  test('rejects password change with incorrect current password', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockCustomer.findByPk.mockResolvedValue({
      CustomerID: 5,
      Password: await bcrypt.hash('CurrentPass123', 10),
      save: jest.fn()
    });

    const response = await request(app)
      .put('/api/v1/customers/me/password')
      .send({
        currentPassword: 'WrongPass123',
        newPassword: 'NewSecret123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/incorrect/i);
  });

  test('validates required address fields before creating an address', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });

    const response = await request(app)
      .post('/api/v1/customers/me/addresses')
      .send({ city: 'Colombo' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
  });

  test('stores customer address without auto-geocoding when coordinates are missing', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockAddress.create.mockResolvedValue({
      AddressID: 51,
      AddressLine1: '15 Test Road',
      City: 'Colombo',
      PostalCode: '10000',
      Latitude: null,
      Longitude: null
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
    expect(geocodeAddress).not.toHaveBeenCalled();
    expect(mockAddress.create).toHaveBeenCalledWith(expect.objectContaining({
      CustomerID: 5,
      Latitude: null,
      Longitude: null
    }));
  });

  test('rejects address creation when customer already has maximum saved addresses', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockAddress.count.mockResolvedValue(3);

    const response = await request(app)
      .post('/api/v1/customers/me/addresses')
      .send({
        addressLine1: '11 Maximum Street',
        city: 'Gampaha'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Maximum 3 saved addresses/i);
  });

  test('rejects deleting the last remaining saved address', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    mockAddress.count.mockResolvedValue(1);

    const response = await request(app)
      .delete('/api/v1/customers/me/addresses/51');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/At least one saved address is required/i);
  });

  test('updates customer owned address without persisting coordinates', async () => {
    setAuthUser({ id: 5, type: 'Customer', role: 'Customer' });
    const save = jest.fn().mockResolvedValue(undefined);
    mockAddress.findOne.mockResolvedValue({
      AddressID: 51,
      CustomerID: 5,
      AddressLine1: 'Old Road',
      AddressLine2: null,
      City: 'Colombo',
      PostalCode: null,
      District: null,
      Latitude: 6.9,
      Longitude: 79.8,
      save
    });

    const response = await request(app)
      .put('/api/v1/customers/me/addresses/51')
      .send({
        addressLine1: '22 Updated Lane',
        city: 'Kadawatha',
        latitude: 7.1,
        longitude: 80.0
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(save).toHaveBeenCalled();
    expect(response.body.address.latitude).toBeNull();
    expect(response.body.address.longitude).toBeNull();
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