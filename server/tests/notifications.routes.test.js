const request = require('supertest');

const mockController = {
  getMyNotifications: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  getUnreadCount: jest.fn((req, res) => res.status(200).json({ success: true, data: { unreadCount: 3 } })),
  markOneAsRead: jest.fn((req, res) => res.status(200).json({ success: true })),
  markAllAsRead: jest.fn((req, res) => res.status(200).json({ success: true }))
};

jest.mock('../controllers/notificationController', () => mockController);
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/notifications');

const app = createTestApp('/api/v1/notifications', router);

describe('notifications routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('rejects unauthenticated requests', async () => {
    setAuthMode('unauthorized');

    const response = await request(app).get('/api/v1/notifications');

    expect(response.status).toBe(401);
  });

  test('allows customers to fetch own notifications', async () => {
    setAuthUser({ id: 55, type: 'Customer', role: 'Customer' });

    const response = await request(app).get('/api/v1/notifications');

    expect(response.status).toBe(200);
    expect(mockController.getMyNotifications).toHaveBeenCalledTimes(1);
  });

  test('returns unread count for authenticated users', async () => {
    const response = await request(app).get('/api/v1/notifications/unread-count');

    expect(response.status).toBe(200);
    expect(response.body.data.unreadCount).toBe(3);
    expect(mockController.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  test('marks one notification as read', async () => {
    const response = await request(app).patch('/api/v1/notifications/101/read').send({});

    expect(response.status).toBe(200);
    expect(mockController.markOneAsRead).toHaveBeenCalledTimes(1);
  });

  test('marks all notifications as read', async () => {
    const response = await request(app).patch('/api/v1/notifications/read-all').send({});

    expect(response.status).toBe(200);
    expect(mockController.markAllAsRead).toHaveBeenCalledTimes(1);
  });
});
