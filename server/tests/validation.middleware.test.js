const express = require('express');

// CODEMAP: BACKEND_SERVER_TESTS_VALIDATION_MIDDLEWARE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');

// CODEMAP: BACKEND_SERVER_TESTS_VALIDATION_MIDDLEWARE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');

// CODEMAP: BACKEND_SERVER_TESTS_VALIDATION_MIDDLEWARE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');
});
// CODEMAP: BACKEND_SERVER_TESTS_VALIDATION_MIDDLEWARE_TEST_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');
const request = require('supertest');

const { validateCustomerRegistration } = require('../middleware/validation');

describe('validation middleware', () => {
  test('does not echo raw submitted values in validation error details', async () => {
    const app = express();
    app.use(express.json());
    app.post('/register', validateCustomerRegistration, (req, res) => {
      res.json({ success: true });
    });

    const response = await request(app)
      .post('/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        phone: 'not-a-phone',
        password: 'LeakyPassword123'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: expect.any(String),
          message: expect.any(String)
        })
      ])
    );
    expect(response.body.details.every((detail) => !Object.prototype.hasOwnProperty.call(detail, 'value'))).toBe(true);

    const serializedBody = JSON.stringify(response.body);
    expect(serializedBody).not.toContain('not-a-phone');
    expect(serializedBody).not.toContain('LeakyPassword123');
  });
});



