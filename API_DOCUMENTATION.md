# Voleena Foods API Documentation

## Base URL
```
Development: http://localhost:3001/api/v1
Production: https://api.voleenafoods.lk/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": {},
  "error": "Error message if success is false"
}
```

---

## Authentication Endpoints

### POST /auth/register/customer
Register a new customer account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0771234567",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "customer": { "customer_id": 1, "name": "John Doe", ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### POST /auth/login
Login for customers and staff.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "userType": "customer" // or "staff"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "John Doe", "role": "Customer" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### POST /auth/logout
Logout and blacklist current token.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

### POST /auth/request-password-reset
Request password reset OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "userType": "customer"
}
```

**Response:** `200 OK`

### POST /auth/verify-otp
Verify OTP code.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "userType": "customer"
}
```

**Response:** `200 OK`

### POST /auth/reset-password
Reset password with verified OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123!",
  "userType": "customer"
}
```

**Response:** `200 OK`

---

## Menu Endpoints

### GET /menu/items
Get all active menu items.

**Query Parameters:**
- `category_id` (optional): Filter by category
- `available` (optional): Filter by availability

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "menu_item_id": 1,
      "name": "Chicken Rice",
      "description": "Delicious chicken rice",
      "price": 450.00,
      "category": { "name": "Main Dishes" },
      "is_available": true
    }
  ]
}
```

### GET /menu/items/:id
Get menu item details.

**Response:** `200 OK`

### POST /menu/items
Create new menu item (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Chicken Rice",
  "description": "Delicious chicken rice",
  "price": 450.00,
  "category_id": 1,
  "image_url": "https://..."
}
```

**Response:** `201 Created`

### PUT /menu/items/:id
Update menu item (Admin only).

**Response:** `200 OK`

### DELETE /menu/items/:id
Delete menu item (Admin only).

**Response:** `200 OK`

---

## Order Endpoints

### POST /orders
Create new order.

**Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{
  "order_type": "DELIVERY",
  "address_id": 1,
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2
    },
    {
      "combo_id": 1,
      "quantity": 1
    }
  ],
  "promotion_code": "SAVE10",
  "special_instructions": "Extra spicy"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "order_number": "VF2602160001",
    "total_amount": 1350.00,
    "discount_amount": 135.00,
    "delivery_fee": 150.00,
    "final_amount": 1365.00,
    "status": "PENDING"
  }
}
```

### GET /orders
Get customer's orders.

**Headers:** `Authorization: Bearer <customer_token>`

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`

### GET /orders/:id
Get order details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "order_number": "VF2602160001",
    "status": "CONFIRMED",
    "items": [
      {
        "menu_item": { "name": "Chicken Rice" },
        "quantity": 2,
        "unit_price": 450.00,
        "subtotal": 900.00
      }
    ],
    "delivery": {
      "status": "PENDING",
      "address": { "address_line1": "123 Main St" }
    }
  }
}
```

### POST /orders/:id/confirm
Confirm order (Staff only).

**Headers:** `Authorization: Bearer <staff_token>`

**Response:** `200 OK`

### PATCH /orders/:id/status
Update order status (Staff only).

**Headers:** `Authorization: Bearer <staff_token>`

**Request Body:**
```json
{
  "status": "PREPARING",
  "notes": "Started preparation"
}
```

**Response:** `200 OK`

### POST /orders/:id/cancel
Cancel order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Changed mind"
}
```

**Response:** `200 OK`

---

## Stock Management Endpoints

### GET /stock/daily
Get daily stock for all items (Staff only).

**Headers:** `Authorization: Bearer <staff_token>`

**Query Parameters:**
- `date` (optional): Stock date (YYYY-MM-DD)

**Response:** `200 OK`

### POST /stock/opening
Set opening stock (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "menu_item_id": 1,
  "stock_date": "2026-02-17",
  "opening_quantity": 100
}
```

**Response:** `201 Created`

### POST /stock/adjust
Adjust stock (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "menu_item_id": 1,
  "stock_date": "2026-02-16",
  "adjustment_quantity": -5,
  "reason": "Damaged items"
}
```

**Response:** `200 OK`

### GET /stock/movements
Get stock movement history (Staff only).

**Headers:** `Authorization: Bearer <staff_token>`

**Query Parameters:**
- `menu_item_id`: Menu item ID
- `start_date`: Start date
- `end_date`: End date

**Response:** `200 OK`

---

## Payment Endpoints

### POST /payments/create-intent
Create payment intent (Stripe).

**Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{
  "order_id": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

### POST /payments/payhere/initiate
Initiate PayHere payment.

**Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{
  "order_id": 1
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "merchant_id": "xxx",
    "order_id": "VF2602160001",
    "amount": "1365.00",
    "hash": "xxx",
    ...
  }
}
```

### POST /payments/payhere/notify
PayHere webhook endpoint (Public).

**Request Body:** PayHere notification data

**Response:** `200 OK`

### POST /payments/stripe/webhook
Stripe webhook endpoint (Public).

**Headers:** `Stripe-Signature: xxx`

**Request Body:** Stripe event data

**Response:** `200 OK`

---

## Combo Pack Endpoints

### GET /combos
Get all active combo packs.

**Response:** `200 OK`

### GET /combos/:id
Get combo pack details.

**Response:** `200 OK`

### POST /combos
Create combo pack (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Family Pack",
  "description": "Perfect for family meals",
  "price": 2500.00,
  "discount_type": "FIXED_PRICE",
  "schedule_start_date": "2026-02-20",
  "schedule_end_date": "2026-02-28",
  "items": [
    { "menu_item_id": 1, "quantity": 4 },
    { "menu_item_id": 2, "quantity": 2 }
  ]
}
```

**Response:** `201 Created`

---

## Delivery Endpoints

### GET /delivery/available-staff
Get available delivery staff (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:** `200 OK`

### POST /delivery/:id/assign
Assign delivery staff to order (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "delivery_staff_id": 5
}
```

**Response:** `200 OK`

### PATCH /delivery/:id/status
Update delivery status (Delivery staff only).

**Headers:** `Authorization: Bearer <delivery_token>`

**Request Body:**
```json
{
  "status": "PICKED_UP"
}
```

**Response:** `200 OK`

---

## Customer Endpoints

### GET /customers/profile
Get customer profile.

**Headers:** `Authorization: Bearer <customer_token>`

**Response:** `200 OK`

### PUT /customers/profile
Update customer profile.

**Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "0771234567"
}
```

**Response:** `200 OK`

### POST /customers/addresses
Add new address.

**Headers:** `Authorization: Bearer <customer_token>`

**Request Body:**
```json
{
  "address_line1": "123 Main St",
  "city": "Gampaha",
  "latitude": 7.0000,
  "longitude": 80.0000,
  "is_default": true
}
```

**Response:** `201 Created`

### GET /customers/addresses
Get all addresses.

**Headers:** `Authorization: Bearer <customer_token>`

**Response:** `200 OK`

---

## Staff Endpoints

### POST /staff
Create staff account (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@voleena.lk",
  "phone": "0771234567",
  "role_id": 2,
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`

### GET /staff
Get all staff (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:** `200 OK`

### PUT /staff/:id
Update staff (Admin only).

**Response:** `200 OK`

### DELETE /staff/:id
Delete staff (Admin only).

**Response:** `200 OK`

---

## Reports Endpoints

### GET /reports/daily-sales
Get daily sales report (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `start_date`: Start date
- `end_date`: End date

**Response:** `200 OK`

### GET /reports/popular-items
Get popular menu items (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:** `200 OK`

### GET /reports/stock-summary
Get stock summary (Admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Response:** `200 OK`

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate entry |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| General API | 100 requests / 15 minutes |
| Authentication | 5 attempts / 15 minutes |
| OTP Requests | 3 requests / 15 minutes |
| Order Creation | 10 orders / 5 minutes |
| Password Reset | 3 attempts / 1 hour |

---

## Webhooks

### PayHere Notification
**URL:** `POST /api/v1/payments/payhere/notify`

Receives payment notifications from PayHere gateway.

### Stripe Webhook
**URL:** `POST /api/v1/payments/stripe/webhook`

Receives payment events from Stripe.

**Required Header:** `Stripe-Signature`

---

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@voleena.lk",
    "password": "Admin@123",
    "userType": "staff"
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3001/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "order_type": "DELIVERY",
    "address_id": 1,
    "items": [{"menu_item_id": 1, "quantity": 2}]
  }'
```
