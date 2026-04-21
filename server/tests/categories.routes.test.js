const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_CATEGORIES_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_CATEGORIES_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_CATEGORIES_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');
});
// CODEMAP: BACKEND_SERVER_TESTS_CATEGORIES_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

const mockCategory = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn()
};

jest.mock('../models', () => ({ Category: mockCategory }));
jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../services/uploadService', () => ({
  deleteImageByUrl: jest.fn().mockResolvedValue(undefined)
}));

const { deleteImageByUrl } = require('../services/uploadService');
const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/categories');

const app = createTestApp('/api/v1/categories', router);

describe('category routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('requires authentication to list categories', async () => {
    setAuthMode('unauthorized');

    const response = await request(app).get('/api/v1/categories');

    expect(response.status).toBe(401);
  });

  test('lists categories for authenticated users', async () => {
    mockCategory.findAll.mockResolvedValue([{ CategoryID: 1, Name: 'Rice' }]);

    const response = await request(app).get('/api/v1/categories');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('prevents non-admin users from creating categories', async () => {
    setAuthUser({ type: 'Staff', role: 'Kitchen' });

    const response = await request(app)
      .post('/api/v1/categories')
      .send({ Name: 'Drinks' });

    expect(response.status).toBe(403);
  });

  test('rejects duplicate category names', async () => {
    setAuthUser({ type: 'Staff', role: 'Admin' });
    mockCategory.findOne.mockResolvedValue({ CategoryID: 7, Name: 'Drinks' });

    const response = await request(app)
      .post('/api/v1/categories')
      .send({ Name: 'Drinks' });

    expect(response.status).toBe(409);
  });

  test('creates a new category for admins', async () => {
    setAuthUser({ type: 'Staff', role: 'Admin' });
    mockCategory.findOne.mockResolvedValue(null);
    mockCategory.create.mockResolvedValue({ CategoryID: 3, Name: 'Desserts' });

    const response = await request(app)
      .post('/api/v1/categories')
      .send({ Name: 'Desserts', Description: 'Sweet dishes' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('updates categories and cleans up replaced images', async () => {
    setAuthUser({ type: 'Staff', role: 'Admin' });
    const category = {
      CategoryID: 1,
      Name: 'Rice',
      ImageURL: 'https://old.example/rice.png',
      update: jest.fn().mockResolvedValue(undefined)
    };
    mockCategory.findByPk.mockResolvedValue(category);
    mockCategory.findOne.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/v1/categories/1')
      .send({ ImageURL: 'https://new.example/rice.png' });

    expect(response.status).toBe(200);
    expect(deleteImageByUrl).toHaveBeenCalledWith('https://old.example/rice.png');
  });
});



