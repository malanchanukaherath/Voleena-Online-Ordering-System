# ORDERING SYSTEM IMPLEMENTATION GUIDE

## Overview
This document describes the complete implementation of the Voleena Foods ordering system with the following features:
- Add to Cart functionality with validation
- Stock management with race condition prevention
- Google Maps delivery distance validation
- Automatic delivery staff assignment
- Transaction-safe order creation
- Frontend map integration

---

## PART 1: Add to Cart (FR08)

### Backend Cart Validation API
**Endpoint:** `POST /api/v1/cart/validate`

**Purpose:** Validates cart items against current stock before checkout

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": 1,
      "comboId": null,
      "quantity": 2,
      "notes": "Extra spicy"
    },
    {
      "menuItemId": null,
      "comboId": 2,
      "quantity": 1,
      "notes": null
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "items": [
      {
        "id": 1,
        "type": "menu",
        "name": "Biryani",
        "price": 450.00,
        "quantity": 2,
        "availability": {
          "isAvailable": true,
          "availableQty": 10
        }
      }
    ]
  }
}
```

### Database Schema Integration

**Related Tables:**
- `menu_item` - Store menu item definitions
- `combo_pack` - Store combo pack definitions
- `daily_stock` - Track stock for each day
- `order` - Store orders
- `order_item` - Store order items

### Frontend Cart Storage

**File:** `client/src/utils/cartStorage.js`

**Cart Item Structure:**
```javascript
{
  id: 1,                    // Menu item ID or Combo ID
  type: 'menu',             // 'menu' or 'combo'
  name: 'Biryani',          // Display name
  price: 450.00,            // Price
  image: 'url/to/image',    // Optional image
  notes: 'Extra spicy',     // Special instructions
  quantity: 2,              // Quantity
  addedAt: '2026-02-19T...' // Timestamp
}
```

**Functions Available:**
```javascript
// Get current cart
const items = getCart();

// Add item to cart
addToCart({id: 1, type: 'menu', name: 'Biryani', price: 450}, 2);

// Update item (quantity, notes)
updateCartItem(1, 'menu', { quantity: 3, notes: 'No onions' });

// Remove item
removeCartItem(1, 'menu');

// Clear entire cart
clearCart();

// Get summary (itemCount, subtotal, isEmpty)
const summary = getCartSummary();

// Get total breakdown
const total = getCartTotal('DELIVERY'); // Returns {subtotal, deliveryFee, tax, total}
```

### Frontend Cart Validation

- Validate in real-time when user adds items
- Call `/api/v1/cart/validate` before checkout
- Display out-of-stock items clearly
- Prevent checkout if items unavailable

---

## PART 2: Stock Validation with Race Condition Prevention

### Transaction Architecture

**Isolation Level:** `SERIALIZABLE`

**Purpose:** Prevents race conditions where multiple simultaneous orders could over-sell stock.

**Implementation in `server/services/orderService.js`:**

```javascript
async createOrderWithTransaction(params) {
    // Use SERIALIZABLE isolation level
    const transaction = await sequelize.transaction({
        isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
        // 1. Lock and validate stock (SELECT FOR UPDATE)
        await validateStockWithLocking(items, today, transaction);

        // 2. Calculate totals
        // 3. Validate delivery distance
        // 4. Create order
        // 5. Create order items
        // 6. Create delivery record
        
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
```

### Row-Level Locking

**Available in Sequelize through:**
```javascript
DailyStock.findOne({
    where: { MenuItemID: id, StockDate: date },
    transaction,
    lock: transaction.LOCK.UPDATE  // SELECT FOR UPDATE
});
```

### Stock Deduction Process

1. **Lock** daily_stock rows for each item (SELECT FOR UPDATE)
2. **Validate** ClosingQuantity >= requested quantity
3. **Deduct** SoldQuantity += quantity ordered
4. **Create** stock_movement records for audit trail
5. **Commit** transaction atomically

**SQL Generated:**
```sql
START TRANSACTION;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Lock stock rows
SELECT * FROM daily_stock WHERE menu_item_id = 1 AND stock_date = '2026-02-19' FOR UPDATE;

-- Update sold quantity
UPDATE daily_stock SET sold_quantity = sold_quantity + 2 WHERE stock_id = 1;

-- Log movement
INSERT INTO stock_movement (menu_item_id, stock_date, change_type, quantity_change, reference_type, reference_id)
VALUES (1, '2026-02-19', 'SALE', 2, 'ORDER', 123);

COMMIT;
```

### Index Optimization

**Required Indexes:**
```sql
-- Unique index for daily_stock lookup
CREATE UNIQUE INDEX uk_item_date ON daily_stock(menu_item_id, stock_date);

-- Partial index for available stock
CREATE INDEX idx_closing_qty ON daily_stock(closing_quantity) WHERE closing_quantity > 0;

-- Order lookup by customer
CREATE INDEX idx_customer_order ON order(customer_id, created_at DESC);
```

---

## PART 3: Google Maps Delivery Distance Validation (FR09)

### Distance Validator Utility

**File:** `server/utils/distanceValidator.js`

**Features:**
- Google Maps Distance Matrix API (primary)
- Haversine fallback calculation
- 15km service area limit
- Driving mode (FR09 requirement)

### Validation Flow

**Checkout → Create Order:**
1. Fetch address from `address` table
2. Check if Latitude/Longitude exist
3. If missing: Geocode address using `geocodeAddress()`
4. Call `validateDeliveryDistanceWithFallback(lat, lng)`
5. If distance > 15km: Reject order
6. Save distance in `delivery.distance_km` column

### API Endpoints

**1. Distance Validation (Public)**
```
POST /api/v1/delivery/validate-distance

Request:
{
  "latitude": 6.9271,
  "longitude": 80.7744
}

OR provide address to geocode:
{
  "address": {
    "addressLine1": "123 Main St",
    "city": "Colombo",
    "district": "Western"
  }
}

Response:
{
  "success": true,
  "data": {
    "isValid": true,
    "distance": 8.45,
    "maxDistance": 15,
    "method": "google_maps"
  }
}
```

**2. Address Geocoding**
```javascript
const geocoded = await geocodeAddress('123 Main St, Colombo, Western');
// Returns: { lat, lng, formattedAddress }
```

### Environment Configuration

**Required .env variables:**
```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
RESTAURANT_LATITUDE=6.9271
RESTAURANT_LONGITUDE=80.7744
MAX_DELIVERY_DISTANCE_KM=15
```

### Fallback Mechanism

If Google Maps API fails:
1. Calculate straight-line distance using Haversine formula
2. Apply 20% buffer to approximate road distance
3. Use for validation

**Distance Calculation:**
```javascript
// Haversine formula (in distanceValidator.js)
const R = 6371; // Earth radius in km
const dLat = toRadians(lat2 - lat1);
const dLon = toRadians(lng2 - lng1);
const a = Math.sin(dLat/2)² + cos(lat1) * cos(lat2) * sin(dLon/2)²;
const distance = 2 * R * atan2(√a, √(1-a));
```

---

## PART 4: Delivery Record Creation

### Delivery Table Structure

**Table:** `delivery`

**Key Fields:**
```sql
CREATE TABLE delivery (
  delivery_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT UNIQUE NOT NULL,
  delivery_staff_id INT DEFAULT NULL,
  address_id INT NOT NULL,
  status ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'),
  distance_km DECIMAL(5,2),
  assigned_at TIMESTAMP NULL,
  picked_up_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Creation During Order Checkout

**Inside Transact order.OrderType = 'DELIVERY':**

```javascript
if (orderType === 'DELIVERY') {
    await Delivery.create({
        OrderID: order.OrderID,
        AddressID: addressId,
        Status: 'PENDING',
        DistanceKm: deliveryDistance
    }, { transaction });
}
```

**Status Lifecycle:**
1. **PENDING** → Order created, awaiting confirmation
2. **ASSIGNED** → Staff assigned automatically (FR26)
3. **PICKED_UP** → Driver picked up order from restaurant
4. **IN_TRANSIT** → Driver on the way
5. **DELIVERED** → Order delivered successfully
6. **FAILED** → Delivery attempt failed

---

## PART 5: Delivery Staff Auto-Assignment (FR26)

### Staff Availability Table

**Table:** `delivery_staff_availability`

**Structure:**
```sql
CREATE TABLE delivery_staff_availability (
  availability_id INT PRIMARY KEY AUTO_INCREMENT,
  delivery_staff_id INT UNIQUE NOT NULL,
  is_available TINYINT(1) DEFAULT 1,
  current_order_id INT DEFAULT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sequelize Model

**File:** `server/models/DeliveryStaffAvailability.js`

```javascript
const DeliveryStaffAvailability = sequelize.define('DeliveryStaffAvailability', {
    AvailabilityID: { primaryKey: true, autoIncrement: true },
    DeliveryStaffID: { allowNull: false, unique: true },
    IsAvailable: { type: BOOLEAN, defaultValue: true },
    CurrentOrderID: { allowNull: true }
});
```

### Auto-Assignment Logic

**Triggered:** When order status changes to `READY`

**Algorithm:**
```javascript
async autoAssignDeliveryStaff(orderId) {
    // 1. Find earliest available delivery staff
    const availableStaff = await DeliveryStaffAvailability.findOne({
        where: { IsAvailable: true },
        order: [['LastUpdated', 'ASC']]  // FIFO
    });

    if (!availableStaff) {
        console.log('No available staff - order stays PENDING');
        return null;
    }

    // 2. Mark staff as unavailable
    await availableStaff.update({
        IsAvailable: false,
        CurrentOrderID: orderId
    });

    // 3. Update delivery record
    await Delivery.update(
        {
            DeliveryStaffID: availableStaff.DeliveryStaffID,
            Status: 'ASSIGNED',
            AssignedAt: new Date()
        },
        { where: { OrderID: orderId } }
    );

    return availableStaff.DeliveryStaffID;
}
```

### Staff Availability Management

**When staff becomes available:**
```javascript
// After delivery completion
await DeliveryStaffAvailability.update(
    { IsAvailable: true, CurrentOrderID: null },
    { where: { DeliveryStaffID: staffId } }
);
```

**Get available staff (Admin):**
```
GET /api/v1/delivery/staff/available

Response:
{
  "success": true,
  "data": {
    "count": 3,
    "staff": [
      { id: 1, name: "John", phone: "...", lastUpdated: "..." },
      { id: 2, name: "Jane", phone: "...", lastUpdated: "..." }
    ]
  }
}
```

---

## PART 6: Frontend Map Integration

### Checkout Page Components

**File:** `client/src/pages/Checkout.jsx`

**Features:**
1. **Distance Display** - Shows calculated distance when user enters address
2. **Validation Status** - Green checkmark or red error for service area
3. **Method Indicator** - Shows calculation method (Google Maps vs approximation)
4. **Submit Button State** - Disables if distance invalid for delivery orders

### Real-Time Distance Validation

**When Address Changes:**
```javascript
const validateDeliveryAddressDistance = async () => {
    const response = await validateDeliveryDistance({
        address: {
            addressLine1: formData.addressLine1,
            city: formData.city,
            district: formData.postalCode
        }
    });

    setDistanceInfo({
        isValid: response.data.data.isValid,
        distance: response.data.data.distance,
        maxDistance: 15
    });
};
```

**UI Display:**
```jsx
{distanceInfo && (
  <div className={distanceInfo.isValid ? 'bg-green-50' : 'bg-red-50'}>
    Delivery Distance: {distanceInfo.distance.toFixed(2)} km
    {distanceInfo.isValid 
      ? '✓ Within service area'
      : '✗ Outside service area'}
  </div>
)}
```

### Cart Summary Display

```jsx
// Shows:
- Subtotal: LKR 1,234.00
- Delivery Fee: LKR 150.00 (if DELIVERY)
- Tax (8%): LKR 110.72
- Total: LKR 1,494.72
```

### Checkout Flow

1. **Select Order Type** (DELIVERY or TAKEAWAY)
2. **Enter Contact Info** (Name, Email, Phone)
3. **Enter/Select Address** (Triggered distance validation)
4. **View Distance** (Red or green status)
5. **Validate Cart** (API call to /cart/validate if needed)
6. **Select Payment Method**
7. **Add Special Instructions** (Optional)
8. **Place Order** (Disabled if invalid distance)

---

## PART 7: Validation Rules  

### Input Validation Utilities

**File:** `server/utils/validationUtils.js`

```javascript
// Sri Lankan Phone Number (local or international)
validateSriLankanPhone('+94701234567')  // ✓
validateSriLankanPhone('0701234567')    // ✓
validateSriLankanPhone('94701234567')   // ✓

// Email Validation
validateEmail('customer@example.com')   // ✓

// Coordinates Validation
validateCoordinates(6.9271, 80.7744)   // ✓

// Address Line
validateAddressLine('123 Main Street') // ✓ (5-255 chars)

// Cart Items
validateCartItems(items)  // Returns {isValid, errors}

// Order Type
validateOrderType('DELIVERY')  // ✓ DELIVERY|TAKEAWAY

// Payment Method
validatePaymentMethod('CASH')  // ✓ CASH|CARD|ONLINE|WALLET

// Quantity
validateQuantity(2)  // ✓ (1-999, integer)

// Postal Code
validatePostalCode('10100')  // ✓ (5-10 digits)
```

### Backend Validation Endpoints

**Cart Validation:**
```
POST /api/v1/cart/validate
- Validates items exist and are active
- Checks stock availability
- Returns errors for each invalid item
```

**Distance Validation:**
```
POST /api/v1/delivery/validate-distance
- Validates coordinates or geocodes address
- Calculates distance using Google Maps
- Falls back to Haversine formula
```

### Frontend Validation

**Form Validation (Checkout):**
```javascript
const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!validateEmail(formData.email)) newErrors.email = 'Invalid email';
    if (!validateSriLankanPhone(formData.phone)) newErrors.phone = 'Invalid phone';
    
    if (formData.orderType === 'DELIVERY') {
        if (!validateAddressLine(formData.addressLine1)) {
            newErrors.addressLine1 = 'Required';
        }
        if (!distanceInfo?.isValid) {
            newErrors.distance = 'Address outside service area';
        }
    }
    
    return Object.keys(newErrors).length === 0;
};
```

### Data Sanitization

```javascript
// Remove XSS vectors
const sanitized = sanitizeText(input);

// Trim and limit length
const clean = input.trim().substring(0, 1000);
```

---

## Routing & API Endpoints Summary

### Cart Routes
```
POST   /api/v1/cart/validate        - Validate cart items
POST   /api/v1/cart/summary         - Get cart summary with prices
```

### Delivery Routes
```
POST   /api/v1/delivery/validate-distance  - Validate address distance
GET    /api/v1/delivery/staff/available    - List available staff (admin)
```

### Order Routes
```
POST   /api/v1/orders                      - Create order
GET    /api/v1/orders                      - List orders
GET    /api/v1/orders/:id                  - Get order details
POST   /api/v1/orders/:id/confirm          - Confirm order
PATCH  /api/v1/orders/:id/status           - Update order status
DELETE /api/v1/orders/:id                  - Cancel order
```

---

## Database Migrations Required

**None** - All tables already exist in `database/production_schema.sql`

**Missing Model:** `DeliveryStaffAvailability.js` - **Created**

**Updated Models:**
- `Delivery.js` - Fixed field mappings (snake_case)

---

## Environment Configuration

**.env File:**
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=voleena_foods_db

# Google Maps
GOOGLE_MAPS_API_KEY=your_key_here
RESTAURANT_LATITUDE=6.9271
RESTAURANT_LONGITUDE=80.7744
MAX_DELIVERY_DISTANCE_KM=15

# Server
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=production
JWT_SECRET=your_secret_key_here

# Delivery Fee
DELIVERY_FEE=150
```

---

## Error Handling

### Stock Validation Errors
```json
{
  "success": false,
  "message": "Insufficient stock for Biryani. Available: 2, Requested: 5"
}
```

### Distance Validation Errors
```json
{
  "success": false,
  "message": "Delivery address is outside service area (25.50km > 15km)"
}
```

### Transaction Rollback
All changes rolled back if any step fails:
- Stock deductions
- Order creation
- Delivery record creation
- Order items

---

## Testing Checklist

- [ ] Add menu items to cart
- [ ] Add combo packs to cart
- [ ] Update cart item quantity and notes
- [ ] Validate cart API returns correct availability
- [ ] Insufficient stock prevents order
- [ ] Distance validation works (< 15km passes, > 15km fails)
- [ ] Fallback calculation works when API fails
- [ ] Delivery record created for DELIVERY orders
- [ ] TAKEAWAY orders don't create delivery records
- [ ] Order status transitions trigger auto-assignment
- [ ] Staff becomes "assigned" after order READY
- [ ] Multiple concurrent orders don't over-sell stock
- [ ] Transactions rollback on any error
- [ ] Frontend cart persists to localStorage
- [ ] Checkout page shows distance validation
- [ ] Submit button disabled if distance invalid

---

## Production Deployment Notes

1. **Database:** Ensure `production_schema.sql` is applied
2. **Secrets:** Set all .env variables
3. **API Keys:** Google Maps API key must be valid for domain
4. **Indices:** Database indices created for performance
5. **Transactions:** Configured to SERIALIZABLE isolation
6. **Geocoding:** May be rate-limited on high volume

---

## Performance Considerations

**Stock Validation:** O(n) where n = number of items
**Distance Calculation:** ~200-300ms (Google Maps API)
**Row-Level Locks:** Released when transaction commits
**Fallback Calculation:** ~1ms (Haversine)

---

## Future Enhancements

1. Batch geocoding for multiple addresses
2. Caching of distance calculations
3. Delivery time estimates using Duration Matrix API
4. Real-time driver tracking with WebSockets
5. Fuel surcharge based on distance
6. Zone-based delivery pricing
7. Scheduled deliveries

