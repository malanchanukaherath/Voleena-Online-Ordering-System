# API Test Plan And Audit

## Automated Test Implementation

The current Jest + Supertest suite covers:
- Auth flows in server/tests/auth.routes.test.js
- Customer and address flows in server/tests/customers.routes.test.js
- Cart validation and summary in server/tests/cart.routes.test.js
- Order create/list/confirm/cancel flows in server/tests/orders.routes.test.js
- Payment initiation and webhook validation in server/tests/payments.routes.test.js
- Delivery fee, distance, location, and availability flows in server/tests/delivery.routes.test.js
- Category route validation and side effects in server/tests/categories.routes.test.js
- Contract coverage for the remaining mounted route surface in server/tests/route-contracts.test.js

## Single Command Execution

- Workspace root: npm test
- Server direct: npm --prefix server test

## Test Strategy

- Route-contract coverage guarantees the mounted API surface remains reachable with the expected authorization gates.
- Behavior-focused tests target the highest-risk stateful flows: auth, customers, ordering, delivery, and payments.
- Database side effects are verified through model and service mocks so the suite stays deterministic and fast in CI.
- Public lookup endpoints are exercised separately from authenticated role-based endpoints.

## Simulated User Flow Coverage

- User registration
- Email verification failure handling
- Customer login
- Token verification and logout
- Customer address creation
- Cart validation and summary
- Order creation
- Order confirmation and cancellation
- Payment initiation and webhook validation
- Delivery fee calculation and location lookup
- Category CRUD and image cleanup side effects

## Audit Findings

| Severity | Status | Finding | Files |
| --- | --- | --- | --- |
| High | Fixed | Delivery location lookup was effectively inaccessible to customers because the route was behind delivery-role middleware only. | server/routes/deliveryRoutes.js, server/controllers/deliveryController.js |
| Medium | Fixed | Several routes executed authentication twice by combining authenticateToken with convenience middleware that already includes it. | server/routes/adminRoutes.js, cashierRoutes.js, customers.js, deliveryRoutes.js, kitchenRoutes.js, orders.js, payments.js, staff.js |
| Medium | Fixed | Public delivery lookup endpoints had no dedicated rate limiting and could be abused for repeated geocoding and fee requests. | server/middleware/rateLimiter.js, server/routes/deliveryRoutes.js |
| Medium | Fixed | The server boot path always started listeners on require(), which blocked reliable Jest and Supertest use. | server/index.js |
| Medium | Open | Response shapes remain inconsistent across controllers. Some endpoints return success/data, others only error/message. | server/controllers/*, server/routes/categories.js, server/routes/customers.js, server/routes/staff.js |
| Low | Open | server/routes/Auth.js is an orphaned legacy route module that is not mounted by the application. | server/routes/Auth.js |
| Low | Open | Stock-related services still contain loop-driven database access patterns that merit batching to avoid N+1 queries at scale. | server/services/stockService.js, server/services/automatedJobs.js |

## Recommended Next Refactors

- Standardize all API responses to a single envelope: success, data, message, error.
- Remove or archive server/routes/Auth.js to eliminate dead legacy auth code.
- Batch stock and automated job queries to reduce loop-driven database access under load.
- Add dedicated controller-level tests for admin, cashier, kitchen, stock, upload, menu item, and combo pack business logic once response formats are standardized.
