# Exhaustive System Testing Encyclopedia
*This is the complete, comprehensive list of absolutely every unit and feature across your entire Voleena Application, as requested.*

---

## PART 1: COMPLETE UNIT TESTING MAP ⚙️
These are the pure JavaScript functions in your `server/utils/` folder. They require automated unit tests (using Jest) because they are the foundation of your data security and math.

### File: `server/utils/validationUtils.js`
1.  **Unit:** `validateSriLankanPhone(phone)`
    *   **Explanation:** Ensures phone numbers follow SL formats.
    *   **Test Outcomes:** Input `+94701234567` ➔ `true`. Input `123` ➔ `false`.
2.  **Unit:** `validateEmail(email)`
    *   **Explanation:** Ensures email format is valid and under 255 chars.
    *   **Test Outcomes:** Input `a@b.com` ➔ `true`. Input `admin` ➔ `false`.
3.  **Unit:** `validatePostalCode(postalCode)`
    *   **Explanation:** Verifies 5-10 digit numbers.
    *   **Test Outcomes:** Input `10500` ➔ `true`. Input `abc` ➔ `false`.
4.  **Unit:** `validateAddressLine(address)`
    *   **Explanation:** Enforces length constraints on addresses.
    *   **Test Outcomes:** Input `No 5, Kandy` ➔ `true`. Input `A` ➔ `false` (too short).
5.  **Unit:** `validateCoordinates(latitude, longitude)`
    *   **Explanation:** Checks map bounds.
    *   **Test Outcomes:** Input `(6.92, 79.86)` ➔ `true`. Input `(150, -200)` ➔ `false`.
6.  **Unit:** `sanitizeText(input)`
    *   **Explanation:** Removes dangerous `< >` tags to prevent hacking (XSS).
    *   **Test Outcomes:** Input `<h1>Hello</h1>` ➔ `h1Helloh1`.
7.  **Unit:** `validateQuantity(quantity)`
    *   **Explanation:** Limits food quantity orders between 1 and 999.
    *   **Test Outcomes:** Input `5` ➔ `true`. Input `-1` ➔ `false`. Input `1000` ➔ `false`.
8.  **Unit:** `validateOrderType(orderType)`
    *   **Explanation:** Restricts input to enums.
    *   **Test Outcomes:** Input `'DELIVERY'` ➔ `true`. Input `'DRONE'` ➔ `false`.
9.  **Unit:** `validatePaymentMethod(method)`
    *   **Explanation:** Restricts input to enums.
    *   **Test Outcomes:** Input `'CARD'` ➔ `true`. Input `'CRYPTO'` ➔ `false`.
10. **Unit:** `validateCartItems(items)`
    *   **Explanation:** Deeply checks a whole array of cart JSON data.
    *   **Test Outcomes:** Empty array `[]` ➔ Returns error "Cart must contain at least one item."

### File: `server/utils/deliveryFeeCalculator.js`
11. **Unit:** `calculateDeliveryFee(distanceKm)`
    *   **Explanation:** Dynamic delivery pricing logic.
    *   **Test Outcomes:** 
        *   Distance `2` ➔ Total Fee is Base Fee (within free range).
        *   Distance `10` ➔ Total Fee is Base Fee + Surcharge.
        *   Distance `999` ➔ Total Fee equals `MAX_DELIVERY_FEE` (cap applied).
12. **Unit:** `estimateDeliveryFee(distanceKm)`
    *   **Explanation:** Quick estimator for the frontend.
    *   **Test Outcomes:** Input `5` ➔ Returns exact calculated number.

---

## PART 2: COMPLETE FUNCTIONAL TESTING MAP 🖥️
These are the massive User Flows. You must manually (or through a tool like Cypress) click through these pages to ensure the frontend `pages.jsx` successfully talk to the backend `controllers.js`.

### Module A: Authentication & Profiles
13. **Feature:** Customer Registration (`CustomerRegistration.jsx` ➔ `authController.register`)
    *   **Outcome:** Creating an account should save exactly down to the database, Hash the password using bcrypt, and dispatch a verification email.
14. **Feature:** Customer & Staff Login (`Login.jsx` ➔ `authController.customerLogin` / `staffLogin`)
    *   **Outcome:** Success returns a signed JWT token; Failure returns 401 Unauthorized.
15. **Feature:** Forgot Password & Reset Flow (`ForgotPassword.jsx` & `ResetPassword.jsx`)
    *   **Outcome:** An OTP (One-Time Password) is sent to email, verified, and password is permanently updated.
16. **Feature:** Role-Based Access Routing (`App.jsx` Protected Routes)
    *   **Outcome:** If a "Kitchen" staff tries to visit `/admin`, React kicks them out.
17. **Feature:** Customer Profile Updates (`Profile.jsx`)
    *   **Outcome:** Changing address or phone number permanently updates the user's settings.

### Module B: The Customer Shopping Experience
18. **Feature:** Menu Catalog Browsing (`Menu.jsx`, `MenuItemDetail.jsx`)
    *   **Outcome:** All standard elements and combo packs fetch cleanly from the backend and display images correctly.
19. **Feature:** Category Filtering
    *   **Outcome:** Clicking "Burgers" hides all "Drinks" instantly.
20. **Feature:** Cart Building (`Cart.jsx`)
    *   **Outcome:** Adding, subtracting, and removing items updates the Cart State accurately.
21. **Feature:** Delivery Map Verification (`DeliveryMap.jsx`)
    *   **Outcome:** Google Maps API successfully plots the customer's coordinates.
22. **Feature:** Checkout & Form Submission (`Checkout.jsx` ➔ `orderController.createOrder`)
    *   **Outcome:** The entire cart list is transmitted, validated, and placed in the database with status `PENDING`.
23. **Feature:** Order History & Tracking (`OrderHistory.jsx`, `OrderTracking.jsx`)
    *   **Outcome:** Customers only see their own orders, not anyone else's data.

### Module C: Staff Operations (Dashboard Suite)
24. **Feature:** Cashier Order Acceptance (`CashierDashboard.jsx`)
    *   **Outcome:** Cashier clicks 'Confirm Order'. The Order Status in MySQL updates to `CONFIRMED`.
25. **Feature:** Kitchen Order Fulfillment (`KitchenDashboard.jsx`)
    *   **Outcome:** Kitchen staff clicks 'Mark as Ready'. The Order Status updates to `READY`.
26. **Feature:** Delivery Driver Assignment (`DeliveryDashboard.jsx`)
    *   **Outcome:** Driver accepts delivery. Status updates to `OUT_FOR_DELIVERY`. Time metrics begin tracking.
27. **Feature:** Staff Order Cancellation
    *   **Outcome:** If an order is canceled, the underlying ingredients and stock items are returned to the inventory perfectly.

### Module D: Admin Operations & System Management
28. **Feature:** Menu Management (`MenuManagement.jsx`, `ComboManagement.jsx`, `CategoryManagement.jsx`)
    *   **Outcome:** Admin can upload new food photos, change prices, and toggle "Out of Stock" buttons which instantly hide food from the Customer Menu.
29. **Feature:** Staff Onboarding (`StaffManagement.jsx`)
    *   **Outcome:** Admin creates new staff user. System assigns them a password and allows them to log in to their specific dashboard.
30. **Feature:** Inventory & Stock Syncing (`StockManagement.jsx`)
    *   **Outcome:** Manual addition of ingredients reflects correctly across all recipes.
31. **Feature:** Sales Data View (`SalesAnalytics.jsx`)
    *   **Outcome:** Revenue calculations properly sum up the `Amount` from all `CONFIRMED` and `DELIVERED` orders without double-counting canceled ones.
32. **Feature:** User Feedback Moderation (`FeedbackManagement.jsx`)
    *   **Outcome:** Admins can view customer complaint/compliment forms submitted through the site.
