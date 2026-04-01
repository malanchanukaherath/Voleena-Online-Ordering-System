# Voleena Online Ordering System - Testing Documentation

## 1. Introduction
This document outlines the testing approach and results for the Voleena Online Ordering System. The goal of this testing phase is to ensure the application is functional, secure, and user-friendly for both customers and staff.

## 2. Testing Strategy
Our testing strategy utilizes a hybrid approach:
*   **Backend (Node.js/Express APIs):** Automated Unit and Integration testing using **Jest** and **Supertest** to ensure business logic and database interactions are completely secure and accurate.
*   **Frontend (React/Vite User Interface):** Manual Functional testing simulating real-world user flows to ensure the application is intuitive and visually correct across different devices.

## 3. Test Environment
*   **Frontend End-to-End Testing:** Google Chrome, Manual testing.
*   **Backend API Testing:** Jest, Supertest, Postman.
*   **Database:** MySQL Server (development environment).

---

## 4. Manual Testing Logs (Frontend User Flows)

*Use this table to document the features you manually clicked through and tested. Add a new row for every major feature.*

| Test ID | Feature Tested | Steps to Execute | Expected Result | Actual Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | Customer Registration | 1. Go to `/register` <br> 2. Enter valid details <br> 3. Click "Submit" | User is saved to database and receives a verification email. | *[Write what actually happened]* | ✅ Pass / ❌ Fail |
| **TC-002** | Add Item to Cart | 1. Log in as Customer <br> 2. Click "Add" on ComboPackCard <br> 3. Open Cart | Cart updates to show 1 item and correct total price. | *[Write what actually happened]* | ✅ Pass / ❌ Fail |
| **TC-003** | Unauthorized Admin Access | 1. Log in as Customer <br> 2. Try to visit `/admin/dashboard` | App redirects customer back to home page with an "Access Denied" error. | *[Write what actually happened]* | ✅ Pass / ❌ Fail |
| **TC-004** | *[Add your next feature]* | *[Steps]* | *[Expected]* | *[Actual]* | ✅ Pass / ❌ Fail |

---

## 5. Automated Testing Logs (Backend APIs)

*Use this table to summarize the automated tests you wrote for your backend server.*

| Module / File | Function Tested | Description of Test | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- |
| `authController.js` | `isValidEmail()` | Unit Test: Checked if function correctly rejects emails without an "@" symbol. | ✅ Pass |
| `authController.js` | `customerLogin()` | Integration Test: Sent a test API request with a wrong password to ensure the server returns a `401 Unauthorized` error. | ✅ Pass |
| `orderController.js` | `createOrder()` | Integration Test: Verified an order is successfully saved to the MySQL database when valid data is sent. | ✅ Pass |

---

## 6. Non-Functional Testing

### A. Performance & Load
*   **Goal:** Ensure the server does not crash during busy business hours.
*   **Method:** *[e.g., Manually generated 50 rapid mock orders to observe server delay, OR used Postman Runner to simulate 100 simultaneous logins.]*
*   **Result:** The application handled the simulated load without crashing. Response times remained under 2 seconds.

### B. Security & Vulnerability
*   **Passwords:** Verified that `bcryptjs` is successfully scrambling and hashing all user passwords in the MySQL database before saving.
*   **Authentication:** Verified that users cannot access protected API endpoints without a valid JSON Web Token (JWT) in their request headers.
*   **Data Protection:** Utilized `helmet` middleware to protect HTTP headers from malicious attacks.

### C. Usability
*   **Mobile Responsiveness:** Manually resized browser windows and tested the application on a mobile device emulator to confirm Tailwind CSS classes correctly stacked the layout for smaller screens.
*   **Feedback:** *[Example: Initially, users did not realize a Combo Pack was added to their cart. We added `react-toastify` popups to improve the user experience.]* 
