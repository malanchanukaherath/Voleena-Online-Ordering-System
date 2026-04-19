const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const docsDir = path.join(repoRoot, 'docs');
const postmanDir = path.join(repoRoot, 'postman', 'collections');

const entities = [
  'Customer',
  'Address',
  'Staff',
  'Role',
  'Category',
  'MenuItem',
  'ComboPack',
  'ComboPackItem',
  'DailyStock',
  'StockMovement',
  'Order',
  'OrderItem',
  'OrderStatusHistory',
  'Delivery',
  'DeliveryStaffAvailability',
  'Payment',
  'Promotion',
  'Feedback',
  'Notification',
  'TokenBlacklist'
];

const featureGroups = [
  {
    name: 'Authentication',
    features: [
      'Customer registration with email verification',
      'Customer and staff login',
      'Token verification, refresh, and logout',
      'Password reset request, OTP verification, and reset'
    ]
  },
  {
    name: 'Catalog',
    features: [
      'Menu item listing, lookup, create, update, deactivate, image upload',
      'Category listing and admin CRUD',
      'Combo pack listing, active storefront listing, admin CRUD, image upload'
    ]
  },
  {
    name: 'Customers',
    features: [
      'Staff-assisted customer registration and update',
      'Customer profile retrieval',
      'Address creation and listing with geocoding fallback'
    ]
  },
  {
    name: 'Ordering and Payments',
    features: [
      'Cart validation and summary',
      'Customer order creation, retrieval, status updates, cancellation',
      'Cashier walk-in order flow',
      'Payment initiation plus PayHere and Stripe webhook processing'
    ]
  },
  {
    name: 'Operations',
    features: [
      'Stock management and legacy stock endpoints',
      'Kitchen dashboard, queue, and stock updates',
      'Admin dashboard, reports, staff management, delivery assignment',
      'Cashier dashboard, order operations, customer management'
    ]
  },
  {
    name: 'Delivery',
    features: [
      'Distance validation and delivery fee calculation',
      'Delivery dashboard, assignment visibility, history, availability updates',
      'Location tracking and authorized location lookup'
    ]
  }
];

const auditFindings = [
  {
    severity: 'High',
    issue: 'Delivery location lookup was effectively inaccessible to customers because the route was behind delivery-role middleware only.',
    status: 'Fixed',
    files: 'server/routes/deliveryRoutes.js, server/controllers/deliveryController.js'
  },
  {
    severity: 'Medium',
    issue: 'Several routes executed authentication twice by combining authenticateToken with convenience middleware that already includes it.',
    status: 'Fixed',
    files: 'server/routes/adminRoutes.js, cashierRoutes.js, customers.js, deliveryRoutes.js, kitchenRoutes.js, orders.js, payments.js, staff.js'
  },
  {
    severity: 'Medium',
    issue: 'Public delivery lookup endpoints had no dedicated rate limiting and could be abused for repeated geocoding and fee requests.',
    status: 'Fixed',
    files: 'server/middleware/rateLimiter.js, server/routes/deliveryRoutes.js'
  },
  {
    severity: 'Medium',
    issue: 'The server boot path always started listeners on require(), which blocked reliable Jest and Supertest use.',
    status: 'Fixed',
    files: 'server/index.js'
  },
  {
    severity: 'Medium',
    issue: 'Response shapes remain inconsistent across controllers. Some endpoints return success/data, others only error/message.',
    status: 'Open',
    files: 'server/controllers/*, server/routes/categories.js, server/routes/customers.js, server/routes/staff.js'
  },
  {
    severity: 'Low',
    issue: 'server/routes/Auth.js is an orphaned legacy route module that is not mounted by the application.',
    status: 'Open',
    files: 'server/routes/Auth.js'
  },
  {
    severity: 'Low',
    issue: 'Stock-related services still contain loop-driven database access patterns that merit batching to avoid N+1 queries at scale.',
    status: 'Open',
    files: 'server/services/stockService.js, server/services/automatedJobs.js'
  }
];

const endpoints = [
  { folder: 'Health', method: 'GET', path: '/health', auth: 'Public', query: '-', body: '-', success: '200 { status, timestamp, uptime, environment }', errors: '500', sampleBody: null },

  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/staff/login', auth: 'Public', query: '-', body: 'email, password', success: '200 { success, token, refreshToken, user, expiresIn }', errors: '400, 401, 500', sampleBody: { email: 'admin@voleena.com', password: 'Admin@123' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/customer/login', auth: 'Public', query: '-', body: 'email, password', success: '200 { success, token, refreshToken, user, expiresIn }', errors: '400, 401, 403 EMAIL_NOT_VERIFIED, 500', sampleBody: { email: 'customer@example.com', password: 'Secret123' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/register', auth: 'Public', query: '-', body: 'name, email, phone, password, profileImageUrl?', success: '201 { success, requiresEmailVerification, emailSent, message }', errors: '400, 409, 500', sampleBody: { name: 'Jane Customer', email: 'jane@example.com', phone: '+94771234567', password: 'Secret123' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/verify-email', auth: 'Public', query: '-', body: 'token', success: '200 { success, message }', errors: '400 invalid/used/expired token, 500', sampleBody: { token: '64-char-hex-token' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/email-verification/resend', auth: 'Public', query: '-', body: 'email', success: '200 generic success response', errors: '400, 429, 500', sampleBody: { email: 'jane@example.com' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/refresh', auth: 'Bearer token + X-Refresh-Token or body.refreshToken', query: '-', body: 'refreshToken?', success: '200 { success, token, refreshToken, user, expiresIn }', errors: '401, 500', sampleBody: { refreshToken: 'refresh-token-placeholder' }, extraHeaders: [{ key: 'X-Refresh-Token', value: '{{refreshToken}}' }] },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/logout', auth: 'Bearer token', query: '-', body: '-', success: '200 { success, message }', errors: '401, 400, 500', sampleBody: null },
  { folder: 'Auth', method: 'GET', path: '/api/v1/auth/verify', auth: 'Bearer token', query: '-', body: '-', success: '200 { success, user }', errors: '401', sampleBody: null },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/password-reset/request', auth: 'Public', query: '-', body: 'email', success: '200 generic reset initiation response', errors: '400, 429, 500', sampleBody: { email: 'jane@example.com' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/password-reset/verify-otp', auth: 'Public', query: '-', body: 'email, otp', success: '200 verification success', errors: '400, 429, 500', sampleBody: { email: 'jane@example.com', otp: '123456' } },
  { folder: 'Auth', method: 'POST', path: '/api/v1/auth/password-reset/reset', auth: 'Public', query: '-', body: 'email, otp, password', success: '200 reset success', errors: '400, 429, 500', sampleBody: { email: 'jane@example.com', otp: '123456', password: 'NewSecret123' } },

  { folder: 'Customers', method: 'POST', path: '/api/v1/customers', auth: 'Bearer Cashier/Admin', query: '-', body: 'name, phone, email?, address?, password?, profileImageUrl?', success: '200 duplicate match or 201 customer created', errors: '400, 409, 500', sampleBody: { name: 'Walk-in Customer', phone: '+94771112233', email: 'walkin@example.com', address: { addressLine1: '10 Main Street', city: 'Colombo', postalCode: '10000' } } },
  { folder: 'Customers', method: 'GET', path: '/api/v1/customers', auth: 'Bearer Cashier/Admin', query: 'status, search, limit, offset', body: '-', success: '200 { customers, count }', errors: '500', sampleBody: null },
  { folder: 'Customers', method: 'GET', path: '/api/v1/customers/me', auth: 'Bearer Customer', query: '-', body: '-', success: '200 { success, data }', errors: '404, 500', sampleBody: null },
  { folder: 'Customers', method: 'GET', path: '/api/v1/customers/me/addresses', auth: 'Bearer Customer', query: '-', body: '-', success: '200 { success, data }', errors: '500', sampleBody: null },
  { folder: 'Customers', method: 'POST', path: '/api/v1/customers/me/addresses', auth: 'Bearer Customer', query: '-', body: 'addressLine1, city, addressLine2?, postalCode?, district?, latitude?, longitude?', success: '201 { success, addressId, address }', errors: '400, 500', sampleBody: { addressLine1: '15 Test Road', city: 'Colombo', postalCode: '10000' } },
  { folder: 'Customers', method: 'GET', path: '/api/v1/customers/:id', auth: 'Bearer Cashier/Admin', query: '-', body: '-', success: '200 { customer }', errors: '404, 500', sampleBody: null },
  { folder: 'Customers', method: 'PUT', path: '/api/v1/customers/:id', auth: 'Bearer Cashier/Admin', query: '-', body: 'name?, email?, phone?, accountStatus?', success: '200 { message, customer }', errors: '400, 404, 500', sampleBody: { name: 'Updated Customer', accountStatus: 'ACTIVE' } },

  { folder: 'Staff', method: 'GET', path: '/api/v1/staff/roles', auth: 'Bearer Admin', query: '-', body: '-', success: '200 { roles }', errors: '500', sampleBody: null },
  { folder: 'Staff', method: 'POST', path: '/api/v1/staff', auth: 'Bearer Admin', query: '-', body: 'name, email, phone, password, roleId, profileImageUrl?', success: '201 { message, staff }', errors: '400, 409, 500', sampleBody: { name: 'Kitchen User', email: 'kitchen@example.com', phone: '+94771112233', password: 'Secret123', roleId: 3 } },
  { folder: 'Staff', method: 'GET', path: '/api/v1/staff', auth: 'Bearer Admin', query: '-', body: '-', success: '200 { staff }', errors: '500', sampleBody: null },
  { folder: 'Staff', method: 'PATCH', path: '/api/v1/staff/:id', auth: 'Bearer Admin', query: '-', body: 'isActive', success: '200 { message, staff }', errors: '404, 500', sampleBody: { isActive: false } },

  { folder: 'Menu', method: 'POST', path: '/api/v1/menu', auth: 'Bearer Admin/Kitchen', query: '-', body: 'Name, Description?, Price, CategoryID, IsActive?, ImageURL?', success: '201 { success, data }', errors: '400, 404, 500', sampleBody: { Name: 'Chicken Rice', Description: 'Steamed rice with chicken curry', Price: 1200, CategoryID: 1, IsActive: true } },
  { folder: 'Menu', method: 'GET', path: '/api/v1/menu', auth: 'Public', query: 'categoryId, isActive, search', body: '-', success: '200 { success, data, count }', errors: '500', sampleBody: null },
  { folder: 'Menu', method: 'GET', path: '/api/v1/menu/:id', auth: 'Bearer token', query: '-', body: '-', success: '200 { success, data }', errors: '401, 404, 500', sampleBody: null },
  { folder: 'Menu', method: 'PUT', path: '/api/v1/menu/:id', auth: 'Bearer Admin/Kitchen', query: '-', body: 'Name?, Description?, Price?, CategoryID?, IsActive?, ImageURL?', success: '200 { success, data }', errors: '400, 404, 500', sampleBody: { Price: 1350, IsActive: true } },
  { folder: 'Menu', method: 'DELETE', path: '/api/v1/menu/:id', auth: 'Bearer Admin', query: '-', body: '-', success: '200 { success, message }', errors: '404, 500', sampleBody: null },
  { folder: 'Menu', method: 'POST', path: '/api/v1/menu/:id/image', auth: 'Bearer Admin/Kitchen', query: '-', body: 'multipart: image', success: '200 { success, data: { MenuItemID, ImageURL } }', errors: '400, 404, 500', sampleBody: null },

  { folder: 'Categories', method: 'GET', path: '/api/v1/categories', auth: 'Bearer token', query: 'isActive, includeInactive', body: '-', success: '200 { success, data }', errors: '401, 500', sampleBody: null },
  { folder: 'Categories', method: 'POST', path: '/api/v1/categories', auth: 'Bearer Admin', query: '-', body: 'Name, Description?, DisplayOrder?, IsActive?, ImageURL?', success: '201 { success, data }', errors: '400, 409, 500', sampleBody: { Name: 'Desserts', Description: 'Sweet dishes', DisplayOrder: 3, IsActive: true } },
  { folder: 'Categories', method: 'PUT', path: '/api/v1/categories/:id', auth: 'Bearer Admin', query: '-', body: 'Name?, Description?, DisplayOrder?, IsActive?, ImageURL?', success: '200 { success, data }', errors: '400, 404, 409, 500', sampleBody: { Name: 'Desserts', ImageURL: 'https://cdn.example.com/desserts.png' } },
  { folder: 'Categories', method: 'DELETE', path: '/api/v1/categories/:id', auth: 'Bearer Admin', query: '-', body: '-', success: '200 { success, message }', errors: '404, 500', sampleBody: null },

  { folder: 'Orders', method: 'POST', path: '/api/v1/orders', auth: 'Bearer Customer', query: '-', body: 'items[], orderType, addressId?, specialInstructions?, promotionCode?', success: '201 { success, message, data }', errors: '400, 401, 403, 500', sampleBody: { orderType: 'DELIVERY', addressId: 1, specialInstructions: 'No onions', items: [{ menuItemId: 1, quantity: 2 }] } },
  { folder: 'Orders', method: 'GET', path: '/api/v1/orders', auth: 'Bearer token', query: 'status, orderType, startDate, endDate', body: '-', success: '200 { success, data, count }', errors: '401, 500', sampleBody: null },
  { folder: 'Orders', method: 'GET', path: '/api/v1/orders/:id', auth: 'Bearer token', query: '-', body: '-', success: '200 { success, data }', errors: '401, 403, 404, 500', sampleBody: null },
  { folder: 'Orders', method: 'POST', path: '/api/v1/orders/:id/confirm', auth: 'Bearer Cashier/Admin', query: '-', body: '-', success: '200 { success, message, data }', errors: '400, 401, 403', sampleBody: null },
  { folder: 'Orders', method: 'PATCH', path: '/api/v1/orders/:id/status', auth: 'Bearer Staff', query: '-', body: 'status, notes?', success: '200 { success, message, data }', errors: '401, 403, 500', sampleBody: { status: 'READY', notes: 'Ready for pickup' } },
  { folder: 'Orders', method: 'DELETE', path: '/api/v1/orders/:id', auth: 'Bearer token', query: '-', body: 'reason', success: '200 { success, message, data }', errors: '400, 401, 403', sampleBody: { reason: 'Need to update order items' } },

  { folder: 'Combos', method: 'POST', path: '/api/v1/combos', auth: 'Bearer Admin', query: '-', body: 'Name, Description?, Price, ScheduleStartDate, ScheduleEndDate, IsActive?, items[], ImageURL?', success: '201 { success, data }', errors: '400, 404, 500', sampleBody: { Name: 'Family Combo', Price: 3200, ScheduleStartDate: '2026-03-01', ScheduleEndDate: '2026-03-31', items: [{ MenuItemID: 1, Quantity: 2 }, { MenuItemID: 2, Quantity: 1 }] } },
  { folder: 'Combos', method: 'GET', path: '/api/v1/combos/active', auth: 'Public', query: '-', body: '-', success: '200 { success, data }', errors: '500', sampleBody: null },
  { folder: 'Combos', method: 'GET', path: '/api/v1/combos', auth: 'Bearer Admin/Kitchen/Cashier', query: 'isActive', body: '-', success: '200 { success, data }', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Combos', method: 'GET', path: '/api/v1/combos/:id', auth: 'Bearer token', query: '-', body: '-', success: '200 { success, data }', errors: '401, 404, 500', sampleBody: null },
  { folder: 'Combos', method: 'PUT', path: '/api/v1/combos/:id', auth: 'Bearer Admin', query: '-', body: 'Name?, Description?, Price?, ScheduleStartDate?, ScheduleEndDate?, IsActive?, items?, ImageURL?', success: '200 { success, data }', errors: '400, 404, 500', sampleBody: { Price: 3500, items: [{ MenuItemID: 1, Quantity: 2 }, { MenuItemID: 3, Quantity: 1 }] } },
  { folder: 'Combos', method: 'DELETE', path: '/api/v1/combos/:id', auth: 'Bearer Admin', query: '-', body: '-', success: '200 { success, message, data }', errors: '404, 500', sampleBody: null },
  { folder: 'Combos', method: 'POST', path: '/api/v1/combos/:id/image', auth: 'Bearer Admin', query: '-', body: 'multipart: image', success: '200 { success, data: { ComboID, ImageURL } }', errors: '400, 404, 500', sampleBody: null },

  { folder: 'Cart', method: 'POST', path: '/api/v1/cart/validate', auth: 'Public', query: '-', body: 'items[]', success: '200 { success, data: { isValid, errors, items, validatedAt } }', errors: '400, 500', sampleBody: { items: [{ menuItemId: 1, quantity: 2 }] } },
  { folder: 'Cart', method: 'POST', path: '/api/v1/cart/summary', auth: 'Public', query: '-', body: 'items[], orderType', success: '200 { success, data: { itemDetails, subtotal, deliveryFee, total } }', errors: '400, 500', sampleBody: { items: [{ menuItemId: 1, quantity: 2 }], orderType: 'DELIVERY' } },

  { folder: 'Stock', method: 'PUT', path: '/api/v1/stock/update/:stockId', auth: 'Bearer Admin/Kitchen', query: '-', body: 'openingQuantity', success: '200 updated stock payload', errors: '400, 401, 403, 404, 500', sampleBody: { openingQuantity: 30 } },
  { folder: 'Stock', method: 'POST', path: '/api/v1/stock/manual-adjust/:stockId', auth: 'Bearer Admin/Kitchen', query: '-', body: 'adjustmentQuantity, reason', success: '200 adjustment result', errors: '400, 401, 403, 404, 500', sampleBody: { adjustmentQuantity: -2, reason: 'Spoilage' } },
  { folder: 'Stock', method: 'GET', path: '/api/v1/stock/today', auth: 'Bearer Admin/Kitchen', query: '-', body: '-', success: '200 stock listing', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Stock', method: 'GET', path: '/api/v1/stock/movements', auth: 'Bearer Admin/Kitchen', query: 'menuItemId?, date?', body: '-', success: '200 stock movement audit trail', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Stock', method: 'DELETE', path: '/api/v1/stock/:stockId', auth: 'Bearer Admin/Kitchen', query: '-', body: '-', success: '200 delete/deactivate result', errors: '401, 403, 404, 500', sampleBody: null },
  { folder: 'Stock', method: 'POST', path: '/api/v1/stock/daily', auth: 'Bearer Admin/Kitchen', query: '-', body: 'menuItemId, openingQuantity, stockDate?', success: '200 or 201 stock set result', errors: '400, 401, 403, 500', sampleBody: { menuItemId: 1, openingQuantity: 25 } },
  { folder: 'Stock', method: 'POST', path: '/api/v1/stock/daily/bulk', auth: 'Bearer Admin/Kitchen', query: '-', body: 'items[]', success: '200 bulk result', errors: '400, 401, 403, 500', sampleBody: { items: [{ menuItemId: 1, openingQuantity: 25 }, { menuItemId: 2, openingQuantity: 10 }] } },
  { folder: 'Stock', method: 'PATCH', path: '/api/v1/stock/daily/:id', auth: 'Bearer Admin/Kitchen', query: '-', body: 'quantityChange, reason', success: '200 adjustment result', errors: '400, 401, 403, 404, 500', sampleBody: { quantityChange: -1, reason: 'Sample usage' } },

  { folder: 'Payments', method: 'POST', path: '/api/v1/payments/initiate', auth: 'Bearer Customer', query: '-', body: 'orderId, paymentMethod', success: '200 { success, data }', errors: '400, 401, 403, 404, 409, 500', sampleBody: { orderId: 1001, paymentMethod: 'CARD' } },
  { folder: 'Payments', method: 'POST', path: '/api/v1/payments/webhook/payhere', auth: 'Public (gateway signature)', query: '-', body: 'merchant_id, order_id, payment_id, status_code, payhere_amount, payhere_currency, md5sig', success: '200 { success }', errors: '400, 404, 500', sampleBody: { merchant_id: '{{payHereMerchantId}}', order_id: 'ORD-1001', payment_id: 'PH-12345', status_code: '2', payhere_amount: '1500.00', payhere_currency: 'LKR', md5sig: 'valid-signature' } },
  { folder: 'Payments', method: 'POST', path: '/api/v1/payments/webhook/stripe', auth: 'Public (Stripe signature header)', query: '-', body: 'raw Stripe event payload', success: '200 { received: true } or { ignored: true }', errors: '400, 501', sampleBody: { id: 'evt_test', type: 'payment_intent.processing', data: { object: { id: 'pi_test' } } }, extraHeaders: [{ key: 'stripe-signature', value: '{{stripeSignature}}' }] },

  { folder: 'Delivery', method: 'POST', path: '/api/v1/delivery/validate-distance', auth: 'Public', query: '-', body: 'latitude?, longitude?, address?', success: '200 { success, data }', errors: '400, 429, 500', sampleBody: { address: { addressLine1: '25 Flower Road', city: 'Colombo' } } },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/fee-config', auth: 'Public', query: '-', body: '-', success: '200 { success, data }', errors: '429, 500', sampleBody: null },
  { folder: 'Delivery', method: 'POST', path: '/api/v1/delivery/calculate-fee', auth: 'Public', query: '-', body: 'distanceKm', success: '200 { success, data }', errors: '400, 429, 500', sampleBody: { distanceKm: 4.5 } },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/deliveries/:deliveryId/location', auth: 'Bearer assigned rider, owning customer, or admin', query: '-', body: '-', success: '200 { success, data }', errors: '401, 403, 404, 503, 500', sampleBody: null },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/dashboard/stats', auth: 'Bearer Delivery/Admin', query: '-', body: '-', success: '200 { success, stats }', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/deliveries', auth: 'Bearer Delivery/Admin', query: 'status', body: '-', success: '200 { success, data }', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/deliveries/:deliveryId', auth: 'Bearer Delivery/Admin', query: '-', body: '-', success: '200 { success, data }', errors: '401, 403, 404, 500', sampleBody: null },
  { folder: 'Delivery', method: 'PUT', path: '/api/v1/delivery/deliveries/:deliveryId/status', auth: 'Bearer Delivery/Admin', query: '-', body: 'status, notes?, proof?', success: '200 { success, message, data }', errors: '400, 401, 403, 404, 500', sampleBody: { status: 'IN_TRANSIT', notes: 'Picked up from kitchen' } },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/history', auth: 'Bearer Delivery/Admin', query: 'limit, offset', body: '-', success: '200 { success, data }', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Delivery', method: 'POST', path: '/api/v1/delivery/deliveries/:deliveryId/location', auth: 'Bearer Delivery/Admin', query: '-', body: 'lat, lng', success: '200 { success, message, data }', errors: '400, 401, 403, 404, 503, 500', sampleBody: { lat: 6.9123, lng: 79.8567 } },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/staff/available', auth: 'Bearer Admin', query: '-', body: '-', success: '200 { success, data: { count, staff } }', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Delivery', method: 'GET', path: '/api/v1/delivery/availability', auth: 'Bearer Delivery/Admin', query: '-', body: '-', success: '200 { success, data }', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Delivery', method: 'PUT', path: '/api/v1/delivery/availability', auth: 'Bearer Delivery/Admin', query: '-', body: 'isAvailable', success: '200 { success, message, isAvailable }', errors: '400, 401, 403, 500', sampleBody: { isAvailable: true } },

  { folder: 'Admin', method: 'GET', path: '/api/v1/admin/dashboard/stats', auth: 'Bearer Admin', query: '-', body: '-', success: '200 admin dashboard payload', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Admin', method: 'GET', path: '/api/v1/admin/reports/monthly-sales', auth: 'Bearer Admin', query: 'year, month', body: '-', success: '200 monthly sales report', errors: '400, 401, 403, 500', sampleBody: null },
  { folder: 'Admin', method: 'GET', path: '/api/v1/admin/reports/best-selling', auth: 'Bearer Admin', query: 'limit, startDate?, endDate?', body: '-', success: '200 best-selling item report', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Admin', method: 'GET', path: '/api/v1/admin/staff', auth: 'Bearer Admin', query: '-', body: '-', success: '200 staff listing', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Admin', method: 'POST', path: '/api/v1/admin/staff', auth: 'Bearer Admin', query: '-', body: 'name, email, phone, password, roleId', success: '201/200 staff create result', errors: '400, 409, 500', sampleBody: { name: 'Cashier User', email: 'cashier@example.com', phone: '+94771113344', password: 'Secret123', roleId: 2 } },
  { folder: 'Admin', method: 'PUT', path: '/api/v1/admin/staff/:id', auth: 'Bearer Admin', query: '-', body: 'name?, phone?, roleId?, isActive?', success: '200 update result', errors: '400, 404, 500', sampleBody: { isActive: true } },
  { folder: 'Admin', method: 'DELETE', path: '/api/v1/admin/staff/:id', auth: 'Bearer Admin', query: '-', body: '-', success: '200 delete/deactivate result', errors: '404, 500', sampleBody: null },
  { folder: 'Admin', method: 'GET', path: '/api/v1/admin/roles', auth: 'Bearer Admin', query: '-', body: '-', success: '200 role listing', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Admin', method: 'POST', path: '/api/v1/admin/delivery/assign', auth: 'Bearer Admin', query: '-', body: 'orderId, deliveryStaffId', success: '200 assignment result', errors: '400, 404, 409, 500', sampleBody: { orderId: 1001, deliveryStaffId: 12 } },

  { folder: 'Kitchen', method: 'GET', path: '/api/v1/kitchen/dashboard/stats', auth: 'Bearer Kitchen/Admin', query: '-', body: '-', success: '200 dashboard stats', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Kitchen', method: 'GET', path: '/api/v1/kitchen/orders', auth: 'Bearer Kitchen/Admin', query: 'status?', body: '-', success: '200 kitchen order queue', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Kitchen', method: 'PUT', path: '/api/v1/kitchen/orders/:orderId/status', auth: 'Bearer Kitchen/Admin', query: '-', body: 'status, notes?', success: '200 update result', errors: '400, 401, 403, 404, 500', sampleBody: { status: 'READY', notes: 'Packed and ready' } },
  { folder: 'Kitchen', method: 'GET', path: '/api/v1/kitchen/menu-items', auth: 'Bearer Kitchen/Admin', query: '-', body: '-', success: '200 menu item reference list', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Kitchen', method: 'GET', path: '/api/v1/kitchen/stock/daily', auth: 'Bearer Kitchen/Admin', query: 'date?', body: '-', success: '200 stock records', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Kitchen', method: 'POST', path: '/api/v1/kitchen/stock/daily', auth: 'Bearer Kitchen/Admin', query: '-', body: 'menuItemId, openingQuantity, stockDate?', success: '200 update result', errors: '400, 401, 403, 500', sampleBody: { menuItemId: 1, openingQuantity: 40 } },
  { folder: 'Kitchen', method: 'POST', path: '/api/v1/kitchen/stock/daily/bulk', auth: 'Bearer Kitchen/Admin', query: '-', body: 'items[]', success: '200 bulk update result', errors: '400, 401, 403, 500', sampleBody: { items: [{ menuItemId: 1, openingQuantity: 40 }, { menuItemId: 2, openingQuantity: 15 }] } },

  { folder: 'Cashier', method: 'GET', path: '/api/v1/cashier/dashboard/stats', auth: 'Bearer Cashier/Admin', query: '-', body: '-', success: '200 dashboard stats', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Cashier', method: 'GET', path: '/api/v1/cashier/orders', auth: 'Bearer Cashier/Admin', query: 'status?, limit?, offset?', body: '-', success: '200 cashier order listing', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Cashier', method: 'POST', path: '/api/v1/cashier/walkin-order', auth: 'Bearer Cashier/Admin', query: '-', body: 'customerId?, items[], paymentMethod, notes?', success: '201/200 walk-in order result', errors: '400, 401, 403, 500', sampleBody: { items: [{ menuItemId: 1, quantity: 1 }], paymentMethod: 'CASH', notes: 'Walk-in guest' } },
  { folder: 'Cashier', method: 'PUT', path: '/api/v1/cashier/orders/:orderId/confirm', auth: 'Bearer Cashier/Admin', query: '-', body: '-', success: '200 order confirmed', errors: '400, 401, 403, 404, 500', sampleBody: null },
  { folder: 'Cashier', method: 'PUT', path: '/api/v1/cashier/orders/:orderId/cancel', auth: 'Bearer Cashier/Admin', query: '-', body: 'reason', success: '200 order cancelled', errors: '400, 401, 403, 404, 500', sampleBody: { reason: 'Customer changed mind' } },
  { folder: 'Cashier', method: 'GET', path: '/api/v1/cashier/customers', auth: 'Bearer Cashier/Admin', query: 'search, limit, offset', body: '-', success: '200 customer listing', errors: '401, 403, 500', sampleBody: null },
  { folder: 'Cashier', method: 'GET', path: '/api/v1/cashier/customers/:customerId', auth: 'Bearer Cashier/Admin', query: '-', body: '-', success: '200 customer details', errors: '401, 403, 404, 500', sampleBody: null },
  { folder: 'Cashier', method: 'POST', path: '/api/v1/cashier/customers', auth: 'Bearer Cashier/Admin', query: '-', body: 'name, phone, email?, address?, password?', success: '201 customer creation result', errors: '400, 409, 500', sampleBody: { name: 'Cashier Added', phone: '+94770001122', email: 'cashier-added@example.com' } },
  { folder: 'Cashier', method: 'PUT', path: '/api/v1/cashier/customers/:customerId', auth: 'Bearer Cashier/Admin', query: '-', body: 'name?, phone?, email?, accountStatus?', success: '200 update result', errors: '400, 404, 500', sampleBody: { accountStatus: 'ACTIVE' } },

  { folder: 'Upload', method: 'GET', path: '/api/v1/upload/folders', auth: 'Bearer token', query: '-', body: '-', success: '200 upload folder listing', errors: '401, 500', sampleBody: null },
  { folder: 'Upload', method: 'POST', path: '/api/v1/upload/image', auth: 'Bearer token', query: '-', body: 'multipart: image, folder?', success: '200 upload result', errors: '400, 401, 500', sampleBody: null }
];

// Code Review: Function escapePipe in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function escapePipe(value) {
  return String(value).replace(/\|/g, '\\|');
}

// Code Review: Function markdownTable in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function markdownTable(rows) {
  return [
    '| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((endpoint) => `| ${escapePipe(endpoint.method)} | ${escapePipe(endpoint.path)} | ${escapePipe(endpoint.auth)} | ${escapePipe(endpoint.query)} | ${escapePipe(endpoint.body)} | ${escapePipe(endpoint.success)} | ${escapePipe(endpoint.errors)} |`)
  ].join('\n');
}

// Code Review: Function groupByFolder in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function groupByFolder(items) {
  return items.reduce((acc, item) => {
    acc[item.folder] = acc[item.folder] || [];
    acc[item.folder].push(item);
    return acc;
  }, {});
}

// Code Review: Function createCollectionItem in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function createCollectionItem(endpoint) {
  const rawUrl = `{{baseUrl}}${endpoint.path.replace(/:([A-Za-z0-9_]+)/g, '{{$1}}')}`;
  const url = {
    raw: rawUrl,
    host: ['{{baseUrl}}'],
    path: endpoint.path.replace(/^\//, '').split('/').map((segment) => segment.startsWith(':') ? `{{${segment.slice(1)}}}` : segment)
  };

  const headers = [];

  if (endpoint.auth !== 'Public' && !endpoint.auth.startsWith('Public ')) {
    headers.push({ key: 'Authorization', value: 'Bearer {{accessToken}}' });
  }

  if (endpoint.extraHeaders) {
    headers.push(...endpoint.extraHeaders);
  }

  let body;
  if (endpoint.sampleBody) {
    if (endpoint.body.startsWith('multipart')) {
      body = {
        mode: 'formdata',
        formdata: [
          { key: 'image', type: 'file', src: '' },
          { key: 'folder', value: 'menu', type: 'text' }
        ]
      };
    } else {
      headers.push({ key: 'Content-Type', value: 'application/json' });
      body = {
        mode: 'raw',
        raw: JSON.stringify(endpoint.sampleBody, null, 2)
      };
    }
  }

  return {
    name: `${endpoint.method} ${endpoint.path}`,
    request: {
      method: endpoint.method,
      header: headers,
      url,
      description: `Auth: ${endpoint.auth}\nQuery: ${endpoint.query}\nBody: ${endpoint.body}\nSuccess: ${endpoint.success}\nErrors: ${endpoint.errors}`,
      ...(body ? { body } : {})
    },
    response: []
  };
}

// Code Review: Function ensureDir in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Code Review: Function writeFile in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function writeFile(targetPath, content) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content, 'utf8');
}

// Code Review: Function buildApiDocumentation in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function buildApiDocumentation() {
  const grouped = groupByFolder(endpoints);
  const sections = Object.keys(grouped)
    .map((folder) => `## ${folder}\n\n${markdownTable(grouped[folder])}`)
    .join('\n\n');

  return `# API Documentation\n\nThis document covers the active versioned API surface mounted under /api/v1. Legacy /api/* aliases exist for backward compatibility but are intentionally omitted here.\n\n## Feature Inventory\n\n${featureGroups.map((group) => `### ${group.name}\n${group.features.map((feature) => `- ${feature}`).join('\n')}`).join('\n\n')}\n\n## Database Entities\n\n${entities.map((entity) => `- ${entity}`).join('\n')}\n\n${sections}\n`;
}

// Code Review: Function buildTestPlanAndAudit in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function buildTestPlanAndAudit() {
  return `# API Test Plan And Audit\n\n## Automated Test Implementation\n\nThe current Jest + Supertest suite covers:\n- Auth flows in server/tests/auth.routes.test.js\n- Customer and address flows in server/tests/customers.routes.test.js\n- Cart validation and summary in server/tests/cart.routes.test.js\n- Order create/list/confirm/cancel flows in server/tests/orders.routes.test.js\n- Payment initiation and webhook validation in server/tests/payments.routes.test.js\n- Delivery fee, distance, location, and availability flows in server/tests/delivery.routes.test.js\n- Category route validation and side effects in server/tests/categories.routes.test.js\n- Contract coverage for the remaining mounted route surface in server/tests/route-contracts.test.js\n\n## Single Command Execution\n\n- Workspace root: npm test\n- Server direct: npm --prefix server test\n\n## Test Strategy\n\n- Route-contract coverage guarantees the mounted API surface remains reachable with the expected authorization gates.\n- Behavior-focused tests target the highest-risk stateful flows: auth, customers, ordering, delivery, and payments.\n- Database side effects are verified through model and service mocks so the suite stays deterministic and fast in CI.\n- Public lookup endpoints are exercised separately from authenticated role-based endpoints.\n\n## Simulated User Flow Coverage\n\n- User registration\n- Email verification failure handling\n- Customer login\n- Token verification and logout\n- Customer address creation\n- Cart validation and summary\n- Order creation\n- Order confirmation and cancellation\n- Payment initiation and webhook validation\n- Delivery fee calculation and location lookup\n- Category CRUD and image cleanup side effects\n\n## Audit Findings\n\n| Severity | Status | Finding | Files |\n| --- | --- | --- | --- |\n${auditFindings.map((finding) => `| ${finding.severity} | ${finding.status} | ${escapePipe(finding.issue)} | ${escapePipe(finding.files)} |`).join('\n')}\n\n## Recommended Next Refactors\n\n- Standardize all API responses to a single envelope: success, data, message, error.\n- Remove or archive server/routes/Auth.js to eliminate dead legacy auth code.\n- Batch stock and automated job queries to reduce loop-driven database access under load.\n- Add dedicated controller-level tests for admin, cashier, kitchen, stock, upload, menu item, and combo pack business logic once response formats are standardized.\n`;
}

// Code Review: Function buildFeatureChecklist in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function buildFeatureChecklist() {
  return `# Feature Testing Checklist\n\n## Authentication\n- [ ] Register a customer with valid details\n- [ ] Reject registration with duplicate email or phone\n- [ ] Reject customer login before email verification\n- [ ] Verify access token and logout successfully\n- [ ] Request, verify, and complete password reset\n\n## Customer Profile\n- [ ] Staff creates a new customer manually\n- [ ] Staff sees duplicate customer match instead of a duplicate insert\n- [ ] Customer reads profile and address list\n- [ ] Customer creates an address with direct coordinates\n- [ ] Customer creates an address that requires geocoding\n\n## Catalog\n- [ ] Public menu listing returns active items\n- [ ] Authorized users fetch menu item detail\n- [ ] Admin or kitchen creates and updates a menu item\n- [ ] Admin creates, updates, and deactivates categories\n- [ ] Admin creates and updates combo packs\n- [ ] Admin uploads menu and combo images\n\n## Cart And Orders\n- [ ] Public cart validation rejects invalid payloads\n- [ ] Public cart summary calculates totals correctly\n- [ ] Customer places takeaway order\n- [ ] Customer places delivery order with address\n- [ ] Customer retrieves own orders only\n- [ ] Cashier confirms an order\n- [ ] Staff updates order status\n- [ ] Customer cancels an eligible order\n\n## Payments\n- [ ] Customer initiates card payment for own order\n- [ ] Reject payment initiation for foreign or cancelled orders\n- [ ] Reject duplicate pending or paid payment creation\n- [ ] Validate PayHere webhook signature and amount\n- [ ] Reject Stripe webhook when configuration is missing or invalid\n\n## Delivery\n- [ ] Public delivery distance validation works with GPS coordinates\n- [ ] Public delivery distance validation works with address geocoding\n- [ ] Public fee calculation rejects invalid distance\n- [ ] Delivery staff reads dashboard and assigned deliveries\n- [ ] Delivery staff updates availability\n- [ ] Delivery staff tracks live location\n- [ ] Customer reads own delivery location\n- [ ] Admin lists available delivery staff\n\n## Operations\n- [ ] Admin dashboard and reports load\n- [ ] Admin staff CRUD works\n- [ ] Admin assigns delivery staff to an order\n- [ ] Kitchen dashboard, queue, and stock endpoints load\n- [ ] Cashier dashboard, orders, and customer management endpoints load\n- [ ] Stock update, adjustment, movement, and legacy endpoints are accessible to admin/kitchen roles\n`;
}

// Code Review: Function buildCollection in server\scripts\generate-api-artifacts.js. Used in: server/scripts/generate-api-artifacts.js.
function buildCollection() {
  const grouped = groupByFolder(endpoints);

  return JSON.stringify({
    info: {
      name: 'Voleena API Audit Collection',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: 'Generated from server/scripts/generate-api-artifacts.js for API audit and regression coverage.'
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:3001' },
      { key: 'accessToken', value: '' },
      { key: 'refreshToken', value: '' },
      { key: 'deliveryId', value: '1' },
      { key: 'orderId', value: '1001' },
      { key: 'customerId', value: '1' },
      { key: 'stockId', value: '1' },
      { key: 'stripeSignature', value: '' },
      { key: 'payHereMerchantId', value: '' }
    ],
    item: Object.keys(grouped).map((folder) => ({
      name: folder,
      item: grouped[folder].map(createCollectionItem)
    }))
  }, null, 2);
}

writeFile(path.join(docsDir, 'API_DOCUMENTATION.md'), buildApiDocumentation());
writeFile(path.join(docsDir, 'TEST_PLAN_AND_AUDIT.md'), buildTestPlanAndAudit());
writeFile(path.join(docsDir, 'FEATURE_TEST_CHECKLIST.md'), buildFeatureChecklist());
writeFile(path.join(postmanDir, 'Voleena_API_Audit.postman_collection.json'), buildCollection());

console.log('Generated API docs, audit plan, checklist, and Postman collection.');