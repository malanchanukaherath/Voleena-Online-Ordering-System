# Software Testing Report: Voleena Online Ordering System

**Project Name:** Voleena Online Ordering System
**Document Type:** Master Testing Report Template
**Status:** DRAFT (Ready for Submission)

---

## 1. Unit Testing

This section covers the testing of individual components, functions, and database models in isolation.

### 1.1 Backend Utilities & Helper Functions 

| Test ID | Module/File | Test Case Description | Input Data / Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UT-001 | `validationUtils.js` | Validate Sri Lankan Phone Format (Valid) | `+94701234567` | Returns `true` | As Expected | `Pending` |
| UT-002 | `validationUtils.js` | Validate Sri Lankan Phone (Invalid) | `0701234` | Returns `false` | As Expected | `Pending` |
| UT-003 | `validationUtils.js` | Validate Email Format (Valid) | `test@domain.com` | Returns `true` | As Expected | `Pending` |
| UT-004 | `validationUtils.js` | Prevent Malicious Text (XSS) | `<h1>Hello</h1>` | Tags stripped: `h1Helloh1` | As Expected | `Pending` |
| UT-005 | `deliveryFeeCalculator.js` | Calculate fee for < 3km distance | `2.5` (km) | Returns Base Fee (e.g. 150 LKR)| As Expected | `Pending` |
| UT-006 | `deliveryFeeCalculator.js` | Calculate fee for > 3km distance | `5` (km) | Returns Base + Surcharge | As Expected | `Pending` |
| UT-007 | `validationUtils.js` | Validate Order Type Enum | `DELIVERY` | Returns `true` | As Expected | `Pending` |

### 1.2 Backend Database Models

| Test ID | Module/Model | Test Case Description | Input Data / Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UT-008 | `Customer.js` | Enforce Unique Customer Email | Save Duplicate Email | Sequelize Unique Constraint Error | As Expected | `Pending` |
| UT-009 | `MenuItem.js` | Enforce Positive Price | Save Price as `-5` | Validation Error on save | As Expected | `Pending` |
| UT-010 | `Order.js` | Allowed Order Status Enum | Save Status `UNKNOWN`| Error (Only PENDING, CONFIRMED, etc)| As Expected | `Pending` |
| UT-011 | `StockMovement.js`| Validate Movement Types | Save `movement_type` 'IN'| Successfully persists | As Expected | `Pending` |
| UT-012 | `Promotion.js` | Validate Date Range logic | `start` > `end` date | Custom Validator throws error | As Expected | `Pending` |

### 1.3 Backend Controllers Integration Rules

| Test ID | Module/Controller| Test Case Description | Input Data / Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UT-013 | `authController` | Incorrect Login Details | Wrong email/password | HTTP 401 Unauthorized, JSON error | As Expected | `Pending` |
| UT-014 | `authController` | Correct Login Details | Valid credentials | HTTP 200, JWT token returned | As Expected | `Pending` |
| UT-015 | `cartController` | Add item to cart | Item ID, Quantity (1) | HTTP 201, Cart state updated | As Expected | `Pending` |
| UT-016 | `orderController` | Create Order Missing Address | Cart Items but no Address| HTTP 400 Bad Request | As Expected | `Pending` |
| UT-017 | `kitchenController`| Mark order preparing | Valid Order ID | Status ➔ `CONFIRMED` to `READY`| As Expected | `Pending` |

---

## 2. Functional Testing (End-to-End User Flows)

This section executes complex scenarios traversing the Frontend UI, API layer, and Database logic.

### 2.1 Customer Ordering Experience

| Test ID | Feature | Test Case Description | Steps to Execute | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FT-001 | Menu Browsing | View Menu Items | 1. Navigate to `/menu`<br>2. Wait for Load | Images, Prices, and Items display properly. | `Pending` |
| FT-002 | Category Filter | Filter Menu by Category | 1. Go to Menu<br>2. Click "Drinks" | Only beverage items are shown. | `Pending` |
| FT-003 | Cart Management| Add multiple items to Cart | 1. Click "Add" on Burger<br>2. Open Cart Menu | Cart shows Burger, quantity 1, Correct subtotal | `Pending` |
| FT-004 | Checkout Flow | Full cart checkout process | 1. Provide Cart<br>2. Add Address<br>3. Pay via Cash | Order generated. DB saves as `PENDING`. Redirect to success | `Pending` |
| FT-005 | Order Tracking | Track an active order | 1. Navigate to `OrderHistory`<br>2. Select Order | Displays correct status step on timeline map. | `Pending` |

### 2.2 Staff & Operations Dashboard

| Test ID | Feature | Test Case Description | Steps to Execute | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FT-006 | Cashier Action | Accept a Pending Order | 1. Login as Cashier<br>2. Click "Accept Order" | Order DB status updates to `CONFIRMED`. Timeline updates. | `Pending` |
| FT-007 | Kitchen Action | Complete an Order | 1. Login as Kitchen<br>2. Click "Mark Ready" | Order DB status updates to `READY`. Customer notified. | `Pending` |
| FT-008 | Delivery Action| Assign and Deliver Order | 1. Driver Selects Order<br>2. Clicks 'Delivered' | Status updates to `DELIVERED`. Driver availability updates. | `Pending` |

### 2.3 Administration Management

| Test ID | Feature | Test Case Description | Steps to Execute | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FT-009 | Menu Updation | Toggle "Out of Stock" | 1. Admin Edit Item<br>2. Uncheck Available | Item instantly removed from Customer menu. | `Pending` |
| FT-010 | Stock Update | Deduct Ingredients | 1. Go to Stock UI<br>2. Subtract 5 Buns | DB updates, low stock flags if under threshold. | `Pending` |
| FT-011 | Role Security | Unauthorized Access | 1. Login as Cashier<br>2. Navigate to `/admin` | Frontend forces redirect. API rejects any fetches (403).| `Pending` |

---

## 3. Non-Functional Testing

Testing to evaluate system readiness, security, performance, and general operations.

### 3.1 Performance & Load Analysis

| Test ID | Type | Test Case Description | Testing Tool / Goal | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFT-001 | Load Testing | Menu page load under traffic | Trigger 100 simultaneous requests to API `/menu` | 95% of requests complete under 200ms latency. No DB locks. | `Pending` |
| NFT-002 | Stress Testing | System handling spike | Process 50 simultaneous cart checkouts | Queue handles DB entries elegantly without dropping rows. | `Pending` |
| NFT-003 | DB Optimization| Query fetching speed | Request full Order History timeline | Sequelize uses correct indexed keys to maintain fast fetch. | `Pending` |

### 3.2 Security & Vulnerabilities

| Test ID | Type | Test Case Description | Security Scope | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFT-004 | Authentication | Expiration of JWT Tokens | Leave session idling beyond token lifespan | Token expires gracefully. User prompted to login again. | `Pending` |
| NFT-005 | XSS Testing | Input malicious tags in forms | Search inputs and Feedback forms | React/Node sanitizes inputs. No scripts are executed. | `Pending` |
| NFT-006 | SQL Injection | ORM Safety verification | Inject `' OR 1=1;` in URL or search inputs | Sequelize parameterizes query. No DB manipulation possible. | `Pending` |
| NFT-007 | Password Hash | Database Leak Verification | Inspect Database rows directly | All passwords stored as secure encrypted Bcrypt/SHA hashes, no plain text.| `Pending` |

### 3.3 Usability & Device Compatibility

| Test ID | Type | Test Case Description | Environment | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFT-008 | Mobile Responsive| Checkout form layout on Mobile| iPhone 13 / Android (375px wide) | UI scales cleanly without breaking horizontally. | `Pending` |
| NFT-009 | Compatibility | Cross-Browser Render Test | Chrome, Firefox, Safari | Web application features function identically across browsers. | `Pending` |
| NFT-010 | Error Handling | Displaying clean errors | Trigger 404 Route or 500 API | App handles crash gracefully showing friendly fallback UI instead of crashing. | `Pending` |
