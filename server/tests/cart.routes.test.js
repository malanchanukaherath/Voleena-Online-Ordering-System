const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_CART_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_CART_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

// CODEMAP: BACKEND_SERVER_TESTS_CART_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');
});
// CODEMAP: BACKEND_SERVER_TESTS_CART_ROUTES_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const request = require('supertest');

const mockMenuItem = {
  findByPk: jest.fn()
};

const mockComboPack = {
  findByPk: jest.fn()
};

const mockComboPackItem = {};

const mockDailyStock = {
  findOne: jest.fn()
};

jest.mock('../models', () => ({
  MenuItem: mockMenuItem,
  ComboPack: mockComboPack,
  ComboPackItem: mockComboPackItem,
  DailyStock: mockDailyStock
}));
jest.mock('../utils/validationUtils', () => ({
  validateCartItems: jest.fn()
}));

const { validateCartItems } = require('../utils/validationUtils');
const createTestApp = require('./helpers/createTestApp');
const router = require('../routes/cart');

const app = createTestApp('/api/v1/cart', router);

describe('cart routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns validation errors for malformed cart payloads', async () => {
    validateCartItems.mockReturnValue({
      isValid: false,
      errors: ['items must be an array']
    });

    const response = await request(app)
      .post('/api/v1/cart/validate')
      .send({ items: null });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContain('items must be an array');
  });

  test('reports unavailable stock during cart validation', async () => {
    validateCartItems.mockReturnValue({ isValid: true, errors: [] });
    mockMenuItem.findByPk.mockResolvedValue({
      MenuItemID: 1,
      Name: 'Chicken Kottu',
      Price: 1200,
      IsActive: true
    });
    mockDailyStock.findOne.mockResolvedValue({
      OpeningQuantity: 4,
      SoldQuantity: 4,
      AdjustedQuantity: 0
    });

    const response = await request(app)
      .post('/api/v1/cart/validate')
      .send({ items: [{ menuItemId: 1, quantity: 1 }] });

    expect(response.status).toBe(200);
    expect(response.body.data.isValid).toBe(false);
    expect(response.body.data.errors[0]).toMatch(/Insufficient stock/);
  });

  test('reports combo item stock shortages during cart validation', async () => {
    validateCartItems.mockReturnValue({ isValid: true, errors: [] });
    mockComboPack.findByPk.mockResolvedValue({
      ComboID: 2,
      Name: 'Family Combo',
      Price: 2500,
      IsActive: true,
      items: [
        {
          MenuItemID: 10,
          Quantity: 2,
          menuItem: {
            MenuItemID: 10,
            Name: 'Chicken Kottu',
            IsActive: true
          }
        }
      ]
    });
    mockDailyStock.findOne.mockResolvedValue({
      OpeningQuantity: 3,
      SoldQuantity: 0,
      AdjustedQuantity: 0
    });

    const response = await request(app)
      .post('/api/v1/cart/validate')
      .send({ items: [{ comboId: 2, quantity: 2 }] });

    expect(response.status).toBe(200);
    expect(response.body.data.isValid).toBe(false);
    expect(response.body.data.errors[0]).toMatch(/Insufficient stock for combo/);
    expect(response.body.data.items[0].availability.isAvailable).toBe(false);
  });

  test('returns a valid cart summary for mixed menu and combo items', async () => {
    mockMenuItem.findByPk.mockResolvedValue({ Name: 'Burger', Price: 1000 });
    mockComboPack.findByPk.mockResolvedValue({ Name: 'Family Combo', Price: 2500 });

    const response = await request(app)
      .post('/api/v1/cart/summary')
      .send({
        items: [
          { menuItemId: 1, quantity: 2 },
          { comboId: 2, quantity: 1 }
        ],
        orderType: 'DELIVERY'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.subtotal).toBe(4500);
    expect(response.body.data.deliveryFee).toBe(100);
    expect(response.body.data.total).toBe(4600);
  });

  test('rejects empty cart summary requests', async () => {
    const response = await request(app)
      .post('/api/v1/cart/summary')
      .send({ items: [], orderType: 'TAKEAWAY' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/empty/i);
  });
});



