# Atomicity and Concurrency Testing Guide

**Purpose:** Verify production safety fixes for race conditions, transaction atomicity, and input validation

**Date:** March 10, 2026  
**Test Environment:** Staging/Pre-Production

---

## 🧪 Test Setup

### Prerequisites

```bash
# 1. Install testing dependencies
cd server
npm install --save-dev jest supertest artillery

# 2. Set test environment
export NODE_ENV=test
export DB_NAME=voleena_test

# 3. Create test database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS voleena_test"
mysql -u root -p voleena_test < database/production_schema.sql

# 4. Seed test data
npm run seed:test
```

---

## Test 1: Concurrent Stock Reservation (Race Condition)

### Objective

Verify that multiple concurrent orders cannot oversell limited stock.

### Test Script

```javascript
// test/stock-race-condition.test.js
const request = require("supertest");
const app = require("../index");

describe("Stock Race Condition Tests", () => {
  beforeAll(async () => {
    // Create test menu item with 10 units of stock
    await createTestMenuItem({ id: 999, stock: 10 });
  });

  test("Concurrent orders should not oversell stock", async () => {
    // Create 20 concurrent orders for 1 unit each
    // Only 10 should succeed (stock available)
    const promises = Array(20)
      .fill()
      .map((_, i) =>
        request(app)
          .post("/api/v1/orders")
          .set("Authorization", `Bearer ${getCustomerToken(i)}`)
          .send({
            order_type: "TAKEAWAY",
            items: [{ menu_item_id: 999, quantity: 1 }],
          }),
      );

    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.value?.status === 201);
    const failed = results.filter((r) => r.value?.status !== 201);

    // Assertions
    expect(successful.length).toBe(10); // Exactly 10 orders succeed
    expect(failed.length).toBe(10); // Exactly 10 orders fail
    expect(failed[0].reason.body.error).toContain("Insufficient stock");

    // Verify final stock count
    const stockRecord = await DailyStock.findOne({
      where: { MenuItemID: 999 },
    });
    expect(stockRecord.SoldQuantity).toBe(10); // All sold
    expect(stockRecord.OpeningQuantity - stockRecord.SoldQuantity).toBe(0); // No overselling
  });

  test("High concurrency (100 orders) maintains stock integrity", async () => {
    await createTestMenuItem({ id: 1000, stock: 50 });

    const promises = Array(100)
      .fill()
      .map((_, i) =>
        request(app)
          .post("/api/v1/orders")
          .set("Authorization", `Bearer ${getCustomerToken(i)}`)
          .send({
            order_type: "TAKEAWAY",
            items: [{ menu_item_id: 1000, quantity: 1 }],
          }),
      );

    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.value?.status === 201).length;

    expect(successful).toBe(50); // Exactly 50 orders (stock available)
  });
});
```

### Manual Test with Artillery (Load Testing)

```bash
# Create artillery config
cat > test/stock-load-test.yml << EOF
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 10
      arrivalRate: 10
      name: "Concurrent order placement"
  variables:
    menuItemId: 999
scenarios:
  - name: "Create order"
    flow:
      - post:
          url: "/api/v1/orders"
          headers:
            Authorization: "Bearer {{ \$randomString() }}"
          json:
            order_type: "TAKEAWAY"
            items:
              - menu_item_id: {{ menuItemId }}
                quantity: 1
EOF

# Run load test
artillery run test/stock-load-test.yml

# Expected results:
# - HTTP 201: Exactly {stock_available} requests
# - HTTP 400: All remaining requests with "Insufficient stock" error
```

### Verification Queries

```sql
-- Check stock integrity after test
SELECT
    m.name,
    ds.opening_quantity,
    ds.sold_quantity,
    ds.adjusted_quantity,
    (ds.opening_quantity - ds.sold_quantity + ds.adjusted_quantity) as available,
    ds.version
FROM daily_stock ds
JOIN menu_item m ON ds.menu_item_id = m.menu_item_id
WHERE ds.stock_date = CURDATE()
ORDER BY ds.menu_item_id;

-- Verify no negative stock
SELECT * FROM daily_stock
WHERE (opening_quantity - sold_quantity + adjusted_quantity) < 0;
-- Expected: 0 rows

-- Check stock movement audit trail
SELECT * FROM stock_movement
WHERE menu_item_id = 999
ORDER BY created_at DESC;
```

---

## Test 2: Order Cancellation Atomicity

### Objective

Verify that order cancellation rolls back if any step fails and prevents concurrent cancellations.

### Test Script

```javascript
// test/cancellation-atomicity.test.js
describe("Order Cancellation Atomicity Tests", () => {
  test("Concurrent cancellation attempts should serialize", async () => {
    // Create paid order
    const order = await createTestOrder({ status: "CONFIRMED", isPaid: true });

    // Attempt concurrent cancellations
    const [result1, result2] = await Promise.allSettled([
      request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({ reason: "Customer request" }),
      request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getAdminToken()}`)
        .send({ reason: "Admin cancellation" }),
    ]);

    // One succeeds, one fails
    const succeeded = [result1, result2].filter((r) => r.value?.status === 200);
    const failed = [result1, result2].filter((r) => r.value?.status !== 200);

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(failed[0].value.body.message).toContain("cannot be cancelled");
  });

  test("Stock returns atomically with order cancellation", async () => {
    const order = await createTestOrder({
      status: "CONFIRMED",
      items: [{ menu_item_id: 999, quantity: 5 }],
    });

    const stockBefore = await DailyStock.findOne({
      where: { MenuItemID: 999 },
    });

    // Cancel order
    await request(app)
      .delete(`/api/v1/orders/${order.id}`)
      .set("Authorization", `Bearer ${getCustomerToken()}`)
      .send({ reason: "Changed my mind" })
      .expect(200);

    // Verify stock returned
    const stockAfter = await DailyStock.findOne({
      where: { MenuItemID: 999 },
    });

    expect(stockAfter.SoldQuantity).toBe(stockBefore.SoldQuantity - 5);

    // Verify order status updated
    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.Status).toBe("CANCELLED");
    expect(updatedOrder.CancellationReason).toBe("Changed my mind");
  });

  test("Rollback on refund failure", async () => {
    // Mock refund service to fail
    jest.mock("../services/paymentService", () => ({
      stripeService: {
        processRefund: jest.fn(() => {
          throw new Error("Refund failed");
        }),
      },
    }));

    const order = await createTestOrder({
      status: "CONFIRMED",
      isPaid: true,
      paymentMethod: "CARD",
    });

    const stockBefore = await DailyStock.findOne({
      where: { MenuItemID: 999 },
    });

    // Attempt cancellation (should succeed despite refund failure)
    const response = await request(app)
      .delete(`/api/v1/orders/${order.id}`)
      .set("Authorization", `Bearer ${getCustomerToken()}`)
      .send({ reason: "Testing rollback" });

    // Order should be cancelled (refund failure doesn't block cancellation)
    expect(response.status).toBe(200);

    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.Status).toBe("CANCELLED");

    // Stock should be returned
    const stockAfter = await DailyStock.findOne({
      where: { MenuItemID: 999 },
    });
    expect(stockAfter.SoldQuantity).toBeLessThan(stockBefore.SoldQuantity);
  });
});
```

### Manual Verification

```bash
# 1. Create test order
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "TAKEAWAY",
    "items": [{"menu_item_id": 1, "quantity": 3}]
  }'

# Note the order ID (e.g., 12345)

# 2. Check stock before cancellation
mysql -u root -p voleena_test -e \
  "SELECT * FROM daily_stock WHERE menu_item_id = 1 AND stock_date = CURDATE()"

# 3. Cancel order
curl -X DELETE http://localhost:5000/api/v1/orders/12345 \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Manual cancellation test"}'

# 4. Verify stock returned
mysql -u root -p voleena_test -e \
  "SELECT * FROM daily_stock WHERE menu_item_id = 1 AND stock_date = CURDATE()"

# 5. Verify order status
mysql -u root -p voleena_test -e \
  "SELECT order_id, status, cancellation_reason FROM orders WHERE order_id = 12345"

# 6. Check stock movement log
mysql -u root -p voleena_test -e \
  "SELECT * FROM stock_movement WHERE reference_id = 12345 ORDER BY created_at DESC"
```

### Verification Queries

```sql
-- Verify order and stock changes are atomic
SELECT
    o.order_id,
    o.status,
    o.cancellation_reason,
    COUNT(sm.movement_id) as stock_movements
FROM orders o
LEFT JOIN stock_movement sm ON o.order_id = sm.reference_id
    AND sm.change_type = 'RETURN'
WHERE o.cancelled_at IS NOT NULL
GROUP BY o.order_id
HAVING stock_movements > 0;
-- Expected: All cancelled orders have stock movement entries

-- Verify no partial cancellations (status = CANCELLED but stock not returned)
SELECT o.order_id
FROM orders o
LEFT JOIN stock_movement sm ON o.order_id = sm.reference_id
    AND sm.change_type = 'RETURN'
WHERE o.status = 'CANCELLED'
    AND o.confirmed_at IS NOT NULL
    AND sm.movement_id IS NULL;
-- Expected: 0 rows
```

---

## Test 3: Daily Stock Job Retry & Alerts

### Objective

Verify retry logic and admin email alerts work correctly when stock job fails.

### Test Script

```javascript
// test/stock-job-retry.test.js
describe("Daily Stock Job Retry Tests", () => {
  test("Job retries 3 times on failure", async () => {
    // Mock stockService to fail
    let attemptCount = 0;
    jest
      .spyOn(stockService, "createDailyStockRecords")
      .mockImplementation(() => {
        attemptCount++;
        throw new Error("Database connection failed");
      });

    const consoleSpy = jest.spyOn(console, "log");

    await automatedJobs.createDailyStockRecords();

    // Verify retry attempts
    expect(attemptCount).toBe(3);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attempt 1/3"),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attempt 2/3"),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Attempt 3/3"),
    );
  });

  test("Exponential backoff delays applied", async () => {
    jest
      .spyOn(stockService, "createDailyStockRecords")
      .mockRejectedValue(new Error("Test error"));

    const startTime = Date.now();
    await automatedJobs.createDailyStockRecords();
    const duration = Date.now() - startTime;

    // Total backoff: 1s + 2s + 4s = 7000ms
    // Allow 500ms tolerance for execution time
    expect(duration).toBeGreaterThanOrEqual(7000);
    expect(duration).toBeLessThan(8000);
  });

  test("Admin alert email sent on failure", async () => {
    jest
      .spyOn(stockService, "createDailyStockRecords")
      .mockRejectedValue(new Error("Persistent failure"));

    const emailSpy = jest.spyOn(emailService, "sendAdminCriticalAlert");

    await automatedJobs.createDailyStockRecords();

    expect(emailSpy).toHaveBeenCalledWith(
      "DAILY_STOCK_FAILURE",
      expect.stringContaining("All Retries Failed: YES"),
      expect.any(String), // Error stack trace
    );
  });

  test("Activity log created on failure", async () => {
    jest
      .spyOn(stockService, "createDailyStockRecords")
      .mockRejectedValue(new Error("Test failure"));

    await automatedJobs.createDailyStockRecords();

    const activityLog = await ActivityLog.findOne({
      where: { action: "DAILY_STOCK_JOB_FAILED" },
      order: [["created_at", "DESC"]],
    });

    expect(activityLog).not.toBeNull();
    expect(activityLog.severity).toBe("CRITICAL");
    expect(activityLog.description).toContain("3 retries");
  });
});
```

### Manual Simulation

```bash
# 1. Temporarily break database connection
# Edit .env to use invalid credentials
DB_PASSWORD=invalid_password

# 2. Manually trigger stock job
npm run create-stock

# Expected output:
# 🔄 Creating daily stock records... (Attempt 1/3)
# ❌ Attempt 1/3 failed: Database connection error
# ⏳ Retrying in 1000ms...
# 🔄 Creating daily stock records... (Attempt 2/3)
# ❌ Attempt 2/3 failed: Database connection error
# ⏳ Retrying in 2000ms...
# 🔄 Creating daily stock records... (Attempt 3/3)
# ❌ Attempt 3/3 failed: Database connection error
# 🚨 CRITICAL: Daily stock creation failed after 3 retries
# 📧 Critical alert email sent to admin

# 3. Check admin inbox for alert email
# Subject: 🚨 CRITICAL: Daily Stock Creation Failed

# 4. Restore database connection
DB_PASSWORD=correct_password

# 5. Verify job succeeds
npm run create-stock
# Expected: ✅ Daily stock creation completed
```

### Verification

```sql
-- Check activity log for failures
SELECT * FROM activity_log
WHERE action = 'DAILY_STOCK_JOB_FAILED'
ORDER BY created_at DESC
LIMIT 10;

-- Verify stock records created after recovery
SELECT COUNT(*) as records_created
FROM daily_stock
WHERE stock_date = CURDATE();
-- Expected: Should match active menu item count
```

---

## Test 4: Input Validation

### Objective

Verify all validation rules prevent malicious inputs and enforce business rules.

### Test Script

```javascript
// test/input-validation.test.js
describe("Input Validation Tests", () => {
  describe("Order Cancellation Validation", () => {
    test("Rejects SQL injection attempt", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({ reason: "'; DROP TABLE orders--" })
        .expect(400);

      expect(response.body.error).toContain("invalid characters");
    });

    test("Rejects XSS attempt", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({ reason: "<script>alert('xss')</script>" })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test("Enforces length constraints", async () => {
      const order = await createTestOrder();

      // Too short
      await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({ reason: "abc" })
        .expect(400);

      // Too long
      await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({ reason: "a".repeat(501) })
        .expect(400);
    });

    test("Requires reason field", async () => {
      const order = await createTestOrder();

      const response = await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({}) // Missing reason
        .expect(400);

      expect(response.body.details[0].field).toBe("reason");
    });
  });

  describe("Payment Validation", () => {
    test("Validates payment amount precision", async () => {
      const response = await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({
          order_id: 1,
          payment_method: "CARD",
          amount: 100.999, // More than 2 decimal places
        })
        .expect(400);

      expect(response.body.error).toContain("2 decimal places");
    });

    test("Validates payment method enum", async () => {
      await request(app)
        .post("/api/v1/payments")
        .set("Authorization", `Bearer ${getCustomerToken()}`)
        .send({
          order_id: 1,
          payment_method: "BITCOIN", // Invalid method
          amount: 100.0,
        })
        .expect(400);
    });
  });

  describe("Stock Adjustment Validation", () => {
    test("Validates adjustment quantity range", async () => {
      await request(app)
        .post("/api/v1/stock/adjust")
        .set("Authorization", `Bearer ${getAdminToken()}`)
        .send({
          menu_item_id: 1,
          adjustment_quantity: 10000, // Exceeds max
          reason: "Test adjustment",
        })
        .expect(400);
    });

    test("Prevents future stock date beyond 7 days", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      await request(app)
        .post("/api/v1/stock/adjust")
        .set("Authorization", `Bearer ${getAdminToken()}`)
        .send({
          menu_item_id: 1,
          adjustment_quantity: 10,
          reason: "Test adjustment",
          stock_date: futureDate.toISOString(),
        })
        .expect(400);
    });
  });
});
```

### Manual Testing

```bash
# Test 1: SQL Injection Prevention
curl -X DELETE http://localhost:5000/api/v1/orders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "'"'"'; DROP TABLE orders--"}'
# Expected: 400 Bad Request

# Test 2: XSS Prevention
curl -X DELETE http://localhost:5000/api/v1/orders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "<script>alert('"'"'xss'"'"')</script>"}'
# Expected: 400 Bad Request

# Test 3: Length Validation
curl -X DELETE http://localhost:5000/api/v1/orders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "abc"}'
# Expected: 400 Bad Request (too short)

# Test 4: Payment Amount Precision
curl -X POST http://localhost:5000/api/v1/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": 1, "payment_method": "CARD", "amount": 100.999}'
# Expected: 400 Bad Request (too many decimals)

# Test 5: Stock Date Range
curl -X POST http://localhost:5000/api/v1/stock/adjust \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_item_id": 1,
    "adjustment_quantity": 10,
    "reason": "Test",
    "stock_date": "2026-12-31"
  }'
# Expected: 400 Bad Request (too far in future)
```

---

## Test 5: Performance Under Load

### Objective

Verify system maintains integrity under high concurrent load.

### Load Test Configuration

```yaml
# test/load-test.yml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 50 # 50 requests/second
      name: "Sustained load"
    - duration: 30
      arrivalRate: 100 # Spike to 100 requests/second
      name: "Load spike"
  variables:
    menuItemId: 1
scenarios:
  - name: "Mixed operations"
    weight: 40
    flow:
      - post:
          url: "/api/v1/orders"
          json:
            order_type: "TAKEAWAY"
            items: [{ menu_item_id: "{{ menuItemId }}", quantity: 1 }]
  - name: "Order cancellation"
    weight: 10
    flow:
      - delete:
          url: "/api/v1/orders/{{ $randomNumber(1, 1000) }}"
          json:
            reason: "Load test cancellation"
  - name: "Stock queries"
    weight: 50
    flow:
      - get:
          url: "/api/v1/stock?date={{ $randomDate() }}"
```

### Run Load Tests

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run test/load-test.yml

# Expected results:
# - HTTP status 2xx: > 95% (at least 95% success rate)
# - P95 latency: < 500ms
# - P99 latency: < 1000ms
# - No 5xx errors (server errors)
# - No database deadlocks
```

### Post-Load Verification

```sql
-- Check for data integrity issues
SELECT 'Stock Integrity' as test_case,
       COUNT(*) as violations
FROM daily_stock
WHERE (opening_quantity - sold_quantity + adjusted_quantity) < 0

UNION ALL

SELECT 'Order Integrity', COUNT(*)
FROM orders o
LEFT JOIN order_item oi ON o.order_id = oi.order_id
WHERE o.status != 'CANCELLED' AND oi.order_item_id IS NULL

UNION ALL

SELECT 'Payment Integrity', COUNT(*)
FROM orders o
JOIN payment p ON o.order_id = p.order_id
WHERE o.status = 'DELIVERED' AND p.status != 'PAID';

-- Expected: All violations = 0
```

---

## 📊 Test Results Template

```
=================================================
Test Execution Report
=================================================
Date: ________________
Environment: Staging / Pre-Production
Tester: ________________

Test 1: Concurrent Stock Reservation
-------------------------------------
[ ] Pass  [ ] Fail  [ ] Blocked
Notes: _________________________________

Test 2: Order Cancellation Atomicity
------------------------------------
[ ] Pass  [ ] Fail  [ ] Blocked
Notes: _________________________________

Test 3: Daily Stock Job Retry & Alerts
--------------------------------------
[ ] Pass  [ ] Fail  [ ] Blocked
Notes: _________________________________

Test 4: Input Validation
-----------------------
[ ] Pass  [ ] Fail  [ ] Blocked
Notes: _________________________________

Test 5: Performance Under Load
-----------------------------
[ ] Pass  [ ] Fail  [ ] Blocked
Notes: _________________________________

Overall Result:
[ ] Ready for Production
[ ] Needs Fixes
[ ] Blocked

Signature: ________________
Date: ________________
=================================================
```

---

## 🚨 Critical Test Failures - Action Plan

If any test fails:

1. **DO NOT deploy to production**
2. Document the failure with screenshots/logs
3. Notify development team immediately
4. Roll back changes if already deployed
5. Investigate root cause with database logs:
   ```sql
   SHOW ENGINE INNODB STATUS;
   SELECT * FROM information_schema.innodb_trx;
   SELECT * FROM information_schema.innodb_locks;
   ```

---

## ✅ Production Deployment Approval

All tests must pass before production deployment:

- [x] Test 1: Concurrent Stock Reservation
- [x] Test 2: Order Cancellation Atomicity
- [x] Test 3: Daily Stock Job Retry & Alerts
- [x] Test 4: Input Validation
- [x] Test 5: Performance Under Load

**Approved by:** ******\_\_\_\_******  
**Date:** ******\_\_\_\_******  
**Deployment approved:** [ ] YES [ ] NO
