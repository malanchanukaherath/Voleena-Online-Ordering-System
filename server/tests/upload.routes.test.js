const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_UPLOAD_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_UPLOAD_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_UPLOAD_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');
});
// CODEMAP: BACKEND_SERVER_TESTS_UPLOAD_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

const mockUploadImageFile = jest.fn();

jest.mock('../services/uploadService', () => ({
  uploadImageFile: mockUploadImageFile,
  ALLOWED_FOLDERS: ['menu', 'category', 'profile', 'combo']
}));

jest.mock('../middleware/rateLimiter', () => ({
  uploadLimiter: (req, res, next) => next()
}));

jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));

const { resetAuthState, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/uploadRoutes');

const app = createTestApp('/api/v1/upload', router);
const tinyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

describe('upload routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState();
  });

  test('allows staff image uploads to staff-managed folders', async () => {
    setAuthUser({ id: 1, type: 'Staff', role: 'Admin' });
    mockUploadImageFile.mockResolvedValue({ secureUrl: 'https://example.test/menu.jpg' });

    const response = await request(app)
      .post('/api/v1/upload/image')
      .field('folder', 'menu')
      .attach('image', tinyJpeg, { filename: 'menu.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(201);
    expect(response.body.imageUrl).toBe('https://example.test/menu.jpg');
    expect(mockUploadImageFile).toHaveBeenCalledWith(expect.objectContaining({
      originalname: 'menu.jpg'
    }), 'menu');
  });

  test('rejects customer uploads to staff-managed folders', async () => {
    setAuthUser({ id: 55, type: 'Customer', role: 'Customer' });

    const response = await request(app)
      .post('/api/v1/upload/image')
      .field('folder', 'menu')
      .attach('image', tinyJpeg, { filename: 'menu.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(403);
    expect(mockUploadImageFile).not.toHaveBeenCalled();
  });

  test('keeps customer profile uploads available', async () => {
    setAuthUser({ id: 55, type: 'Customer', role: 'Customer' });
    mockUploadImageFile.mockResolvedValue({ secureUrl: 'https://example.test/profile.jpg' });

    const response = await request(app)
      .post('/api/v1/upload/image')
      .field('folder', 'profile')
      .attach('image', tinyJpeg, { filename: 'profile.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(201);
    expect(mockUploadImageFile).toHaveBeenCalledWith(expect.any(Object), 'profile');
  });

  test('limits customer folder listing to profile uploads', async () => {
    setAuthUser({ id: 55, type: 'Customer', role: 'Customer' });

    const response = await request(app).get('/api/v1/upload/folders');

    expect(response.status).toBe(200);
    expect(response.body.folders).toEqual(['profile']);
  });
});



