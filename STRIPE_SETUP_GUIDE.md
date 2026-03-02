# Stripe Integration Setup Guide

## ✅ Completed Steps

### 1. Backend Environment Variables
**File:** `server/.env`
```
STRIPE_SECRET_KEY=sk_test_51SmZjJCp4XuCJFA94WTFCNEHIn7SxdgLIDYtRjDk0LifGTDXYDTTcVBe2TW4eC3dWaCBJ6aVDgu9629WmyoRFViv003nmw2RIu
STRIPE_PUBLISHABLE_KEY=pk_test_51SmZjJCp4XuCJFA9P6SEqm2LQ2iUrYduTleQGqepNjQUEkeJyoLzWKKsgu4bmhEqacxYQ3d5AooQcgj1ns2H8ycG00RQQsomj5
STRIPE_WEBHOOK_SECRET=whsec_test_secret
STRIPE_WEBHOOK_URL=http://localhost:3001/api/v1/payments/stripe/webhook
```

### 2. Frontend Environment Variables
**File:** `client/.env.example` (copy to `client/.env.local`)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SmZjJCp4XuCJFA9P6SEqm2LQ2iUrYduTleQGqepNjQUEkeJyoLzWKKsgu4bmhEqacxYQ3d5AooQcgj1ns2H8ycG00RQQsomj5
```

### 3. Backend Infrastructure
- ✅ Webhook handler created: `server/controllers/paymentController.js` → `stripeWebhook()`
- ✅ Webhook route: `POST /api/v1/payments/stripe/webhook`
- ✅ Payment model updated: `CurrentLatitude`, `CurrentLongitude`, `LastLocationUpdate` columns
- ✅ `paymentService.initializeCardPayment()` creates Stripe PaymentIntent

### 4. Frontend UI Updates
- ✅ Checkout page updated: Card payment option enabled
- ✅ Stripe Payment Modal created: `client/src/components/payment/StripePaymentModal.jsx`
- ✅ Payment flow handles Stripe card payments

## ⚠️ Remaining Steps

### Step 1: Install Stripe Packages (Manual)
Due to npm auth issues, install packages manually:

```bash
# From client directory
npm install @stripe/js@3.0.0 @stripe/react-stripe-js@2.4.0
```

**Or** run from **PowerShell with admin privileges**:
```powershell
Set-Location "c:\Git Projects\Voleena-Online-Ordering-System\client"
npm logout
npm cache clean --force
npm install @stripe/js @stripe/react-stripe-js
```

### Step 2: Create Client .env File
Copy `.env.example` → `.env.local` in `client/` folder:

```bash
cd client
cp .env.example .env.local
```

**Content of `client/.env.local`:**
```
VITE_FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBV4YZqTuL2BuahZQf-Tezt9CNG2cwjBvs
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SmZjJCp4XuCJFA9P6SEqm2LQ2iUrYduTleQGqepNjQUEkeJyoLzWKKsgu4bmhEqacxYQ3d5AooQcgj1ns2H8ycG00RQQsomj5
VITE_NODE_ENV=development
```

### Step 3: Test the Payment Flow

1. **Start backend:**
   ```bash
   cd server
   npm start
   ```

2. **Start frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test payment:**
   - Go to checkout page
   - Select "Card Payment (Stripe)"
   - Place an order
   - Use test card: **4242 4242 4242 4242**
   - Any future expiry date (MM/YY)
   - Any 3-digit CVC

### Step 4: Set Up Webhook (Production)

Once you deploy:

1. **In Stripe Dashboard:**
   - Go to **Developers** → **Webhooks**
   - Click "Add endpoint"
   - Endpoint URL: `https://yourdomain.com/api/v1/payments/stripe/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy the **Webhook Signing Secret** (starts with `whsec_`)

2. **Update `server/.env` with production webhook secret:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_production_secret
   ```

### Step 5: Database Migration (If Using MySQL)

Run the migration to add location tracking columns:

```sql
-- Migration: Add live location tracking to Delivery
ALTER TABLE delivery
ADD COLUMN current_latitude DECIMAL(10, 8) NULL,
ADD COLUMN current_longitude DECIMAL(11, 8) NULL,
ADD COLUMN last_location_update DATETIME NULL;

CREATE INDEX idx_delivery_location_update ON delivery(last_location_update DESC);
```

**File:** `database/migration_v2.2_delivery_location_tracking.sql`

## 🔌 API Endpoints

### Payment Initiation
```
POST /api/v1/payments/initiate
Body: { orderId, paymentMethod: "CARD" | "ONLINE" | "CASH" }
Response: 
{
  success: true,
  data: {
    paymentId: 123,
    method: "CARD",
    gateway: "Stripe",
    clientSecret: "pi_1SmZjJ...", // Used by frontend
    publishableKey: "pk_test_..."
  }
}
```

### Stripe Webhook
```
POST /api/v1/payments/stripe/webhook
Header: stripe-signature: <signature>
Body: Stripe webhook event
```

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend compiles with Stripe packages
- [ ] Checkout page loads
- [ ] Card payment option is enabled
- [ ] Click "Place Order" → payment modal appears
- [ ] Test card payment with `4242 4242 4242 4242`
- [ ] Payment succeeds → redirects to confirmation
- [ ] Webhook receives `payment_intent.succeeded` event
- [ ] Database payment record is marked as `PAID`

## 📚 Files Modified

**Backend:**
- `server/.env` - Stripe keys added
- `server/controllers/paymentController.js` - Webhook handler + card payment init
- `server/routes/payments.js` - Webhook route registered
- `server/models/Delivery.js` - Location tracking columns
- `server/utils/paymentService.js` - Card payment logic (already existed)
- `database/migration_v2.2_delivery_location_tracking.sql` - New migration

**Frontend:**
- `client/.env.example` - Stripe publishable key added
- `client/package.json` - @stripe/js + @stripe/react-stripe-js added
- `client/src/pages/Checkout.jsx` - Card payment enabled, modal integrated
- `client/src/components/payment/StripePaymentModal.jsx` - NEW component

## 🚀 Next Steps (Optional)

1. **Admin Dashboard:** Show real-time rider location + live tracking
2. **Customer App:** Track order with live delivery location
3. **Webhooks:** Add SMS/email notifications on payment success
4. **Security:** Move to `LIVE` keys and set proper webhook secret
5. **Error Handling:** Add retry logic for failed payments

## 📖 Useful Links

- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Docs](https://stripe.com/docs/api)
- [React Stripe Documentation](https://stripe.com/docs/stripe-js/react)
