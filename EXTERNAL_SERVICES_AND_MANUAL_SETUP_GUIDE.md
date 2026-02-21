# Voleena Online Ordering System - External Services & Manual Setup Guide

**Generated:** February 21, 2026  
**Purpose:** Complete guide for external API integrations and manual production setup requirements

---

## TABLE OF CONTENTS

1. [External Services Requiring Manual Setup](#part-1--external-services-requiring-manual-setup)
2. [Email Verification Implementation](#part-2--email-verification-implementation)
3. [Payment Gateway Implementation](#part-3--payment-gateway-implementation)
4. [Manual Setup Checklist](#part-4--manual-setup-checklist)

---

# PART 1 – EXTERNAL SERVICES REQUIRING MANUAL SETUP

This section lists all third-party integrations that **CANNOT** work automatically without manual configuration.

---

## 1.1 Google Maps Distance Matrix API

### Why Required
- **Functional Requirement:** FR 09 – Delivery Address Validation
- **Purpose:** Validate customer delivery addresses are within service radius (15 km default)
- **Impact if Missing:** Delivery orders will fail or use fallback validation (less accurate)

### Required API Keys
- `GOOGLE_MAPS_API_KEY` – API key with Distance Matrix API enabled

### Manual Setup Steps

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** or select existing project
3. Name: "Voleena-Foods-Production" (or your preference)
4. Click **Create**

#### Step 2: Enable Distance Matrix API
1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Distance Matrix API"
3. Click on **Distance Matrix API**
4. Click **Enable**

#### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. Click **Restrict Key** (IMPORTANT for security)

#### Step 4: Configure API Key Restrictions
**Application Restrictions:**
- Select **HTTP referrers (web sites)** OR **IP addresses (web servers, cron jobs)**
- For backend API:
  - Choose **IP addresses**
  - Add your server's public IP address
  - Add `0.0.0.0/0` ONLY for development/testing

**API Restrictions:**
- Select **Restrict key**
- Choose **Distance Matrix API** only
- Click **Save**

#### Step 5: Enable Billing
1. Go to **Billing** in Google Cloud Console
2. Link a billing account (required even for free tier)
3. Note: Google provides $200/month free credit
4. Distance Matrix API costs: ~$0.005 per request (200 requests/$1)

### Required Environment Variables
```env
GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvw
RESTAURANT_LATITUDE=7.0000000
RESTAURANT_LONGITUDE=80.0000000
MAX_DELIVERY_DISTANCE_KM=15
```

### Backend Files Using This Key
- `server/services/distanceValidation.js` (lines 3, 17, 34, 75)
- `server/utils/distanceValidator.js` (lines 9, 23, 44, 88)
- `server/utils/googleMapsService.js` (lines 9, 23)

### Security Best Practices
1. **Never** commit API keys to Git
2. Use **API key restrictions** (IP or domain)
3. Enable **billing alerts** to prevent unexpected charges
4. Rotate API keys every 90 days
5. Monitor usage in Google Cloud Console
6. Consider using **Application Default Credentials** for production

### Testing Validation
```bash
# Test distance validation
curl -X POST http://localhost:3001/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "DELIVERY",
    "deliveryAddress": {
      "addressLine1": "123 Main Street",
      "city": "Gampaha",
      "latitude": 7.0917,
      "longitude": 80.0155
    }
  }'
```

### Fallback Behavior
If API key is missing:
- **Development:** Console warning, uses Haversine formula (approximate)
- **Production:** Throws error, delivery orders rejected

---

## 1.2 Email Service (SMTP)

### Why Required
- **Functional Requirements:**
  - FR 15 – Order confirmation emails
  - FR 27 – Password reset emails
  - FR 28 – Email verification (OTP)
  - FR 31 – Payment confirmation emails
- **Purpose:** Send transactional emails to customers
- **Impact if Missing:** No email notifications (CRITICAL feature loss)

### Required API Keys/Credentials
- `SMTP_HOST` – SMTP server hostname
- `SMTP_PORT` – SMTP port (usually 587 for TLS, 465 for SSL)
- `SMTP_USER` – Email address
- `SMTP_PASS` – Email password or app-specific password
- `SMTP_FROM` – Sender email address
- `SMTP_SECURE` – Use SSL (true/false)

---

### Option A: Gmail SMTP (Recommended for Testing)

#### Manual Setup Steps

**Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required for app passwords)

**Step 2: Generate App Password**
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → "Voleena Foods Backend"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
6. **Important:** Remove spaces when adding to `.env`

**Step 3: Configure Environment Variables**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=noreply@voleenafoods.lk
```

**Step 4: Test Email Sending**
```bash
# SSH into server
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'Voleena Foods email service working!'
}, console.log);
"
```

#### Limitations
- **Sending Limit:** 500 emails/day for Gmail
- **Not recommended for production** (use dedicated service)

---

### Option B: SendGrid (Recommended for Production)

#### Manual Setup Steps

**Step 1: Create SendGrid Account**
1. Go to [SendGrid](https://signup.sendgrid.com/)
2. Sign up (Free tier: 100 emails/day)
3. Verify email address

**Step 2: Create API Key**
1. Go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Name: "Voleena-Foods-Production"
4. Permissions: **Full Access** (or **Mail Send** only)
5. Click **Create & View**
6. **Copy API key** (shown only once!)

**Step 3: Configure Environment Variables**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
SMTP_FROM=noreply@voleenafoods.lk
```

**Step 4: Verify Sender Domain (Recommended)**
1. Go to **Settings** > **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Add DNS records to your domain registrar
4. Wait for verification (up to 48 hours)

**Step 5: Test Integration**
```bash
npm test -- email-service
```

#### Pricing
- **Free:** 100 emails/day
- **Essentials:** $19.95/month – 40,000 emails/month
- **Pro:** Custom pricing

---

### Option C: AWS SES (Cost-Effective for High Volume)

#### Manual Setup Steps

**Step 1: Create AWS Account**
1. Go to [AWS Console](https://aws.amazon.com/)
2. Create account and verify

**Step 2: Request Production Access**
1. Go to **SES** > **Account Dashboard**
2. Click **Request production access**
3. Fill form (explain use case)
4. Wait for approval (24-48 hours)

**Step 3: Verify Email/Domain**
1. Go to **Verified Identities**
2. Click **Create Identity**
3. Choose **Email** or **Domain**
4. Follow verification steps

**Step 4: Create SMTP Credentials**
1. Go to **SMTP Settings**
2. Click **Create SMTP Credentials**
3. Download credentials CSV

**Step 5: Configure Environment Variables**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIA1234567890ABCDEF
SMTP_PASS=ABCdefGHIjklMNOpqrSTUvwxYZ1234567890abcd
SMTP_FROM=noreply@voleenafoods.lk
```

#### Pricing
- **Free Tier:** 62,000 emails/month (if sent from EC2)
- **Paid:** $0.10 per 1,000 emails

---

### Backend Files Using SMTP
- `server/services/emailService.js` (lines 4-13, 26-62)
- `server/utils/notificationService.js` (lines 23, 29-34)

### Security Best Practices
1. Use **app-specific passwords** (never main password)
2. Store credentials in **environment variables** (never hardcode)
3. Enable **TLS** (SMTP_PORT=587, SMTP_SECURE=false)
4. Use **domain authentication** (SPF, DKIM, DMARC)
5. Implement **rate limiting** on email endpoints
6. Log failed email attempts for debugging

---

## 1.3 SMS Service (Twilio) – OPTIONAL

### Why Required
- **Functional Requirements:**
  - FR 28 – Phone verification (OTP via SMS)
  - FR 15 – Order status notifications via SMS (optional)
- **Purpose:** Send OTP and notifications via SMS
- **Impact if Missing:** Falls back to console logging (no real SMS sent)

### Required API Keys
- `TWILIO_ACCOUNT_SID` – Twilio account identifier
- `TWILIO_AUTH_TOKEN` – Twilio authentication token
- `TWILIO_PHONE_NUMBER` – Twilio phone number (SMS sender)

### Manual Setup Steps

#### Step 1: Create Twilio Account
1. Go to [Twilio Sign Up](https://www.twilio.com/try-twilio)
2. Sign up for free trial account
3. Verify your email and phone number

#### Step 2: Get Account Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy **Account SID** from dashboard
3. Copy **Auth Token** (click "Show" to reveal)

#### Step 3: Get Phone Number
1. In Twilio Console, go to **Phone Numbers** > **Manage** > **Buy a number**
2. Choose country: **Sri Lanka (+94)** or **United States (+1)** for testing
3. Select number with **SMS capability**
4. Click **Buy** (free trial includes $15 credit)

#### Step 4: Configure Environment Variables
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC1234567890abcdefghijklmnopqrstuvwx
TWILIO_AUTH_TOKEN=abcdef1234567890abcdef1234567890
TWILIO_PHONE_NUMBER=+94712345678
```

#### Step 5: Verify Recipients (Trial Only)
- **Trial accounts** can only send SMS to **verified phone numbers**
- Go to **Phone Numbers** > **Verified Caller IDs**
- Add test phone numbers

#### Step 6: Upgrade for Production
- Upgrade account to send to any phone number
- Add billing information
- Request SMS sender ID registration for Sri Lanka

### Backend Files Using SMS
- `server/services/smsService.js` (lines 7-11, 28)
- `server/utils/notificationService.js` (lines 118, 121-122)

### Security Best Practices
1. Store credentials securely in environment variables
2. Implement rate limiting (3 OTP requests per 15 min)
3. Use HTTPS for webhook endpoints
4. Validate phone numbers before sending
5. Monitor usage to prevent abuse

### Pricing
- **Free Trial:** $15 credit
- **SMS Cost (Sri Lanka):** ~$0.05 per SMS
- **Phone Number:** ~$1/month

### Fallback Behavior
If Twilio credentials missing:
```javascript
console.log('📱 SMS (Console):', phone, message);
```
- SMS logged to console only (no real SMS sent)
- Useful for development/testing

---

## 1.4 Payment Gateway – PayHere (Sri Lanka)

### Why Required
- **Functional Requirements:**
  - FR 30 – Online payment processing
  - FR 31 – Payment status tracking and webhooks
- **Purpose:** Process online payments from customers
- **Impact if Missing:** CRITICAL – no online payment capability

### Required API Keys
- `PAYHERE_MERCHANT_ID` – PayHere merchant ID
- `PAYHERE_MERCHANT_SECRET` – PayHere merchant secret
- `PAYHERE_MODE` – `sandbox` or `live`
- `PAYHERE_RETURN_URL` – URL to redirect after payment
- `PAYHERE_CANCEL_URL` – URL to redirect on payment cancel
- `PAYHERE_NOTIFY_URL` – Webhook URL for payment notifications

### Manual Setup Steps

#### Step 1: Create PayHere Merchant Account
1. Go to [PayHere Merchant Sign Up](https://www.payhere.lk/merchant/signup)
2. Fill business registration form:
   - Business Name: **Voleena Foods**
   - Business Type: **Food & Beverage**
   - Business Registration Number
   - Bank Account Details
3. Submit for verification (may take 2-3 business days)

#### Step 2: Get Sandbox Credentials (Testing)
1. Login to [PayHere Sandbox](https://sandbox.payhere.lk/)
2. Go to **Integrations** > **Domains & Credentials**
3. Copy **Merchant ID** (e.g., `1221234`)
4. Copy **Merchant Secret** (e.g., `MTIzNDU2Nzg5...`)

#### Step 3: Configure Webhook URL
1. In PayHere Dashboard, go to **Integrations** > **Notify URL**
2. Set Notify URL: `https://api.yourdomain.com/api/v1/payments/webhook/payhere`
3. **Important:** Must be HTTPS (not HTTP)
4. Click **Save**

#### Step 4: Set Return URLs
- **Return URL:** `https://yourdomain.com/payment/success`
- **Cancel URL:** `https://yourdomain.com/payment/cancelled`

#### Step 5: Configure Environment Variables
```env
# Sandbox (Testing)
PAYHERE_MERCHANT_ID=1221234
PAYHERE_MERCHANT_SECRET=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=
PAYHERE_MODE=sandbox
PAYHERE_RETURN_URL=http://localhost:5173/payment/success
PAYHERE_CANCEL_URL=http://localhost:5173/payment/cancelled
PAYHERE_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/v1/payments/webhook/payhere

# Production (Live)
PAYHERE_MERCHANT_ID=1234567
PAYHERE_MERCHANT_SECRET=PRODUCTION_SECRET_HERE
PAYHERE_MODE=live
PAYHERE_RETURN_URL=https://voleenafoods.lk/payment/success
PAYHERE_CANCEL_URL=https://voleenafoods.lk/payment/cancelled
PAYHERE_NOTIFY_URL=https://api.voleenafoods.lk/api/v1/payments/webhook/payhere
```

#### Step 6: Test Payment Flow (Sandbox)
1. Use test card numbers from PayHere documentation:
   - **Success:** `5123 4567 8901 2346` (Mastercard)
   - **Declined:** `4111 1111 1111 1111` (Visa)
2. Any CVV and future expiry date
3. Make test payment and verify webhook receives notification

#### Step 7: Go Live
1. Complete KYC verification in PayHere dashboard
2. Submit business documents
3. Wait for approval
4. Switch `PAYHERE_MODE=live`
5. Update merchant credentials to production values

### Backend Files Using PayHere
- `server/services/paymentService.js` (lines 10-12, 57-59)
- `server/controllers/paymentController.js` (lines 9, 77-106)
- `server/routes/payments.js` (line 13)

### Security Implementation
✅ **Already Implemented:**
- MD5 signature verification (lines 8-28 in paymentController.js)
- Payment amount validation against order total (line 117)
- Duplicate transaction ID detection (line 128)
- Order status validation before payment (line 137)

### Security Best Practices
1. **Never** expose merchant secret in frontend
2. Always verify webhook signature
3. Validate payment amount server-side
4. Check for duplicate transaction IDs
5. Use HTTPS for all webhook endpoints
6. Log all payment events for audit trail

### Testing Webhook Locally
Use **ngrok** to expose local server:
```bash
ngrok http 3001
# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# Set as PAYHERE_NOTIFY_URL in PayHere dashboard
```

---

## 1.5 Payment Gateway – Stripe (International)

### Why Required
- **Functional Requirements:**
  - FR 30 – Online payment processing (international cards)
  - FR 31 – Payment webhooks and refunds
- **Purpose:** Alternative payment gateway for international customers
- **Impact if Missing:** Limited to PayHere (Sri Lanka only)

### Required API Keys
- `STRIPE_SECRET_KEY` – Stripe secret key (backend)
- `STRIPE_PUBLISHABLE_KEY` – Stripe publishable key (frontend)
- `STRIPE_WEBHOOK_SECRET` – Webhook signing secret

### Manual Setup Steps

#### Step 1: Create Stripe Account
1. Go to [Stripe Sign Up](https://dashboard.stripe.com/register)
2. Complete registration
3. Verify email and phone

#### Step 2: Get API Keys
1. Login to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** > **API Keys**
3. Copy **Publishable key** (starts with `pk_test_`)
4. Click **Reveal test key** and copy **Secret key** (starts with `sk_test_`)

#### Step 3: Set Up Webhook
1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://api.yourdomain.com/api/v1/payments/webhook/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Click **Add endpoint**
6. Copy **Signing secret** (starts with `whsec_`)

#### Step 4: Configure Environment Variables
```env
# Test Mode
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz

# Production Mode
STRIPE_SECRET_KEY=sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_PUBLISHABLE_KEY=pk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

#### Step 5: Test Payment Flow
Use test card numbers:
- **Success:** `4242 4242 4242 4242` (Visa)
- **Declined:** `4000 0000 0000 0002` (Visa)
- **3D Secure:** `4000 0027 6000 3184` (Visa)

Any future expiry date and any CVV.

#### Step 6: Activate Production Account
1. Complete business verification
2. Add bank account for payouts
3. Submit tax information
4. Activate account
5. Switch to live API keys

### Backend Files Using Stripe
- `server/services/paymentService.js` (lines 180, 291)
- `server/controllers/paymentController.js` (lines 159-189)
- `server/routes/payments.js` (line 14)

### Security Implementation
✅ **Already Implemented:**
- Webhook signature verification (line 173 in paymentController.js)
- Uses `req.rawBody` for webhook validation (required by Stripe)
- Payment Intent metadata tracking

### Security Best Practices
1. **Never** use secret key in frontend
2. Always verify webhook signatures
3. Use Payment Intents (not Charges API)
4. Handle 3D Secure authentication
5. Implement idempotency keys for API calls
6. Enable Radar (fraud detection)

### Pricing
- **No setup fees**
- **Transaction fee:** 2.9% + $0.30 per successful charge (US)
- **International cards:** +1.5%
- **Currency conversion:** +1%

---

## 1.6 JWT Secret Keys

### Why Required
- **Functional Requirements:**
  - FR 25, FR 26 – Authentication and session management
- **Purpose:** Sign and verify JWT tokens for user authentication
- **Impact if Missing:** CRITICAL SECURITY FLAW – predictable tokens

### Required Variables
- `JWT_SECRET` – Secret for access tokens (30 min expiry)
- `JWT_REFRESH_SECRET` – Secret for refresh tokens (7 day expiry)

### Manual Setup Steps

#### Step 1: Generate Secure Random Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

#### Step 2: Add to Environment Variables
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8
JWT_EXPIRE=30m
JWT_REFRESH_EXPIRE=7d
```

### Backend Files Using JWT Secrets
- `server/utils/jwtUtils.js` (lines 6-9)
- `server/controllers/authController.js` (line 6)
- `server/middleware/auth.js` (JWT verification)

### Security Best Practices
1. **Minimum length:** 64 characters (512 bits)
2. **Never** commit to Git
3. **Rotate secrets** every 90 days
4. Use different secrets for access vs. refresh tokens
5. Store in secure vault (AWS Secrets Manager, Azure Key Vault)
6. Never log JWT secrets

### What Happens if Secrets Change?
- All existing tokens become **invalid**
- Users must **log in again**
- Plan secret rotation during maintenance window

---

## 1.7 Database Configuration

### Why Required
- **Purpose:** Store all application data
- **Impact if Missing:** Application cannot start

### Required Variables
- `DB_HOST` – MySQL server hostname
- `DB_USER` – MySQL username
- `DB_PASSWORD` – MySQL password
- `DB_NAME` – Database name (`voleena_foods_db`)
- `DB_PORT` – MySQL port (default: 3306)

### Manual Setup Steps

#### Step 1: Create Database User
```sql
CREATE DATABASE voleena_foods_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'voleena_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

GRANT ALL PRIVILEGES ON voleena_foods_db.* TO 'voleena_user'@'localhost';

FLUSH PRIVILEGES;
```

#### Step 2: Import Schema
```bash
mysql -u voleena_user -p voleena_foods_db < database/production_schema.sql
```

#### Step 3: Configure Environment Variables
```env
DB_HOST=localhost
DB_USER=voleena_user
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=voleena_foods_db
DB_PORT=3306
```

### Security Best Practices
1. Use **strong passwords** (16+ characters, mixed case, symbols)
2. **Never** use root user for application
3. Grant **minimum required privileges**
4. Use **SSL/TLS** for remote database connections
5. Enable **binary logging** for point-in-time recovery
6. Set up **automated backups**

---

## 1.8 Frontend URL Configuration

### Why Required
- **Purpose:** CORS (Cross-Origin Resource Sharing) configuration
- **Impact if Missing:** Backend rejects all frontend requests

### Required Variables
- `FRONTEND_URL` – Allowed origin for CORS

### Manual Setup Steps

```env
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://voleenafoods.lk
```

### Security Note
The backend **throws an error** if `FRONTEND_URL` is not set or is `*`:
```javascript
if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === '*') {
  throw new Error('CRITICAL: FRONTEND_URL must be explicitly set');
}
```

This prevents wildcard CORS (security risk).

---

# PART 2 – EMAIL VERIFICATION IMPLEMENTATION

## 2.1 Current Implementation Status

### Database Schema (✅ Ready)
The `otp_verification` table exists with proper structure:
```sql
CREATE TABLE `otp_verification` (
  `otp_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed OTP for security',
  `purpose` ENUM('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0 COMMENT 'Failed verification attempts',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`otp_id`),
  KEY `idx_user` (`user_type`, `user_id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_purpose` (`purpose`)
) ENGINE=InnoDB;
```

### Customer Model (✅ Ready)
The `customer` table has `is_email_verified` column:
```sql
is_email_verified TINYINT(1) NOT NULL DEFAULT 0
```

Model mapping exists in `server/models/Customer.js`:
```javascript
IsEmailVerified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  field: 'is_email_verified'
}
```

### Email Service (✅ Partially Implemented)
- `sendOTPEmail()` function exists in `server/services/emailService.js` (lines 195-230)
- Sends formatted OTP emails with expiry warning
- Integrated with notification logging

---

## 2.2 Missing Implementation

### ❌ Missing Backend Logic

The following endpoints are **NOT implemented**:

1. **POST /api/v1/auth/send-verification-otp** – Trigger email verification
2. **POST /api/v1/auth/verify-email** – Verify OTP and mark email as verified
3. OTP generation and hashing logic
4. Rate limiting for OTP requests (prevent abuse)
5. Automatic OTP cleanup job (delete expired OTPs)

---

## 2.3 Complete Implementation Plan

### Step 1: Add OTP Generation Logic

Create `server/utils/otpService.js`:
```javascript
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP before storing (security best practice)
 */
async function hashOTP(otp) {
  return await bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hash
 */
async function verifyOTP(otp, hash) {
  return await bcrypt.compare(otp, hash);
}

/**
 * Create OTP record in database
 */
async function createOTPRecord(userType, userId, purpose, expiryMinutes = 10) {
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await sequelize.query(
    `INSERT INTO otp_verification (user_type, user_id, otp_hash, purpose, expires_at) 
     VALUES (?, ?, ?, ?, ?)`,
    {
      replacements: [userType, userId, otpHash, purpose, expiresAt],
      type: sequelize.QueryTypes.INSERT
    }
  );

  return otp; // Return plain OTP to send via email
}

/**
 * Verify OTP from database
 */
async function verifyOTPRecord(userType, userId, otp, purpose) {
  const [records] = await sequelize.query(
    `SELECT otp_id, otp_hash, attempts 
     FROM otp_verification 
     WHERE user_type = ? AND user_id = ? AND purpose = ? 
     AND is_used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    {
      replacements: [userType, userId, purpose],
      type: sequelize.QueryTypes.SELECT
    }
  );

  if (!records || records.length === 0) {
    return { success: false, error: 'OTP not found or expired' };
  }

  const record = records[0];

  // Check attempt limit (prevent brute force)
  if (record.attempts >= 5) {
    return { success: false, error: 'Too many failed attempts. Request new OTP.' };
  }

  // Verify OTP
  const isValid = await verifyOTP(otp, record.otp_hash);

  if (!isValid) {
    // Increment failed attempts
    await sequelize.query(
      `UPDATE otp_verification SET attempts = attempts + 1 WHERE otp_id = ?`,
      {
        replacements: [record.otp_id],
        type: sequelize.QueryTypes.UPDATE
      }
    );
    return { success: false, error: 'Invalid OTP' };
  }

  // Mark as used
  await sequelize.query(
    `UPDATE otp_verification SET is_used = 1, used_at = NOW() WHERE otp_id = ?`,
    {
      replacements: [record.otp_id],
      type: sequelize.QueryTypes.UPDATE
    }
  );

  return { success: true, otpId: record.otp_id };
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  createOTPRecord,
  verifyOTPRecord
};
```

---

### Step 2: Add Email Verification Endpoints

Update `server/controllers/authController.js`:

```javascript
const { sendOTPEmail } = require('../services/emailService');
const { createOTPRecord, verifyOTPRecord } = require('../utils/otpService');

/**
 * Send email verification OTP
 * POST /api/v1/auth/send-verification-otp
 */
exports.sendVerificationOTP = async (req, res) => {
  try {
    const { customerId } = req.user; // From JWT middleware

    // Find customer
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if already verified
    if (customer.IsEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if email exists
    if (!customer.Email) {
      return res.status(400).json({ error: 'No email address on file' });
    }

    // Generate OTP and store
    const otp = await createOTPRecord('CUSTOMER', customerId, 'EMAIL_VERIFICATION', 10);

    // Send OTP via email
    await sendOTPEmail(customer.Email, otp, 'EMAIL_VERIFICATION');

    return res.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
};

/**
 * Verify email with OTP
 * POST /api/v1/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { customerId } = req.user; // From JWT middleware
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // Find customer
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if already verified
    if (customer.IsEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Verify OTP
    const result = await verifyOTPRecord('CUSTOMER', customerId, otp, 'EMAIL_VERIFICATION');

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Mark email as verified
    await customer.update({ IsEmailVerified: true });

    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ error: 'Email verification failed' });
  }
};
```

---

### Step 3: Add Routes

Update `server/routes/authRoutes.js`:
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireCustomer } = require('../middleware/auth');
const { otpLimiter } = require('../middleware/rateLimiter');

// Email verification (customers only)
router.post(
  '/send-verification-otp',
  authenticateToken,
  requireCustomer,
  otpLimiter, // 3 requests per 15 minutes
  authController.sendVerificationOTP
);

router.post(
  '/verify-email',
  authenticateToken,
  requireCustomer,
  authController.verifyEmail
);

module.exports = router;
```

---

### Step 4: Trigger OTP on Registration

Update customer registration in `server/controllers/authController.js`:

```javascript
exports.customerRegister = async (req, res) => {
  try {
    // ... existing registration logic ...

    const customer = await Customer.create({
      Name: name.trim(),
      Email: normalizedEmail,
      Phone: cleanPhone,
      Password: password, // Auto-hashed by model hook
      IsEmailVerified: false, // Not verified yet
      IsPhoneVerified: false,
      AccountStatus: 'ACTIVE'
    });

    // Generate JWT token
    const token = generateToken({
      id: customer.CustomerID,
      email: customer.Email,
      role: 'Customer',
      type: 'Customer'
    });

    // Send verification email automatically
    if (customer.Email) {
      try {
        const otp = await createOTPRecord('CUSTOMER', customer.CustomerID, 'EMAIL_VERIFICATION', 10);
        await sendOTPEmail(customer.Email, otp, 'EMAIL_VERIFICATION');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }
    }

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: customer.CustomerID,
        name: customer.Name,
        email: customer.Email,
        isEmailVerified: false
      },
      message: 'Registration successful. Please check your email for verification code.'
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

---

### Step 5: Add Automated Cleanup Job

Update `server/services/automatedJobs.js`:

```javascript
const cron = require('node-cron');
const { sequelize } = require('../models');

/**
 * Delete expired OTP records (cleanup job)
 * Runs daily at 2:00 AM
 */
function scheduleOTPCleanup() {
  cron.schedule('0 2 * * *', async () => {
    try {
      const [result] = await sequelize.query(
        `DELETE FROM otp_verification WHERE expires_at < NOW() - INTERVAL 7 DAY`
      );
      console.log(`🧹 Cleaned up ${result.affectedRows} expired OTP records`);
    } catch (error) {
      console.error('OTP cleanup job failed:', error);
    }
  });
}

module.exports = {
  scheduleOTPCleanup,
  // ... other jobs ...
};
```

Call in `server/index.js`:
```javascript
const { scheduleOTPCleanup } = require('./services/automatedJobs');
scheduleOTPCleanup();
```

---

## 2.4 Security Features

### ✅ Implemented Security
1. **OTP Hashing** – OTPs stored as bcrypt hashes (not plaintext)
2. **Expiry Validation** – OTPs expire after 10 minutes
3. **Attempt Limiting** – Maximum 5 verification attempts
4. **Rate Limiting** – 3 OTP requests per 15 minutes (prevents spam)
5. **Single-use OTPs** – Marked as used after successful verification
6. **Automatic Cleanup** – Expired OTPs deleted after 7 days

### ⚠️ Additional Recommendations
1. **Email Uniqueness Enforcement** – Prevent multiple accounts with same email
2. **Account Suspension** – Block accounts after excessive failed OTP attempts
3. **Resend Logic** – Allow resending OTP (with cooldown)
4. **SMS Fallback** – Option to send OTP via SMS if email fails

---

## 2.5 Frontend Integration

### Example: Send OTP on Registration
```javascript
// After successful registration
const response = await fetch('/api/v1/auth/register/customer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, phone, password })
});

const { token, message } = await response.json();

// Show verification prompt
alert(message); // "Please check your email for verification code."

// Navigate to verification page
navigate('/verify-email');
```

### Example: Verify Email
```javascript
const verifyEmail = async (otp) => {
  const response = await fetch('/api/v1/auth/verify-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ otp })
  });

  const data = await response.json();
  if (data.success) {
    alert('Email verified successfully!');
    navigate('/dashboard');
  } else {
    alert(data.error);
  }
};
```

---

# PART 3 – PAYMENT GATEWAY IMPLEMENTATION

## 3.1 Current Implementation Status

### ✅ Already Implemented

**Payment Table Schema:**
```sql
CREATE TABLE `payment` (
  `payment_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `method` ENUM('CASH', 'ONLINE', 'CARD') NOT NULL,
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `transaction_id` VARCHAR(255) DEFAULT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `refunded_at` TIMESTAMP NULL DEFAULT NULL,
  `refund_reason` TEXT DEFAULT NULL,
  `gateway_status` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_transaction_id` (`transaction_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`order_id`) ON DELETE RESTRICT
) ENGINE=InnoDB;
```

**PayHere Integration (✅ Complete):**
- Hash generation for payment initialization (`server/services/paymentService.js` lines 17-42)
- Webhook signature verification (`server/controllers/paymentController.js` lines 8-28)
- Payment amount validation (line 117)
- Duplicate transaction detection (line 128)
- Order status validation (line 137)

**Stripe Integration (✅ Complete):**
- Payment Intent creation (`server/services/paymentService.js` lines 186-207)
- Webhook signature verification (`server/controllers/paymentController.js` line 173)
- Automatic payment status updates (lines 185-188)

---

## 3.2 Security Validation Checklist

### ✅ Server-Side Amount Validation
**Location:** `server/controllers/paymentController.js` lines 117-123

```javascript
const paymentAmount = parseFloat(payload.payhere_amount);
const expectedAmount = parseFloat(order.FinalAmount);

if (Math.abs(paymentAmount - expectedAmount) > 0.01) {
  console.error(`❌ Amount mismatch: Payment ₹${paymentAmount} vs Order ₹${expectedAmount}`);
  return res.status(400).json({ 
    error: 'Payment amount does not match order total. Fraud detected.' 
  });
}
```

**Status:** ✅ **IMPLEMENTED** – Server re-verifies amount before marking as paid

---

### ✅ Order Amount Re-Verification
**Location:** `server/controllers/paymentController.js` line 99

```javascript
const order = await Order.findOne({ where: { OrderNumber: payload.order_id } });

let payment = await Payment.findOne({ where: { OrderID: order.OrderID } });
if (!payment) {
  payment = await Payment.create({
    OrderID: order.OrderID,
    Amount: order.FinalAmount, // Uses server-side calculated amount
    Method: 'ONLINE',
    Status: 'PENDING'
  });
}
```

**Status:** ✅ **IMPLEMENTED** – Payment record uses order's `FinalAmount` (server-calculated)

---

### ✅ Webhook Verification
**PayHere Signature Verification:**  
**Location:** `server/controllers/paymentController.js` lines 8-28

```javascript
function verifyPayHereSignature(payload) {
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const localSig = crypto
    .createHash('md5')
    .update(
      `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`
    )
    .digest('hex')
    .toUpperCase();

  return localSig === payload.md5sig;
}
```

**Stripe Webhook Verification:**  
**Location:** `server/controllers/paymentController.js` lines 170-176

```javascript
const event = stripe.webhooks.constructEvent(
  req.rawBody, // Raw request body (required for signature verification)
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Status:** ✅ **IMPLEMENTED** – Both gateways verify webhook authenticity

---

### ✅ Duplicate Transaction Detection
**Location:** `server/controllers/paymentController.js` lines 128-135

```javascript
const existingTransaction = await Payment.findOne({
  where: { TransactionID: payload.payment_id }
});
if (existingTransaction) {
  console.warn(`⚠️ Duplicate transaction ID detected: ${payload.payment_id}`);
  return res.status(400).json({ 
    error: 'Duplicate payment transaction detected.' 
  });
}
```

**Status:** ✅ **IMPLEMENTED** – Prevents processing same transaction twice

---

### ✅ Order Status Validation
**Location:** `server/controllers/paymentController.js` lines 137-141

```javascript
if (order.Status === 'CANCELLED') {
  return res.status(400).json({ 
    error: 'Cannot process payment for cancelled order.' 
  });
}
```

**Status:** ✅ **IMPLEMENTED** – Blocks payment for invalid orders

---

## 3.3 Missing/Recommended Implementations

### ⚠️ Idempotency Key Mechanism
**Issue:** If webhook is called multiple times (network retry), could process payment twice  
**Current Mitigation:** Duplicate transaction ID check (partial solution)  
**Recommendation:** Add idempotency key table

**Implementation:**
```sql
CREATE TABLE payment_idempotency (
  idempotency_key VARCHAR(255) NOT NULL,
  payment_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idempotency_key),
  KEY idx_payment_id (payment_id)
) ENGINE=InnoDB;
```

**Webhook Logic:**
```javascript
const idempotencyKey = `${payload.merchant_id}_${payload.payment_id}_${payload.status_code}`;

const [existing] = await sequelize.query(
  'SELECT payment_id FROM payment_idempotency WHERE idempotency_key = ?',
  { replacements: [idempotencyKey], type: sequelize.QueryTypes.SELECT }
);

if (existing) {
  return res.json({ success: true, message: 'Already processed' });
}

// Process payment...

// Store idempotency key
await sequelize.query(
  'INSERT INTO payment_idempotency (idempotency_key, payment_id) VALUES (?, ?)',
  { replacements: [idempotencyKey, payment.PaymentID] }
);
```

---

### ⚠️ Refund Implementation (Partial)
**Current Status:**  
- PayHere: Manual refund (logs to console, marks as REFUNDED)
- Stripe: Automated refund via API

**PayHere Refund Limitation:**  
PayHere does **not** have an automated refund API. Refunds must be processed manually through the merchant dashboard.

**Location:** `server/services/paymentService.js` lines 168-176

```javascript
async processRefund(payment, reason) {
    // PayHere doesn't have automated refund API
    // This would need manual processing or integration with payment processor

    payment.Status = 'REFUNDED';
    payment.RefundedAt = new Date();
    payment.RefundReason = reason;
    await payment.save();

    // Log for manual processing
    console.log(`REFUND REQUIRED: Payment ${payment.PaymentID}, Amount: ${payment.Amount}, Reason: ${reason}`);

    return payment;
}
```

**Recommendation:** Implement admin notification system for refund requests

---

### ⚠️ Payment Timeout Handling
**Missing:** What if customer initiates payment but abandons?

**Recommendation:** Add cron job to mark pending payments as FAILED after timeout

**Implementation:**
```javascript
// In automatedJobs.js
cron.schedule('*/15 * * * *', async () => {
  // Mark payments pending > 30 min as FAILED
  const [result] = await sequelize.query(`
    UPDATE payment 
    SET status = 'FAILED', gateway_status = 'TIMEOUT' 
    WHERE status = 'PENDING' 
    AND created_at < NOW() - INTERVAL 30 MINUTE
  `);
  console.log(`⏱️ Expired ${result.affectedRows} pending payments`);
});
```

---

## 3.4 Implementation Guide by Gateway

### Option A: PayHere (Sri Lanka) – Complete Implementation

**Step 1: Initialize Payment (Frontend)**
```javascript
const initiatePayment = async (orderId) => {
  const response = await fetch('/api/v1/payments/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderId: orderId,
      paymentMethod: 'payhere'
    })
  });

  const { data } = await response.json();
  
  // Redirect to PayHere payment page
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://sandbox.payhere.lk/pay/checkout';
  
  Object.keys(data).forEach(key => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = data[key];
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};
```

**Step 2: Handle Return URL (Frontend)**
```javascript
// On /payment/success page
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');
  
  // Poll backend for payment status
  const checkPaymentStatus = setInterval(async () => {
    const response = await fetch(`/api/v1/payments/status/${orderId}`);
    const { status } = await response.json();
    
    if (status === 'PAID') {
      clearInterval(checkPaymentStatus);
      alert('Payment successful!');
      navigate('/orders');
    } else if (status === 'FAILED') {
      clearInterval(checkPaymentStatus);
      alert('Payment failed!');
      navigate('/payment/retry');
    }
  }, 2000);
}, []);
```

**Step 3: Webhook Endpoint (Backend) – Already Implemented ✅**
```javascript
router.post('/webhook/payhere', paymentController.payHereWebhook);
```

**Environment Variables:**
```env
PAYHERE_MERCHANT_ID=1221234
PAYHERE_MERCHANT_SECRET=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=
PAYHERE_MODE=sandbox
PAYHERE_RETURN_URL=https://voleenafoods.lk/payment/success
PAYHERE_CANCEL_URL=https://voleenafoods.lk/payment/cancelled
PAYHERE_NOTIFY_URL=https://api.voleenafoods.lk/api/v1/payments/webhook/payhere
```

---

### Option B: Stripe – Complete Implementation

**Step 1: Create Payment Intent (Backend) – Already Implemented ✅**
```javascript
const { clientSecret } = await stripeService.createPaymentIntent(order, customer);
```

**Step 2: Confirm Payment (Frontend)**
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const initiateStripePayment = async (orderId) => {
  // Get client secret from backend
  const response = await fetch('/api/v1/payments/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderId: orderId,
      paymentMethod: 'stripe'
    })
  });

  const { data } = await response.json();
  
  // Confirm payment
  const { error } = await stripe.confirmCardPayment(data.clientSecret, {
    payment_method: {
      card: cardElement, // From Stripe Elements
      billing_details: {
        name: customerName,
        email: customerEmail
      }
    }
  });

  if (error) {
    alert('Payment failed: ' + error.message);
  } else {
    alert('Payment successful!');
    navigate('/orders');
  }
};
```

**Step 3: Webhook Endpoint (Backend) – Already Implemented ✅**
```javascript
router.post('/webhook/stripe', paymentController.stripeWebhook);
```

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

---

## 3.5 Handling Failed Payments (FR 31)

### Current Implementation (✅ Implemented)
**Location:** `server/controllers/paymentController.js` lines 143-151

```javascript
const isPaid = payload.status_code === PAYHERE_SUCCESS;
const isPending = payload.status_code === PAYHERE_PENDING;

await payment.update({
  Status: isPaid ? 'PAID' : isPending ? 'PENDING' : 'FAILED',
  TransactionID: payload.payment_id,
  PaidAt: isPaid ? new Date() : null,
  GatewayStatus: isPaid ? 'SUCCESS' : isPending ? 'PENDING' : `FAILED_${payload.status_code}`
});
```

**Failure Codes Logged:**
- `FAILED_-1` – Cancelled by customer
- `FAILED_-2` – Payment failed (declined card, insufficient funds, etc.)
- `FAILED_-3` – Chargedback

### Recommended Enhancements
1. **Retry Logic:** Allow customer to retry payment
2. **Notification:** Send email on payment failure
3. **Auto-Cancel:** Cancel order if payment not completed within 30 minutes

---

## 3.6 Refund Flow (FR 21)

### PayHere Refund (Manual Process)
**Location:** `server/services/paymentService.js` lines 168-176

```javascript
async processRefund(payment, reason) {
    payment.Status = 'REFUNDED';
    payment.RefundedAt = new Date();
    payment.RefundReason = reason;
    await payment.save();

    console.log(`REFUND REQUIRED: Payment ${payment.PaymentID}, Amount: ${payment.Amount}, Reason: ${reason}`);
    return payment;
}
```

**Manual Steps:**
1. Admin marks order as refunded in system
2. System logs refund request
3. Admin processes refund manually in PayHere dashboard
4. Customer notified via email

---

### Stripe Refund (Automated)
**Location:** `server/services/paymentService.js` lines 276-290

```javascript
async processRefund(payment, reason) {
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.TransactionID,
      reason: 'requested_by_customer',
      metadata: {
        refund_reason: reason
      }
    });

    payment.Status = 'REFUNDED';
    payment.RefundedAt = new Date();
    payment.RefundReason = reason;
    await payment.save();

    return refund;
}
```

**Automated Process:**
1. Admin marks order as refunded
2. System calls Stripe refund API
3. Refund processed automatically (2-10 days)
4. Customer notified via email

---

## 3.7 Security Summary

### ✅ Implemented Security Features
1. **Server-side amount validation** – Prevents frontend manipulation
2. **Webhook signature verification** – Blocks spoofed webhooks
3. **Duplicate transaction detection** – Prevents double-charging
4. **Order status validation** – Prevents payment for cancelled orders
5. **HTTPS enforcement** – Required for webhook endpoints
6. **Rate limiting** – 20 payment requests per 10 minutes
7. **Merchant secret protection** – Never exposed to frontend

### ⚠️ Recommended Additions
1. **Idempotency keys** – Full webhook retry protection
2. **Payment timeout handling** – Auto-expire abandoned payments
3. **3D Secure support** – Enhanced fraud protection (Stripe)
4. **Fraud detection** – Flag suspicious patterns
5. **Audit logging** – Log all payment events

---

# PART 4 – MANUAL SETUP CHECKLIST

Use this checklist to track your production setup progress.

---

## 4.1 Google Maps API Setup

- [ ] **Create Google Cloud Project**
  - Project name: ___________________________
  - Project ID: ___________________________

- [ ] **Enable Distance Matrix API**
  - API enabled: Yes / No

- [ ] **Create API Key**
  - API Key: ___________________________
  - Restrictions configured: Yes / No

- [ ] **Configure Security Restrictions**
  - Restriction type: IP / HTTP Referrer
  - Allowed IPs/Domains: ___________________________

- [ ] **Set Billing Account**
  - Billing enabled: Yes / No
  - Billing alerts configured: Yes / No

- [ ] **Add to Environment Variables**
  ```
  GOOGLE_MAPS_API_KEY=___________________________
  RESTAURANT_LATITUDE=___________________________
  RESTAURANT_LONGITUDE=___________________________
  ```

- [ ] **Test Distance Validation**
  - Test delivery order created: Yes / No
  - Distance validation working: Yes / No

---

## 4.2 Email Service Setup

### Option: Gmail / SendGrid / AWS SES (circle one)

- [ ] **Create Email Account/Service**
  - Email provider: ___________________________
  - Email address: ___________________________

- [ ] **Generate SMTP Credentials**
  - Gmail App Password / SendGrid API Key / SES Credentials
  - Credentials saved securely: Yes / No

- [ ] **Configure Environment Variables**
  ```
  SMTP_HOST=___________________________
  SMTP_PORT=___________________________
  SMTP_USER=___________________________
  SMTP_PASS=___________________________
  SMTP_FROM=___________________________
  ```

- [ ] **Verify Domain (if applicable)**
  - Domain verified: Yes / No / N/A
  - SPF record added: Yes / No / N/A
  - DKIM record added: Yes / No / N/A

- [ ] **Test Email Sending**
  - Test email sent successfully: Yes / No
  - Email received in inbox (not spam): Yes / No

- [ ] **Enable Email Notifications**
  - Order confirmation emails working: Yes / No
  - OTP emails working: Yes / No
  - Password reset emails working: Yes / No

---

## 4.3 SMS Service Setup (Optional)

- [ ] **Create Twilio Account**
  - Account created: Yes / No / Skip

- [ ] **Get Account Credentials**
  - Account SID: ___________________________
  - Auth Token: ___________________________

- [ ] **Purchase Phone Number**
  - Phone number: ___________________________
  - SMS capability enabled: Yes / No

- [ ] **Configure Environment Variables**
  ```
  SMS_PROVIDER=twilio
  TWILIO_ACCOUNT_SID=___________________________
  TWILIO_AUTH_TOKEN=___________________________
  TWILIO_PHONE_NUMBER=___________________________
  ```

- [ ] **Verify Recipients (Trial Only)**
  - Test numbers verified: Yes / No / N/A

- [ ] **Test SMS Sending**
  - Test SMS sent successfully: Yes / No
  - SMS delivered: Yes / No

---

## 4.4 PayHere Payment Gateway Setup

- [ ] **Create PayHere Merchant Account**
  - Account created: Yes / No
  - Verification status: Pending / Approved

- [ ] **Get Sandbox Credentials**
  - Merchant ID: ___________________________
  - Merchant Secret: ___________________________

- [ ] **Configure Webhook URL**
  - Notify URL: https://api.yourdomain.com/api/v1/payments/webhook/payhere
  - URL configured in PayHere dashboard: Yes / No
  - HTTPS enabled: Yes / No

- [ ] **Set Return URLs**
  - Return URL: ___________________________
  - Cancel URL: ___________________________

- [ ] **Configure Environment Variables**
  ```
  PAYHERE_MERCHANT_ID=___________________________
  PAYHERE_MERCHANT_SECRET=___________________________
  PAYHERE_MODE=sandbox
  PAYHERE_RETURN_URL=___________________________
  PAYHERE_CANCEL_URL=___________________________
  PAYHERE_NOTIFY_URL=___________________________
  ```

- [ ] **Test Payment Flow (Sandbox)**
  - Test payment initiated: Yes / No
  - Webhook received: Yes / No
  - Payment status updated: Yes / No

- [ ] **Go Live (Production)**
  - KYC verification completed: Yes / No
  - Production credentials obtained: Yes / No
  - PAYHERE_MODE=live set: Yes / No
  - Live payment tested: Yes / No

---

## 4.5 Stripe Payment Gateway Setup (Optional)

- [ ] **Create Stripe Account**
  - Account created: Yes / No / Skip

- [ ] **Get API Keys**
  - Secret Key (test): ___________________________
  - Publishable Key (test): ___________________________

- [ ] **Configure Webhook**
  - Webhook URL: https://api.yourdomain.com/api/v1/payments/webhook/stripe
  - Webhook secret: ___________________________
  - Events subscribed:
    - [ ] payment_intent.succeeded
    - [ ] payment_intent.payment_failed

- [ ] **Configure Environment Variables**
  ```
  STRIPE_SECRET_KEY=___________________________
  STRIPE_PUBLISHABLE_KEY=___________________________
  STRIPE_WEBHOOK_SECRET=___________________________
  ```

- [ ] **Test Payment Flow**
  - Test payment with 4242 4242 4242 4242: Yes / No
  - Webhook received: Yes / No
  - Payment status updated: Yes / No

- [ ] **Activate Production**
  - Business verification completed: Yes / No
  - Bank account added: Yes / No
  - Production keys obtained: Yes / No
  - Live payment tested: Yes / No

---

## 4.6 JWT Secrets Generation

- [ ] **Generate JWT_SECRET**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  - Secret generated: Yes / No
  - Length: _____ characters (minimum 64)

- [ ] **Generate JWT_REFRESH_SECRET**
  - Secret generated: Yes / No
  - Different from JWT_SECRET: Yes / No

- [ ] **Add to Environment Variables**
  ```
  JWT_SECRET=___________________________
  JWT_REFRESH_SECRET=___________________________
  JWT_EXPIRE=30m
  JWT_REFRESH_EXPIRE=7d
  ```

- [ ] **Verify Token Generation**
  - Test login successful: Yes / No
  - Token expiry working: Yes / No

---

## 4.7 Database Setup

- [ ] **Create Production Database**
  - Database name: voleena_foods_db
  - Character set: utf8mb4
  - Collation: utf8mb4_unicode_ci

- [ ] **Create Database User**
  - Username: ___________________________
  - Password: ___________________________ (strong password)
  - Privileges granted: Yes / No

- [ ] **Import Production Schema**
  ```bash
  mysql -u voleena_user -p voleena_foods_db < database/production_schema.sql
  ```
  - Schema imported: Yes / No
  - 16 tables created: Yes / No

- [ ] **Configure Environment Variables**
  ```
  DB_HOST=___________________________
  DB_USER=___________________________
  DB_PASSWORD=___________________________
  DB_NAME=voleena_foods_db
  DB_PORT=3306
  ```

- [ ] **Test Database Connection**
  - Backend connects successfully: Yes / No
  - Test query executed: Yes / No

- [ ] **Set Up Backups**
  - Automated backup configured: Yes / No
  - Backup schedule: ___________________________
  - Backup tested: Yes / No

---

## 4.8 Server Deployment

- [ ] **Configure Frontend URL**
  ```
  FRONTEND_URL=https://voleenafoods.lk
  ```
  - URL configured: Yes / No
  - CORS working: Yes / No

- [ ] **Set Backend URL**
  ```
  BACKEND_URL=https://api.voleenafoods.lk
  ```
  - URL configured: Yes / No

- [ ] **Install SSL Certificate**
  - SSL certificate installed: Yes / No
  - HTTPS working: Yes / No
  - Certificate auto-renewal configured: Yes / No

- [ ] **Configure Firewall**
  - Only necessary ports open (80, 443, 3306): Yes / No
  - SSH restricted to specific IPs: Yes / No

- [ ] **Set Up PM2 (Process Manager)**
  - PM2 installed: Yes / No
  - Backend running with PM2: Yes / No
  - Auto-restart on crash enabled: Yes / No

- [ ] **Configure Environment**
  ```
  NODE_ENV=production
  PORT=3001
  ```
  - Environment set to production: Yes / No

---

## 4.9 Security Hardening

- [ ] **Environment Variables**
  - All secrets stored in .env: Yes / No
  - .env added to .gitignore: Yes / No
  - No secrets committed to Git: Yes / No

- [ ] **API Key Restrictions**
  - Google Maps API restricted: Yes / No
  - Stripe API keys production-ready: Yes / No
  - PayHere credentials secured: Yes / No

- [ ] **Rate Limiting**
  - Rate limiters active: Yes / No
  - Redis configured (optional): Yes / No

- [ ] **HTTPS Enforcement**
  - All endpoints HTTPS only: Yes / No
  - HTTP redirects to HTTPS: Yes / No

- [ ] **Database Security**
  - Root user disabled for app: Yes / No
  - Strong database password: Yes / No
  - Remote access restricted: Yes / No

---

## 4.10 Testing & Monitoring

- [ ] **End-to-End Testing**
  - Customer registration tested: Yes / No
  - Email verification tested: Yes / No
  - Order placement tested: Yes / No
  - Payment flow tested: Yes / No
  - Delivery validation tested: Yes / No

- [ ] **Error Monitoring**
  - Error logging configured: Yes / No
  - Log files rotated: Yes / No
  - Critical error alerts set up: Yes / No

- [ ] **Performance Monitoring**
  - API response times acceptable: Yes / No
  - Database queries optimized: Yes / No
  - Load testing performed: Yes / No

- [ ] **Backup & Recovery**
  - Database backup tested: Yes / No
  - Recovery procedure documented: Yes / No
  - Disaster recovery plan in place: Yes / No

---

## 4.11 Final Pre-Launch Checklist

- [ ] All external API keys configured and working
- [ ] Email service sending successfully
- [ ] Payment gateway processing transactions
- [ ] SSL certificate installed and valid
- [ ] Environment set to production mode
- [ ] Database backups automated
- [ ] Error monitoring active
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation complete

---

## 🎉 READY FOR PRODUCTION!

Once all checkboxes are completed, your Voleena Online Ordering System is ready for production deployment.

---

**Document Version:** 1.0  
**Last Updated:** February 21, 2026  
**Maintainer:** Development Team
