const request = require('supertest');

const mockService = {
  createRequest: jest.fn(),
  listRequests: jest.fn(),
  getRequestById: jest.fn(),
  updateStatus: jest.fn()
};

jest.mock('../services/preorderRequestService', () => mockService);
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/preorderRequests');

const app = createTestApp('/api/v1/preorder-requests', router);

describe('preorder request routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('customer can create preorder request', async () => {
    setAuthUser({ id: 22, type: 'Customer', role: 'Customer' });
    mockService.createRequest.mockResolvedValue({ PreorderRequestID: 1, Status: 'SUBMITTED' });

    const response = await request(app)
      .post('/api/v1/preorder-requests')
      .send({
        contactName: 'Test Customer',
        contactPhone: '+94770000000',
        contactEmail: 'customer@test.com',
        requestedFor: new Date(Date.now() + 3600000).toISOString(),
        requestDetails: 'Need a large event order'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockService.createRequest).toHaveBeenCalledWith(22, expect.objectContaining({
      contactName: 'Test Customer'
    }));
  });

  test('preorder request creation requires authentication', async () => {
    setAuthMode('unauthorized');

    const response = await request(app)
      .post('/api/v1/preorder-requests')
      .send({});

    expect(response.status).toBe(401);
  });

  test('admin can list all preorder requests', async () => {
    setAuthUser({ id: 3, type: 'Staff', role: 'Admin' });
    mockService.listRequests.mockResolvedValue([{ PreorderRequestID: 1 }]);

    const response = await request(app).get('/api/v1/preorder-requests');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockService.listRequests).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({ id: 3, role: 'Admin' })
    }));
  });

  test('customer can only read owned preorder request details', async () => {
    setAuthUser({ id: 8, type: 'Customer', role: 'Customer' });
    mockService.getRequestById.mockResolvedValue({ PreorderRequestID: 99, CustomerID: 8 });

    const response = await request(app).get('/api/v1/preorder-requests/99');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('customer is blocked from reading another customer preorder request', async () => {
    setAuthUser({ id: 8, type: 'Customer', role: 'Customer' });
    mockService.getRequestById.mockResolvedValue({ PreorderRequestID: 99, CustomerID: 12 });

    const response = await request(app).get('/api/v1/preorder-requests/99');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test('admin can approve preorder request', async () => {
    setAuthUser({ id: 5, type: 'Staff', role: 'Admin' });
    mockService.updateStatus.mockResolvedValue({ PreorderRequestID: 3, Status: 'APPROVED' });

    const response = await request(app)
      .patch('/api/v1/preorder-requests/3/status')
      .send({ status: 'APPROVED', adminNotes: 'Looks good' });

    expect(response.status).toBe(200);
    expect(mockService.updateStatus).toHaveBeenCalledWith('3', expect.objectContaining({
      status: 'APPROVED',
      adminNotes: 'Looks good'
    }), 5);
  });

  test('admin rejection requires reason', async () => {
    setAuthUser({ id: 5, type: 'Staff', role: 'Admin' });
    mockService.updateStatus.mockRejectedValue(new Error('Rejected reason is required'));

    const response = await request(app)
      .patch('/api/v1/preorder-requests/3/status')
      .send({ status: 'REJECTED' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/reason/i);
  });
});
