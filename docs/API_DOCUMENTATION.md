# API Documentation

This document covers the active versioned API surface mounted under /api/v1. Legacy /api/* aliases exist for backward compatibility but are intentionally omitted here.

## Feature Inventory

### Authentication
- Customer registration with email verification
- Customer and staff login
- Token verification, refresh, and logout
- Password reset request, OTP verification, and reset

### Catalog
- Menu item listing, lookup, create, update, deactivate, image upload
- Category listing and admin CRUD
- Combo pack listing, active storefront listing, admin CRUD, image upload

### Customers
- Staff-assisted customer registration and update
- Customer profile retrieval
- Address creation and listing with geocoding fallback

### Ordering and Payments
- Cart validation and summary
- Customer order creation, retrieval, status updates, cancellation
- Cashier walk-in order flow
- Payment initiation plus PayHere and Stripe webhook processing

### Operations
- Stock management and legacy stock endpoints
- Kitchen dashboard, queue, and stock updates
- Admin dashboard, reports, staff management, delivery assignment
- Cashier dashboard, order operations, customer management

### Delivery
- Distance validation and delivery fee calculation
- Delivery dashboard, assignment visibility, history, availability updates
- Location tracking and authorized location lookup

## Database Entities

- Customer
- Address
- Staff
- Role
- Category
- MenuItem
- ComboPack
- ComboPackItem
- DailyStock
- StockMovement
- Order
- OrderItem
- OrderStatusHistory
- Delivery
- DeliveryStaffAvailability
- Payment
- Promotion
- Feedback
- Notification
- TokenBlacklist

## Health

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /health | Public | - | - | 200 { status, timestamp, uptime, environment } | 500 |

## Auth

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/auth/staff/login | Public | - | email, password | 200 { success, token, refreshToken, user, expiresIn } | 400, 401, 500 |
| POST | /api/v1/auth/customer/login | Public | - | email, password | 200 { success, token, refreshToken, user, expiresIn } | 400, 401, 403 EMAIL_NOT_VERIFIED, 500 |
| POST | /api/v1/auth/register | Public | - | name, email, phone, password, profileImageUrl? | 201 { success, requiresEmailVerification, emailSent, message } | 400, 409, 500 |
| POST | /api/v1/auth/verify-email | Public | - | token | 200 { success, message } | 400 invalid/used/expired token, 500 |
| POST | /api/v1/auth/email-verification/resend | Public | - | email | 200 generic success response | 400, 429, 500 |
| POST | /api/v1/auth/refresh | Bearer token + X-Refresh-Token or body.refreshToken | - | refreshToken? | 200 { success, token, refreshToken, user, expiresIn } | 401, 500 |
| POST | /api/v1/auth/logout | Bearer token | - | - | 200 { success, message } | 401, 400, 500 |
| GET | /api/v1/auth/verify | Bearer token | - | - | 200 { success, user } | 401 |
| POST | /api/v1/auth/password-reset/request | Public | - | email | 200 generic reset initiation response | 400, 429, 500 |
| POST | /api/v1/auth/password-reset/verify-otp | Public | - | email, otp | 200 verification success | 400, 429, 500 |
| POST | /api/v1/auth/password-reset/reset | Public | - | email, otp, password | 200 reset success | 400, 429, 500 |

## Customers

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/customers | Bearer Cashier/Admin | - | name, phone, email?, address?, password?, profileImageUrl? | 200 duplicate match or 201 customer created | 400, 409, 500 |
| GET | /api/v1/customers | Bearer Cashier/Admin | status, search, limit, offset | - | 200 { customers, count } | 500 |
| GET | /api/v1/customers/me | Bearer Customer | - | - | 200 { success, data } | 404, 500 |
| GET | /api/v1/customers/me/addresses | Bearer Customer | - | - | 200 { success, data } | 500 |
| POST | /api/v1/customers/me/addresses | Bearer Customer | - | addressLine1, city, addressLine2?, postalCode?, district?, latitude?, longitude? | 201 { success, addressId, address } | 400, 500 |
| GET | /api/v1/customers/:id | Bearer Cashier/Admin | - | - | 200 { customer } | 404, 500 |
| PUT | /api/v1/customers/:id | Bearer Cashier/Admin | - | name?, email?, phone?, accountStatus? | 200 { message, customer } | 400, 404, 500 |

## Staff

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/staff/roles | Bearer Admin | - | - | 200 { roles } | 500 |
| POST | /api/v1/staff | Bearer Admin | - | name, email, phone, password, roleId, profileImageUrl? | 201 { message, staff } | 400, 409, 500 |
| GET | /api/v1/staff | Bearer Admin | - | - | 200 { staff } | 500 |
| PATCH | /api/v1/staff/:id | Bearer Admin | - | isActive | 200 { message, staff } | 404, 500 |

## Menu

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/menu | Bearer Admin/Kitchen | - | Name, Description?, Price, CategoryID, IsActive?, ImageURL? | 201 { success, data } | 400, 404, 500 |
| GET | /api/v1/menu | Public | categoryId, isActive, search | - | 200 { success, data, count } | 500 |
| GET | /api/v1/menu/:id | Bearer token | - | - | 200 { success, data } | 401, 404, 500 |
| PUT | /api/v1/menu/:id | Bearer Admin/Kitchen | - | Name?, Description?, Price?, CategoryID?, IsActive?, ImageURL? | 200 { success, data } | 400, 404, 500 |
| DELETE | /api/v1/menu/:id | Bearer Admin | - | - | 200 { success, message } | 404, 500 |
| POST | /api/v1/menu/:id/image | Bearer Admin/Kitchen | - | multipart: image | 200 { success, data: { MenuItemID, ImageURL } } | 400, 404, 500 |

## Categories

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/categories | Bearer token | isActive, includeInactive | - | 200 { success, data } | 401, 500 |
| POST | /api/v1/categories | Bearer Admin | - | Name, Description?, DisplayOrder?, IsActive?, ImageURL? | 201 { success, data } | 400, 409, 500 |
| PUT | /api/v1/categories/:id | Bearer Admin | - | Name?, Description?, DisplayOrder?, IsActive?, ImageURL? | 200 { success, data } | 400, 404, 409, 500 |
| DELETE | /api/v1/categories/:id | Bearer Admin | - | - | 200 { success, message } | 404, 500 |

## Orders

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/orders | Bearer Customer | - | items[], orderType, addressId?, specialInstructions?, promotionCode? | 201 { success, message, data } | 400, 401, 403, 500 |
| GET | /api/v1/orders | Bearer token | status, orderType, startDate, endDate | - | 200 { success, data, count } | 401, 500 |
| GET | /api/v1/orders/:id | Bearer token | - | - | 200 { success, data } | 401, 403, 404, 500 |
| POST | /api/v1/orders/:id/confirm | Bearer Cashier/Admin | - | - | 200 { success, message, data } | 400, 401, 403 |
| PATCH | /api/v1/orders/:id/status | Bearer Staff | - | status, notes? | 200 { success, message, data } | 401, 403, 500 |
| DELETE | /api/v1/orders/:id | Bearer token | - | reason | 200 { success, message, data } | 400, 401, 403 |

## Combos

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/combos | Bearer Admin | - | Name, Description?, Price, ScheduleStartDate, ScheduleEndDate, IsActive?, items[], ImageURL? | 201 { success, data } | 400, 404, 500 |
| GET | /api/v1/combos/active | Public | - | - | 200 { success, data } | 500 |
| GET | /api/v1/combos | Bearer Admin/Kitchen/Cashier | isActive | - | 200 { success, data } | 401, 403, 500 |
| GET | /api/v1/combos/:id | Bearer token | - | - | 200 { success, data } | 401, 404, 500 |
| PUT | /api/v1/combos/:id | Bearer Admin | - | Name?, Description?, Price?, ScheduleStartDate?, ScheduleEndDate?, IsActive?, items?, ImageURL? | 200 { success, data } | 400, 404, 500 |
| DELETE | /api/v1/combos/:id | Bearer Admin | - | - | 200 { success, message, data } | 404, 500 |
| POST | /api/v1/combos/:id/image | Bearer Admin | - | multipart: image | 200 { success, data: { ComboID, ImageURL } } | 400, 404, 500 |

## Cart

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/cart/validate | Public | - | items[] | 200 { success, data: { isValid, errors, items, validatedAt } } | 400, 500 |
| POST | /api/v1/cart/summary | Public | - | items[], orderType | 200 { success, data: { itemDetails, subtotal, deliveryFee, total } } | 400, 500 |

## Stock

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| PUT | /api/v1/stock/update/:stockId | Bearer Admin/Kitchen | - | openingQuantity | 200 updated stock payload | 400, 401, 403, 404, 500 |
| POST | /api/v1/stock/manual-adjust/:stockId | Bearer Admin/Kitchen | - | adjustmentQuantity, reason | 200 adjustment result | 400, 401, 403, 404, 500 |
| GET | /api/v1/stock/today | Bearer Admin/Kitchen | - | - | 200 stock listing | 401, 403, 500 |
| GET | /api/v1/stock/movements | Bearer Admin/Kitchen | menuItemId?, date? | - | 200 stock movement audit trail | 401, 403, 500 |
| DELETE | /api/v1/stock/:stockId | Bearer Admin/Kitchen | - | - | 200 delete/deactivate result | 401, 403, 404, 500 |
| POST | /api/v1/stock/daily | Bearer Admin/Kitchen | - | menuItemId, openingQuantity, stockDate? | 200 or 201 stock set result | 400, 401, 403, 500 |
| POST | /api/v1/stock/daily/bulk | Bearer Admin/Kitchen | - | items[] | 200 bulk result | 400, 401, 403, 500 |
| PATCH | /api/v1/stock/daily/:id | Bearer Admin/Kitchen | - | quantityChange, reason | 200 adjustment result | 400, 401, 403, 404, 500 |

## Payments

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/payments/initiate | Bearer Customer | - | orderId, paymentMethod | 200 { success, data } | 400, 401, 403, 404, 409, 500 |
| POST | /api/v1/payments/webhook/payhere | Public (gateway signature) | - | merchant_id, order_id, payment_id, status_code, payhere_amount, payhere_currency, md5sig | 200 { success } | 400, 404, 500 |
| POST | /api/v1/payments/webhook/stripe | Public (Stripe signature header) | - | raw Stripe event payload | 200 { received: true } or { ignored: true } | 400, 501 |

## Delivery

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| POST | /api/v1/delivery/validate-distance | Public | - | latitude?, longitude?, address? | 200 { success, data } | 400, 429, 500 |
| GET | /api/v1/delivery/fee-config | Public | - | - | 200 { success, data } | 429, 500 |
| POST | /api/v1/delivery/calculate-fee | Public | - | distanceKm | 200 { success, data } | 400, 429, 500 |
| GET | /api/v1/delivery/deliveries/:deliveryId/location | Bearer assigned rider, owning customer, or admin | - | - | 200 { success, data } | 401, 403, 404, 503, 500 |
| GET | /api/v1/delivery/dashboard/stats | Bearer Delivery/Admin | - | - | 200 { success, stats } | 401, 403, 500 |
| GET | /api/v1/delivery/deliveries | Bearer Delivery/Admin | status | - | 200 { success, data } | 401, 403, 500 |
| GET | /api/v1/delivery/deliveries/:deliveryId | Bearer Delivery/Admin | - | - | 200 { success, data } | 401, 403, 404, 500 |
| PUT | /api/v1/delivery/deliveries/:deliveryId/status | Bearer Delivery/Admin | - | status, notes?, proof? | 200 { success, message, data } | 400, 401, 403, 404, 500 |
| GET | /api/v1/delivery/history | Bearer Delivery/Admin | limit, offset | - | 200 { success, data } | 401, 403, 500 |
| POST | /api/v1/delivery/deliveries/:deliveryId/location | Bearer Delivery/Admin | - | lat, lng | 200 { success, message, data } | 400, 401, 403, 404, 503, 500 |
| GET | /api/v1/delivery/staff/available | Bearer Admin | - | - | 200 { success, data: { count, staff } } | 401, 403, 500 |
| GET | /api/v1/delivery/availability | Bearer Delivery/Admin | - | - | 200 { success, data } | 401, 403, 500 |
| PUT | /api/v1/delivery/availability | Bearer Delivery/Admin | - | isAvailable | 200 { success, message, isAvailable } | 400, 401, 403, 500 |

## Admin

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/admin/dashboard/stats | Bearer Admin | - | - | 200 admin dashboard payload | 401, 403, 500 |
| GET | /api/v1/admin/reports/monthly-sales | Bearer Admin | year, month | - | 200 monthly sales report | 400, 401, 403, 500 |
| GET | /api/v1/admin/reports/best-selling | Bearer Admin | limit, startDate?, endDate? | - | 200 best-selling item report | 401, 403, 500 |
| GET | /api/v1/admin/staff | Bearer Admin | - | - | 200 staff listing | 401, 403, 500 |
| POST | /api/v1/admin/staff | Bearer Admin | - | name, email, phone, password, roleId | 201/200 staff create result | 400, 409, 500 |
| PUT | /api/v1/admin/staff/:id | Bearer Admin | - | name?, phone?, roleId?, isActive? | 200 update result | 400, 404, 500 |
| DELETE | /api/v1/admin/staff/:id | Bearer Admin | - | - | 200 delete/deactivate result | 404, 500 |
| GET | /api/v1/admin/roles | Bearer Admin | - | - | 200 role listing | 401, 403, 500 |
| POST | /api/v1/admin/delivery/assign | Bearer Admin | - | orderId, deliveryStaffId | 200 assignment result | 400, 404, 409, 500 |

## Kitchen

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/kitchen/dashboard/stats | Bearer Kitchen/Admin | - | - | 200 dashboard stats | 401, 403, 500 |
| GET | /api/v1/kitchen/orders | Bearer Kitchen/Admin | status? | - | 200 kitchen order queue | 401, 403, 500 |
| PUT | /api/v1/kitchen/orders/:orderId/status | Bearer Kitchen/Admin | - | status, notes? | 200 update result | 400, 401, 403, 404, 500 |
| GET | /api/v1/kitchen/menu-items | Bearer Kitchen/Admin | - | - | 200 menu item reference list | 401, 403, 500 |
| GET | /api/v1/kitchen/stock/daily | Bearer Kitchen/Admin | date? | - | 200 stock records | 401, 403, 500 |
| POST | /api/v1/kitchen/stock/daily | Bearer Kitchen/Admin | - | menuItemId, openingQuantity, stockDate? | 200 update result | 400, 401, 403, 500 |
| POST | /api/v1/kitchen/stock/daily/bulk | Bearer Kitchen/Admin | - | items[] | 200 bulk update result | 400, 401, 403, 500 |

## Cashier

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/cashier/dashboard/stats | Bearer Cashier/Admin | - | - | 200 dashboard stats | 401, 403, 500 |
| GET | /api/v1/cashier/orders | Bearer Cashier/Admin | status?, limit?, offset? | - | 200 cashier order listing | 401, 403, 500 |
| POST | /api/v1/cashier/walkin-order | Bearer Cashier/Admin | - | customerId?, items[], paymentMethod, notes? | 201/200 walk-in order result | 400, 401, 403, 500 |
| PUT | /api/v1/cashier/orders/:orderId/confirm | Bearer Cashier/Admin | - | - | 200 order confirmed | 400, 401, 403, 404, 500 |
| PUT | /api/v1/cashier/orders/:orderId/cancel | Bearer Cashier/Admin | - | reason | 200 order cancelled | 400, 401, 403, 404, 500 |
| GET | /api/v1/cashier/customers | Bearer Cashier/Admin | search, limit, offset | - | 200 customer listing | 401, 403, 500 |
| GET | /api/v1/cashier/customers/:customerId | Bearer Cashier/Admin | - | - | 200 customer details | 401, 403, 404, 500 |
| POST | /api/v1/cashier/customers | Bearer Cashier/Admin | - | name, phone, email?, address?, password? | 201 customer creation result | 400, 409, 500 |
| PUT | /api/v1/cashier/customers/:customerId | Bearer Cashier/Admin | - | name?, phone?, email?, accountStatus? | 200 update result | 400, 404, 500 |

## Upload

| Method | Endpoint | Auth | Query | Request Body | Success Response | Error Responses |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/v1/upload/folders | Bearer token | - | - | 200 upload folder listing | 401, 500 |
| POST | /api/v1/upload/image | Bearer token | - | multipart: image, folder? | 200 upload result | 400, 401, 500 |
