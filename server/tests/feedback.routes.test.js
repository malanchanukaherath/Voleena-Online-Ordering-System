const request = require('supertest');

const mockFeedback = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
};

const mockOrder = {
  findOne: jest.fn()
};

const mockCustomer = {};
const mockStaff = {};

jest.mock('../models', () => ({
  Feedback: mockFeedback,
  Order: mockOrder,
  Customer: mockCustomer,
  Staff: mockStaff
}));

jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/feedback');

const app = createTestApp('/api/v1/feedback', router);

describe('feedback routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('rejects feedback submission when unauthenticated', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .post('/api/v1/feedback')
      .send({ rating: 5, feedbackType: 'GENERAL', comment: 'Great service' });

    expect(response.status).toBe(401);
  });

  test('allows customer to submit feedback for own order', async () => {
    setAuthUser({ id: 2, type: 'Customer', role: 'Customer' });

    mockOrder.findOne.mockResolvedValue({ OrderID: 11, CustomerID: 2 });
    mockFeedback.findOne.mockResolvedValue(null);
    mockFeedback.create.mockResolvedValue({
      FeedbackID: 91,
      CustomerID: 2,
      OrderID: 11,
      Rating: 4,
      Comment: 'Very good order',
      FeedbackType: 'ORDER'
    });

    const response = await request(app)
      .post('/api/v1/feedback')
      .send({
        orderId: 11,
        rating: 4,
        feedbackType: 'ORDER',
        comment: 'Very good order'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockOrder.findOne).toHaveBeenCalledWith({ where: { CustomerID: 2, OrderID: 11 } });
    expect(mockFeedback.create).toHaveBeenCalledWith(expect.objectContaining({
      CustomerID: 2,
      OrderID: 11,
      Rating: 4,
      FeedbackType: 'ORDER'
    }));
  });

  test('rejects feedback submission when order does not belong to customer', async () => {
    setAuthUser({ id: 2, type: 'Customer', role: 'Customer' });
    mockOrder.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/v1/feedback')
      .send({
        orderNumber: 'VF2604050001',
        rating: 4,
        feedbackType: 'ORDER',
        comment: 'Nice'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Order not found for this customer/i);
  });

  test('rejects duplicate feedback for same customer, order and type', async () => {
    setAuthUser({ id: 2, type: 'Customer', role: 'Customer' });

    mockOrder.findOne.mockResolvedValue({ OrderID: 11, CustomerID: 2 });
    mockFeedback.findOne.mockResolvedValue({ FeedbackID: 10 });

    const response = await request(app)
      .post('/api/v1/feedback')
      .send({
        orderId: 11,
        rating: 5,
        feedbackType: 'ORDER',
        comment: 'Excellent'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already submitted/i);
  });

  test('returns customer feedback list for the authenticated customer only', async () => {
    setAuthUser({ id: 7, type: 'Customer', role: 'Customer' });

    mockFeedback.findAll.mockResolvedValue([
      { FeedbackID: 1, CustomerID: 7, Rating: 5 },
      { FeedbackID: 2, CustomerID: 7, Rating: 4 }
    ]);

    const response = await request(app).get('/api/v1/feedback/me');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockFeedback.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { CustomerID: 7 }
    }));
  });

  test('allows admin to list feedback with type filter', async () => {
    setAuthUser({ id: 1, type: 'Staff', role: 'Admin' });
    mockFeedback.findAll.mockResolvedValue([{ FeedbackID: 77, FeedbackType: 'DELIVERY' }]);

    const response = await request(app).get('/api/v1/feedback/admin?type=DELIVERY');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockFeedback.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { FeedbackType: 'DELIVERY' }
    }));
  });

  test('rejects non-admin access to admin feedback list', async () => {
    setAuthUser({ id: 2, type: 'Customer', role: 'Customer' });

    const response = await request(app).get('/api/v1/feedback/admin');

    expect(response.status).toBe(403);
  });

  test('allows admin to respond to feedback', async () => {
    setAuthUser({ id: 1, type: 'Staff', role: 'Admin' });

    const save = jest.fn().mockResolvedValue(undefined);
    mockFeedback.findByPk
      .mockResolvedValueOnce({
        FeedbackID: 30,
        AdminResponse: null,
        RespondedAt: null,
        RespondedBy: null,
        save
      })
      .mockResolvedValueOnce({
        FeedbackID: 30,
        AdminResponse: 'Thanks for your feedback',
        RespondedBy: 1
      });

    const response = await request(app)
      .patch('/api/v1/feedback/30/respond')
      .send({ response: 'Thanks for your feedback' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(save).toHaveBeenCalled();
  });

  test('rejects empty admin response', async () => {
    setAuthUser({ id: 1, type: 'Staff', role: 'Admin' });

    const response = await request(app)
      .patch('/api/v1/feedback/30/respond')
      .send({ response: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Response is required/i);
  });

  test('returns 404 when admin responds to missing feedback', async () => {
    setAuthUser({ id: 1, type: 'Staff', role: 'Admin' });
    mockFeedback.findByPk.mockResolvedValue(null);

    const response = await request(app)
      .patch('/api/v1/feedback/999/respond')
      .send({ response: 'Follow-up' });

    expect(response.status).toBe(404);
  });
});
