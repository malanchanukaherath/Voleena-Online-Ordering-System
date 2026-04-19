const express = require('express');

// Code Review: Function createTestApp in server\tests\helpers\createTestApp.js. Used in: server/tests/auth.routes.test.js, server/tests/cart.routes.test.js, server/tests/cashier.routes.test.js.
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