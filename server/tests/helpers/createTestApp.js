const express = require('express');

// CODEMAP: BACKEND_SERVER_TESTS_HELPERS_CREATETESTAPP_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');

// CODEMAP: BACKEND_SERVER_TESTS_HELPERS_CREATETESTAPP_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');

// CODEMAP: BACKEND_SERVER_TESTS_HELPERS_CREATETESTAPP_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');
module.exports = createTestApp;
// CODEMAP: BACKEND_SERVER_TESTS_HELPERS_CREATETESTAPP_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const express = require('express');

// Simple: This creates the test app.
function createTestApp(prefix, router) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(prefix, router);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Unhandled test error'
    });
  });

  return app;
}

module.exports = createTestApp;



