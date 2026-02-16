# Technical Audit Report (Voleena Online Ordering System)

## 1. Business Requirement Compliance Analysis

FR01 - Customer account signup/signin: ⚠️ Partially implemented. DB has customer accounts, backend only exposes login in v1 and frontend register/login routes call non-existent endpoints; registration API is not mounted in v1 and frontend calls /auth/register instead of /api/v1/auth. See [server/routes/authRoutes.js](server/routes/authRoutes.js), [server/routes/Auth.js](server/routes/Auth.js), [client/src/services/authService.js](client/src/services/authService.js), [client/src/services/backendApi.js](client/src/services/backendApi.js).

FR02 - Admin/Cashier manual customer registration: ⚠️ Partially implemented. Backend endpoints exist but frontend calls non-versioned paths and some UI flows are mock. See [server/routes/customers.js](server/routes/customers.js), [server/routes/cashierRoutes.js](server/routes/cashierRoutes.js), [client/src/services/staffCustomerApi.js](client/src/services/staffCustomerApi.js).

FR03 - Admin creates staff accounts with roles: ⚠️ Partially implemented. Backend admin/staff endpoints exist; frontend calls non-versioned paths. See [server/routes/adminRoutes.js](server/routes/adminRoutes.js), [server/routes/staff.js](server/routes/staff.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js), [client/src/services/staffCustomerApi.js](client/src/services/staffCustomerApi.js).

FR04 - Customer profile update (name/phone/address/photo): ❌ Missing. No customer self-service API; frontend profile is localStorage only. See [client/src/pages/Profile.jsx](client/src/pages/Profile.jsx), [server/routes/customers.js](server/routes/customers.js).

FR05 - Cashier updates limited customer details: ⚠️ Partially implemented. Backend supports, frontend path mismatch. See [server/controllers/cashierController.js](server/controllers/cashierController.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js).

FR06 - Admin manages customer profiles, status, reset password, notes, dedupe, order history: ❌ Missing. No admin endpoints for notes, password reset, dedupe, or account status workflow beyond simple updates. See [server/controllers/adminController.js](server/controllers/adminController.js), [server/routes/customers.js](server/routes/customers.js).

FR07 - Customers browse menu and combo packs: ⚠️ Partially implemented. Menu loads via API but expects wrong fields; combo packs are localStorage-only. See [client/src/pages/Menu.jsx](client/src/pages/Menu.jsx), [server/routes/menuItems.js](server/routes/menuItems.js), [server/routes/comboPacks.js](server/routes/comboPacks.js).

FR08 - Customers place orders: ⚠️ Partially implemented. Backend order creation exists; frontend checkout/cart are mock and do not call API. See [server/controllers/orderController.js](server/controllers/orderController.js), [client/src/pages/Cart.jsx](client/src/pages/Cart.jsx), [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx).

FR09 - Delivery distance validation via Google Maps <= 15km: ❌ Missing in active flow. Validation exists in service but not used by orderController; frontend uses random mock. See [server/services/distanceValidation.js](server/services/distanceValidation.js), [server/services/orderService.js](server/services/orderService.js), [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx).

FR10 - Role-based order visibility: ⚠️ Partially implemented. Dedicated staff endpoints exist, but orderController role checks are incorrect and customers can see more than their own orders. See [server/controllers/orderController.js](server/controllers/orderController.js), [server/routes/orders.js](server/routes/orders.js).

FR11 - Admin/Cashier accept or reject orders before prep: ⚠️ Partially implemented. Backend endpoints exist, UI is mock or mismatched. See [server/controllers/cashierController.js](server/controllers/cashierController.js), [server/routes/orders.js](server/routes/orders.js), [client/src/pages/CashierOrders.jsx](client/src/pages/CashierOrders.jsx).

FR12 - Kitchen updates order status to Preparing/Ready: ⚠️ Partially implemented. Backend supports; frontend uses dashboard service but path mismatch. See [server/controllers/kitchenController.js](server/controllers/kitchenController.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js).

FR13 - Delivery staff updates Out for Delivery/Delivered: ⚠️ Partially implemented. Backend supports; frontend uses dashboard service but path mismatch. See [server/controllers/deliveryController.js](server/controllers/deliveryController.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js).

FR14 - Admin cancel any stage, cashier cancel before prep: ⚠️ Partially implemented. Cancel rules incomplete and role checks are inconsistent. See [server/controllers/orderController.js](server/controllers/orderController.js), [server/controllers/cashierController.js](server/controllers/cashierController.js).

FR15 - Email notifications for confirmation and status updates: ⚠️ Partially implemented. Notification services exist, but active order flow does not call them and email service has schema/field mismatches. See [server/services/orderService.js](server/services/orderService.js), [server/services/emailService.js](server/services/emailService.js).

FR16 - Admin reports (monthly sales, best-selling items): ⚠️ Partially implemented. Backend has reports; frontend path mismatch. See [server/controllers/adminController.js](server/controllers/adminController.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js).

FR17 - Admin manage combo pack promotions with scheduling: ⚠️ Partially implemented. Backend CRUD exists; frontend uses local-only state. See [server/controllers/comboPackController.js](server/controllers/comboPackController.js), [client/src/pages/ComboManagement.jsx](client/src/pages/ComboManagement.jsx).

FR18 - Auto calculate combo pack prices from discounts: ❌ Missing. No backend or frontend logic to compute price from discount against item totals. See [server/controllers/comboPackController.js](server/controllers/comboPackController.js), [client/src/pages/ComboManagement.jsx](client/src/pages/ComboManagement.jsx).

FR19 - Auto enable/disable combos by date: ⚠️ Partially implemented. Job exists but is disabled in server startup. See [server/services/automatedJobs.js](server/services/automatedJobs.js), [server/index.js](server/index.js).

FR20 - Customer cancel before preparation: ⚠️ Partially implemented. Backend allows cancel in PENDING/CONFIRMED; frontend cancellation is mock-only. See [server/controllers/orderController.js](server/controllers/orderController.js), [client/src/pages/OrderTracking.jsx](client/src/pages/OrderTracking.jsx).

FR21 - Automatic refunds for prepaid cancellations: ❌ Missing. Refund logic exists in non-wired services; no live flow. See [server/services/orderService.js](server/services/orderService.js), [server/utils/paymentService.js](server/utils/paymentService.js).

FR22 - Daily_Stock and prevent over-ordering: ⚠️ Partially implemented. Validation exists but is not concurrency-safe in active controller and is not surfaced to UI. See [server/controllers/orderController.js](server/controllers/orderController.js), [server/controllers/kitchenController.js](server/controllers/kitchenController.js).

FR23 - Admin/Kitchen update Daily_Stock via UI: ⚠️ Partially implemented. Backend endpoints exist; frontend stock UI is mock. See [server/routes/stock.js](server/routes/stock.js), [server/routes/kitchenRoutes.js](server/routes/kitchenRoutes.js), [client/src/pages/StockManagement.jsx](client/src/pages/StockManagement.jsx).

FR24 - Validate item availability at checkout and block order: ⚠️ Partially implemented. Backend validation exists; frontend is mock. See [server/controllers/orderController.js](server/controllers/orderController.js), [client/src/pages/Cart.jsx](client/src/pages/Cart.jsx).

FR25 - Auto disable menu items at zero stock: ⚠️ Partially implemented. Job exists but disabled; no DB trigger. See [server/services/automatedJobs.js](server/services/automatedJobs.js).

FR26 - Auto assign delivery staff if available: ❌ Missing. No auto-assignment logic; only manual assignment. See [server/controllers/adminController.js](server/controllers/adminController.js), [server/controllers/deliveryController.js](server/controllers/deliveryController.js).

FR27 - Password reset via email/SMS verification: ⚠️ Partially implemented. OTP reset endpoints exist but do not send OTP and reset is not linked to a stored token. See [server/controllers/authController.js](server/controllers/authController.js), [client/src/pages/ForgotPassword.jsx](client/src/pages/ForgotPassword.jsx).

FR28 - OTP verification for new accounts: ❌ Missing. OTP service exists but not wired into registration flow. See [server/utils/otpService.js](server/utils/otpService.js), [client/src/pages/VerifyAccount.jsx](client/src/pages/VerifyAccount.jsx).

FR29 - Auto logout after inactivity: ✅ Fully implemented (client). Frontend session timer + 30-minute JWT expiry. See [client/src/contexts/AuthContext.jsx](client/src/contexts/AuthContext.jsx), [server/controllers/authController.js](server/controllers/authController.js).

FR30 - Online payments (PayHere/Stripe): ❌ Missing. Payment services exist but no active routes or UI flow. See [server/services/paymentService.js](server/services/paymentService.js), [server/utils/paymentService.js](server/utils/paymentService.js), [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx).

FR31 - Payment failure notification and retry: ❌ Missing. No frontend retry flow or backend notification hook in active path. See [server/utils/paymentService.js](server/utils/paymentService.js), [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx).

## 2. Database Analysis

**Schema inconsistencies and ORM mismatches**
- Table names in schema are lowercase (e.g. `order`, `menu_item`), while Sequelize models use TitleCase table names (e.g. Order, Menu_Item). This will break in Linux and is already inconsistent with code. Align models or rename tables; do not rely on Windows case-insensitivity. See [server/models/Order.js](server/models/Order.js), [server/models/MenuItem.js](server/models/MenuItem.js).
- Missing tables required by code: `token_blacklist`, `order_status_history` model, `otp_verification` and `delivery_staff_availability` models are not represented in Sequelize but are used in code. See [server/utils/jwtUtils.js](server/utils/jwtUtils.js), [server/services/orderService.js](server/services/orderService.js).

**Missing columns used by code**
- `role` table missing `Description` and `Permissions` fields but backend reads them. See [server/models/Role.js](server/models/Role.js), [server/controllers/authController.js](server/controllers/authController.js).
- `menu_item` is used with `Image_URL` and `StockQuantity` in frontend; schema has `ImageURL` and no stock quantity. See [client/src/pages/Menu.jsx](client/src/pages/Menu.jsx), [server/controllers/menuItemController.js](server/controllers/menuItemController.js).
- `daily_stock` in services expects a `version` column for optimistic locking, which does not exist. See [server/services/stockService.js](server/services/stockService.js).
- `payment` in services expects `gateway_status` and other fields not in schema. See [server/services/paymentService.js](server/services/paymentService.js).

**Constraints and integrity gaps**
- `otp_verification` is polymorphic without foreign keys. This weakens data integrity and invites orphaned OTPs. Consider separate tables or add constraints with application-level enforcement.
- `order_status_history` lacks a model and there is no explicit constraint to prevent invalid transitions; application enforcement is inconsistent.
- `menu_item` / `combo_pack` discount logic has no DB constraint ensuring price aligns with discount settings.
- `promotion` usage count can race under concurrency without a locking strategy.

**Indexes and performance**
- `order` and `order_item` have basic indexes, but no composite indexes for common admin filters (status + CreatedAt). Add compound indexes for reporting endpoints.

**Recommended SQL fixes**

```sql
-- 1) Token blacklist table required by JWT revocation
CREATE TABLE token_blacklist (
  id INT NOT NULL AUTO_INCREMENT,
  token_hash CHAR(64) NOT NULL,
  user_type ENUM('CUSTOMER','STAFF') NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  reason VARCHAR(50) DEFAULT 'LOGOUT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_token_hash (token_hash),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Role fields used by backend but missing in schema
ALTER TABLE role
  ADD COLUMN Description VARCHAR(255) NULL,
  ADD COLUMN Permissions JSON NULL;

-- 3) Daily stock versioning (used in services/stockService.js)
ALTER TABLE daily_stock
  ADD COLUMN Version INT NOT NULL DEFAULT 0;

-- 4) Payment gateway status (used in services/paymentService.js)
ALTER TABLE payment
  ADD COLUMN GatewayStatus VARCHAR(50) NULL;

-- 5) Optional: Add composite index for admin order reports
CREATE INDEX idx_order_status_created ON `order` (Status, CreatedAt);
```

## 3. Backend Analysis

**API structure issues**
- Versioned API base (`/api/v1`) is used by the server but the frontend calls `/api` or `/api/auth`. This breaks nearly all frontend integration. See [server/index.js](server/index.js), [client/src/services/backendApi.js](client/src/services/backendApi.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js).
- There are parallel, conflicting implementations (controllers vs services) for orders, payments, and notifications. The live routes use controllers without the safer service logic. See [server/controllers/orderController.js](server/controllers/orderController.js), [server/services/orderService.js](server/services/orderService.js).

**Authorization and ownership flaws**
- Customer role checks are incorrect (`req.user.role === 'customer'`), enabling customers to see all orders. See [server/controllers/orderController.js](server/controllers/orderController.js).
- Ownership check uses `resource.customer_id` which does not exist in Sequelize models; ownership enforcement fails. See [server/middleware/auth.js](server/middleware/auth.js).

**Missing validation**
- Validation middleware exists but is not used on routes, leading to weak input validation and inconsistent data. See [server/middleware/validation.js](server/middleware/validation.js).

**Business rule violations**
- Delivery distance validation (FR09) is not used in the live order flow. See [server/services/distanceValidation.js](server/services/distanceValidation.js), [server/controllers/orderController.js](server/controllers/orderController.js).
- Delivery assignment logic is manual and sets order status to OUT_FOR_DELIVERY immediately, skipping kitchen readiness. See [server/controllers/adminController.js](server/controllers/adminController.js).
- Kitchen controller allows transition to OUT_FOR_DELIVERY, which should be delivery-only. See [server/controllers/kitchenController.js](server/controllers/kitchenController.js).

**Concurrency and transaction safety**
- Order confirmation and stock deduction in orderController are not safe under concurrency. No row locks are used; stock can go negative. See [server/controllers/orderController.js](server/controllers/orderController.js).
- OrderService has a safer approach but is not wired into routes. See [server/services/orderService.js](server/services/orderService.js).

**Payment verification flaws**
- Payment service exists but has no active routes or webhook endpoints. Webhook verification is unused. See [server/services/paymentService.js](server/services/paymentService.js), [server/utils/paymentService.js](server/utils/paymentService.js).

**Error handling and logging**
- Sensitive data is logged (plaintext and hashed passwords, JWT tokens) in auth paths. See [server/models/Customer.js](server/models/Customer.js), [server/routes/Auth.js](server/routes/Auth.js).
- Notification service uses `nodemailer.createTransporter` (typo) and will fail. See [server/utils/notificationService.js](server/utils/notificationService.js).

**Recommended backend fixes**
- Consolidate order flow in a single service and wire routes to it.
- Enforce role and ownership checks strictly on all order/customer endpoints.
- Apply validation middleware to all mutating routes.
- Implement transaction boundaries for stock deduction and order confirmation with row-level locks.
- Add real payment routes and webhook verification.

## 4. Frontend Analysis

**Role-based UI enforcement issues**
- UI role checks are client-side only and rely on localStorage. Server-side authorization must be the primary control. See [client/src/components/ProtectedRoute.jsx](client/src/components/ProtectedRoute.jsx), [client/src/contexts/AuthContext.jsx](client/src/contexts/AuthContext.jsx).

**Insecure direct API exposure**
- API base paths are mismatched and expose different endpoints, leading to calls that silently fail or bypass real logic. See [client/src/services/backendApi.js](client/src/services/backendApi.js), [client/src/services/dashboardService.js](client/src/services/dashboardService.js).

**Client-side validation weaknesses**
- Checkout and order cancellation are mock-only; no server validation of stock, distance, or payment state. See [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx), [client/src/pages/OrderTracking.jsx](client/src/pages/OrderTracking.jsx).

**UX and state management gaps**
- Core flows (Cart, Checkout, Order History/Tracking, Promotions, Stock) are mock and not connected to backend. See [client/src/pages/Cart.jsx](client/src/pages/Cart.jsx), [client/src/pages/OrderHistory.jsx](client/src/pages/OrderTracking.jsx), [client/src/pages/PromotionManagement.jsx](client/src/pages/StockManagement.jsx).
- Login page uses a dead link for forgot password. See [client/src/pages/Login.jsx](client/src/pages/Login.jsx).

**Performance and accessibility issues**
- No pagination for large lists, heavy tables render all rows.
- No ARIA attributes for critical dialogs/actions (modals and toasts rely on custom components).

**Recommended frontend fixes**
- Replace mock data with real API calls and use consistent base URL `/api/v1`.
- Implement proper loading/error states for order flows.
- Use server-provided stock and price data; remove client-only stock validation.

## 5. Security Vulnerability Analysis

**Critical**
- Broken access control: customers can read other customers' orders due to incorrect role checks. See [server/controllers/orderController.js](server/controllers/orderController.js).
- Sensitive data leakage: plaintext passwords and JWTs logged to console. See [server/models/Customer.js](server/models/Customer.js), [server/routes/Auth.js](server/routes/Auth.js).

**High**
- Token blacklist logic references missing model and will fail, leaving revoked tokens valid. See [server/utils/jwtUtils.js](server/utils/jwtUtils.js).
- Payment tampering risk: payment flow is not verified end-to-end, and webhook signature validation is unused. See [server/services/paymentService.js](server/services/paymentService.js), [server/utils/paymentService.js](server/utils/paymentService.js).
- Rate limiting for auth and OTP endpoints is defined but never applied. See [server/middleware/rateLimiter.js](server/middleware/rateLimiter.js), [server/index.js](server/index.js).

**Medium**
- JWT stored in localStorage is vulnerable to XSS. See [client/src/services/authService.js](client/src/services/authService.js).
- OTP reset flow returns dev OTP in responses and does not send OTP via email/SMS. See [server/controllers/authController.js](server/controllers/authController.js).
- File upload lacks antivirus scanning and uses permissive MIME validation only. See [server/middleware/upload.js](server/middleware/upload.js).

**Low**
- Duplicate auth routes and inconsistent token expiry policies increase operational mistakes. See [server/routes/Auth.js](server/routes/Auth.js), [server/routes/authRoutes.js](server/routes/authRoutes.js).

**Mitigation strategies**
- Enforce strict role checks and ownership checks server-side.
- Remove all sensitive logging and rotate credentials immediately.
- Use HttpOnly cookies for JWT and add CSRF protection.
- Wire auth rate limiting to login and OTP routes.
- Implement verified payment webhooks and idempotent payment handling.

## 6. Connectivity & Integration Issues

- Google Maps validation is not used in live order creation; fallback logic is acceptable only for development. See [server/services/distanceValidation.js](server/services/distanceValidation.js), [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx).
- PayHere/Stripe configuration exists but is not wired to endpoints or UI. See [server/services/paymentService.js](server/services/paymentService.js), [client/src/pages/Checkout.jsx](client/src/pages/Checkout.jsx).
- Email/SMS services are partially configured; notification logging uses inconsistent fields and may fail. See [server/services/emailService.js](server/services/emailService.js), [server/utils/notificationService.js](server/utils/notificationService.js).
- No retry logic for SMS/email failures; notifications can silently drop.

## 7. Performance & Scalability Review

- Missing pagination on admin/customer lists can cause memory spikes on large datasets.
- Order creation and stock updates are not atomic; high concurrency risks stock oversell.
- No caching for menu, categories, or combos; repeated loads will hit database.
- Background jobs for combo scheduling and stock disable are disabled, so tasks require manual intervention. See [server/index.js](server/index.js).

## 8. Production Deployment Risks

- `config.json` contains hardcoded root credentials. See [server/config/config.json](server/config/config.json).
- Multiple auth routes and inconsistent API base paths create deployment ambiguity.
- Token and password logging violates security compliance.
- HTTPS enforcement is not verified for frontend and webhook endpoints.
- No documented backup/restore strategy or DR plan (NFR07 not implemented).

## 9. Architectural Improvements

- Unify API versioning and remove legacy routes to eliminate mismatched clients.
- Consolidate order/payment/stock logic into a single transactional service layer used by controllers.
- Add a clear module boundary for customer vs staff vs admin access policies.
- Replace localStorage auth with HttpOnly cookies and CSRF protection.
- Implement job scheduler (combo scheduling, stock auto-disable, token cleanup) and ensure it runs in production.
- Add observability: structured logs, audit trail for admin actions, and alerting on payment failures.

## 10. Final Risk Summary

**Overall production readiness score:** 32 / 100

**Top 10 critical risks**
1. Broken access control on orders (customer can access other orders).
2. Sensitive credential/token logging.
3. API version mismatch between frontend and backend.
4. Payment flow not wired and no webhook verification in live path.
5. Order creation/stock deduction not concurrency-safe.
6. Missing token blacklist table and model.
7. Mock frontend flows for checkout/order tracking.
8. Delivery distance validation not enforced.
9. Combo schedule automation disabled.
10. Hardcoded DB credentials in repo.

**Immediate fixes required before deployment**
- Fix role and ownership checks in order endpoints.
- Remove sensitive logging and rotate secrets.
- Align API base paths and replace mock frontend flows.
- Wire payment webhooks and verification.
- Enforce stock validation with transactional locks.

**Long-term improvement roadmap**
- Implement full customer profile and verification flows (OTP/email/SMS).
- Replace localStorage auth with HttpOnly cookies + CSRF.
- Build comprehensive admin audit logs and monitoring.
- Add automated jobs for stock and combo scheduling.
- Add caching, pagination, and database tuning for scale.
