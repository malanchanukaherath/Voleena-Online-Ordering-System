# 🍔 Voleena Foods - Complete Implementation Guide

## Project Status
✅ **90% Complete** - Core functionality implemented, final integration in progress

This project implements ALL functional requirements (FR01-FR31) and non-functional requirements from the project documentation.

---

## 📋 Completed Features

### ✅ Authentication & User Management (FR01-FR06)
- Customer registration & login
- Staff registration with role assignment (Admin, Cashier, Kitchen, Delivery)
- Profile management for customers
- Admin can manage customer accounts (activate/deactivate/block)
- Cashier can register customers manually
- Role-based access control (RBAC)

### ✅ Menu & Ordering (FR07-FR08, FR20-FR21)
- Browse menu by category
- View combo packs (daily/weekly specials)
- Shopping cart with stock validation
- Order placement (Delivery & Takeaway)
- Order cancellation before kitchen preparation
- Automatic refund for prepaid cancelled orders

### ✅ Distance Validation (FR09)
- Google Maps Distance Matrix API integration
- 15km delivery radius validation
- Fallback distance calculation for development
- Real-time address verification

### ✅ Order Management (FR10-FR14)
- Order confirmation by Admin/Cashier
- Kitchen staff order preparation workflow
- Delivery staff status updates
- Order cancellation with role-based permissions
- Complete order status tracking

### ✅ Notifications (FR15, FR27-FR31)
- Email notifications for order confirmations
- Order status update emails
- SMS notifications (optional, Twilio integration)
- OTP verification for email/phone
- Password reset via email/SMS
- Payment success/failure notifications

### ✅ Reporting & Analytics (FR16)
- Monthly sales reports
- Best-selling items analysis
- Dashboard statistics for all roles

### ✅ Combo Pack Management (FR17-FR19)
- Create/edit combo packs with scheduling
- Automatic price calculation (percentage or fixed)
- Auto-enable/disable based on dates
- Display active combos on customer portal

### ✅ Stock Management (FR22-FR25)
- Daily stock tracking per menu item
- Stock validation at checkout
- Automatic stock deduction on order ready
- Manual stock updates by Admin/Kitchen
- Auto-disable items when out of stock

### ✅ Delivery Management (FR26)
- Automatic delivery staff assignment
- Availability tracking
- Delivery status workflow

### ✅ Password Reset (FR27)
- Forgot password via email/SMS
- OTP-based verification
- Secure password reset flow

### ✅ OTP Verification (FR28)
- Account verification via OTP
- 15-minute expiry
- Resend OTP functionality

### ✅ Session Management (FR29)
- Auto-logout after 30 minutes inactivity
- Activity tracking (mouse, keyboard, scroll, touch)
- Token refresh mechanism

### ✅ Payment Gateway (FR30-FR31)
- PayHere integration (Sri Lankan gateway)
- Stripe integration (International cards)
- Cash on Delivery
- Payment retry on failure
- Auto-refund processing

---

## 🚀 Complete Setup Guide

### Prerequisites
- **Node.js** v16+ and npm
- **MySQL** 8.0+
- **Git**

### 1. Clone Repository
```bash
git clone <repository-url>
cd Voleena-Online-Ordering-System
```

### 2. Backend Setup

```bash
cd server
npm install
```

#### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
# Database (Required)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=voleena_foods_db

# JWT Secret (Required)
JWT_SECRET=change_this_to_a_long_random_string

# Google Maps API (Required for FR09)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESTAURANT_LATITUDE=7.0000000
RESTAURANT_LONGITUDE=80.0000000

# Email SMTP (Required for FR15, FR27-FR31)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=noreply@voleenafoods.lk

# Payment Gateway (Optional for FR30-FR31)
PAYHERE_MERCHANT_ID=your_payhere_id
PAYHERE_MERCHANT_SECRET=your_payhere_secret
STRIPE_SECRET_KEY=your_stripe_secret
```

#### Import Database
```bash
mysql -u root -p
CREATE DATABASE voleena_foods_db;
USE voleena_foods_db;
SOURCE ../current\ database.sql;
EXIT;
```

#### Seed Test Data
```bash
node seed_roles_and_staff.js
```

This creates:
- **Admin**: admin@test.com / password123
- **Cashier**: cashier@test.com / password123
- **Kitchen**: kitchen@test.com / password123
- **Delivery**: delivery@test.com / password123
- **Customer**: customer@test.com / password123

#### Start Backend Server
```bash
npm run dev
```

Server runs on: `http://localhost:3001`

---

### 3. Frontend Setup

```bash
cd ../client
npm install
```

#### Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

#### Start Frontend Development Server
```bash
npm run dev
```

App runs on: `http://localhost:5173`

---

## 🧪 Testing the System

### Test Accounts
| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | admin@test.com | password123 | Full system access |
| Cashier | cashier@test.com | password123 | Orders, customers |
| Kitchen | kitchen@test.com | password123 | Order preparation, stock |
| Delivery | delivery@test.com | password123 | Delivery management |
| Customer | customer@test.com | password123 | Browse, order, track |

### Testing Workflows

#### 1. Customer Order Flow (FR01, FR07-FR09, FR15, FR20-FR21, FR30-FR31)
1. Register/Login as customer
2. Browse menu items
3. Add items to cart
4. Proceed to checkout
5. Select delivery/takeaway
6. **Verify delivery location** (FR09) - Must be within 15km
7. Select payment method (Cash/Online/Card)
8. Place order
9. Receive email confirmation (FR15)
10. Track order status
11. Cancel order (if still pending) (FR20)
12. Automatic refund if prepaid (FR21)

#### 2. Order Management Flow (FR10-FR14)
1. Login as Cashier
2. View pending orders
3. Confirm order (FR11)
4. Email sent to customer
5. Login as Kitchen staff
6. View confirmed orders
7. Update status to "Preparing" (FR12)
8. Mark as "Ready" - **Stock auto-deducted** (FR22-FR25)
9. Login as Delivery staff
10. View assigned deliveries (FR26 - Auto-assigned)
11. Update to "Out for Delivery" (FR13)
12. Mark as "Delivered"

#### 3. Stock Management (FR22-FR25)
1. Login as Kitchen/Admin
2. Go to Stock Management
3. Update daily stock quantities
4. Items with 0 stock auto-disabled (FR25)
5. Order placement validates stock (FR24)
6. Stock deducted on order ready (FR22-FR23)

#### 4. Combo Pack Management (FR17-FR19)
1. Login as Admin
2. Navigate to Combo Management
3. Create combo pack
4. Add menu items
5. Set discount (percentage or fixed price) (FR18)
6. Schedule start/end dates
7. Auto-enabled/disabled by dates (FR19)
8. Displayed on customer portal (FR17)

#### 5. OTP Verification (FR28)
1. Register new account
2. Receive OTP via email/SMS
3. Verify within 15 minutes
4. Account activated

#### 6. Password Reset (FR27)
1. Click "Forgot Password"
2. Enter email
3. Receive OTP
4. Verify OTP
5. Set new password

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/staff/login` - Staff login
- `POST /api/auth/customer/login` - Customer login
- `POST /api/auth/customer/register` - Customer registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/verify` - Verify OTP
- `POST /api/auth/password-reset/reset` - Reset password

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/validate-location` - Validate delivery distance (FR09)

### Payments
- `POST /api/payments/initialize` - Initialize payment (FR30)
- `POST /api/payments/webhook/payhere` - PayHere callback
- `POST /api/payments/:id/refund` - Process refund (FR21)

### Stock
- `GET /api/stock/daily` - Get daily stock
- `PUT /api/stock/bulk-update` - Update multiple items (FR23)
- `GET /api/stock/validate` - Validate stock for order (FR24)

### Notifications
- `POST /api/notifications/send-otp` - Send OTP (FR28)
- `POST /api/notifications/verify-otp` - Verify OTP

### Admin Reports (FR16)
- `GET /api/admin/reports/monthly-sales` - Monthly sales report
- `GET /api/admin/reports/best-sellers` - Best-selling items

---

## 📝 Environment Variables Reference

### Critical (Must Configure)
- `DB_*` - Database connection
- `JWT_SECRET` - Authentication security
- `SMTP_*` - Email notifications
- `GOOGLE_MAPS_API_KEY` - Distance validation

### Optional (Can use defaults/mocks)
- `PAYHERE_*` / `STRIPE_*` - Payment gateways
- `TWILIO_*` - SMS notifications
- `SMS_PROVIDER` - Set to "console" for development

---

## 📦 Dependencies

### Backend
- `express` - Web framework
- `sequelize` - ORM for MySQL
- `mysql2` - MySQL driver
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `nodemailer` - Email service
- `axios` - HTTP client for Google Maps API
- `multer` - File uploads
- `cors` - Cross-origin requests

### Frontend
- `react` - UI framework
- `react-router-dom` - Routing
- `axios` - API client
- `tailwindcss` - Styling
- `react-icons` - Icons
- `react-toastify` - Notifications

---

## 🎯 Project Structure

```
Voleena-Online-Ordering-System/
├── server/                      # Backend (Node.js/Express)
│   ├── controllers/             # Business logic
│   │   ├── authController.js    # Authentication (FR01-FR06, FR27-FR29)
│   │   ├── orderController.js   # Orders (FR08-FR15, FR20-FR21)
│   │   ├── stockController.js   # Stock (FR22-FR25)
│   │   ├── comboPackController.js # Combos (FR17-FR19)
│   │   └── adminController.js   # Reports (FR16)
│   ├── models/                  # Sequelize models
│   ├── routes/                  # API routes
│   ├── middleware/              # Auth, validation
│   ├── utils/                   # Services
│   │   ├── googleMapsService.js # FR09 implementation
│   │   ├── notificationService.js # FR15, FR27-FR31
│   │   ├── otpService.js        # FR28
│   │   └── paymentService.js    # FR30-FR31
│   └── index.js                 # Server entry point
├── client/                      # Frontend (React)
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── contexts/            # Auth, Cart contexts
│   │   ├── services/            # API services
│   │   └── routes/              # Route configuration
│   └── index.html
└── current database.sql         # Database schema
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p
```

### Email Not Sending
- Gmail: Enable "App Passwords" in Google Account settings
- Set `SMTP_USER` and `SMTP_PASS` correctly
- For testing, emails log to console if SMTP not configured

### Google Maps API Error
- Enable "Distance Matrix API" in Google Cloud Console
- Add API key to `.env`
- For testing, fallback distance calculation is used

### Payment Gateway Not Working
- PayHere: Use sandbox mode for testing
- Stripe: Use test API keys
- For development, mock payments are auto-confirmed

---

## 📊 Non-Functional Requirements Status

| NFR | Requirement | Status |
|-----|-------------|--------|
| NFR01 | Responsive GUI | ✅ Tailwind CSS responsive design |
| NFR02 | Role-based access control | ✅ 5 roles implemented |
| NFR03 | Order processing < 5 seconds | ✅ Optimized queries |
| NFR04 | 100 concurrent users | ✅ Async/await, connection pooling |
| NFR05 | Browser compatibility | ✅ Chrome, Firefox, Safari, Edge |
| NFR06 | Secure login | ✅ JWT + bcrypt |
| NFR07 | Daily backups | ⚠️  Manual (cron job recommended) |
| NFR08 | Order history | ✅ Customer dashboard |
| NFR09 | Scalable architecture | ✅ Modular design |
| NFR10 | Analytics | ✅ Sales reports, dashboards |
| NFR11 | Secure database | ✅ Encrypted passwords, parameterized queries |

---

## 🚀 Deployment Checklist

### Production Environment Variables
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Add real Google Maps API key
- [ ] Configure production SMTP
- [ ] Set up PayHere/Stripe live credentials
- [ ] Update `FRONTEND_URL` and `BACKEND_URL`

### Security
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure firewall rules

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review API documentation
3. Check console logs for errors
4. Verify environment variables

---

## 📄 License

This project is developed for Voleena Foods - Kalagedihena, Gampaha District, Sri Lanka.

---

**Built with ❤️ using React, Node.js, Express, and MySQL**
