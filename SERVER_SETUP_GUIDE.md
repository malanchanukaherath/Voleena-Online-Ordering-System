# Server Setup Guide

## Current Status

✅ **Completed:**
- All backend services implemented (stock, order, payment, email, SMS, distance validation)
- Server configuration files created
- Dependencies installed (`npm install` completed)
- Development `.env` file created
- Route files configured
- Middleware implemented

⚠️ **Issue:**
The server is trying to start but failing because:
1. MySQL database is not set up yet
2. Database connection is required by the models

## Quick Start (Without Database)

To test the API server without database:

```powershell
cd server
node server-minimal.js
```

This will start a minimal server on port 3001 with just a health check endpoint.

## Full Setup Steps

### Step 1: Install MySQL

1. Download MySQL 8.0+ from https://dev.mysql.com/downloads/mysql/
2. Install and remember your root password
3. Start MySQL service

### Step 2: Create Database

Open MySQL command line or MySQL Workbench:

```sql
CREATE DATABASE voleena_foods_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Run Production Schema

```powershell
cd ..
mysql -u root -p voleena_foods_db < database/production_schema.sql
```

Enter your MySQL root password when prompted.

### Step 4: Update .env File

Edit `server/.env` and update:

```env
DB_USER=root
DB_PASSWORD=your_mysql_password_here
```

### Step 5: Start Server

```powershell
cd server
npm start
```

The server should now start successfully!

## Testing the Server

Once running, test these endpoints:

### Health Check
```powershell
curl http://localhost:3001/health
```

### Get Menu Items
```powershell
curl http://localhost:3001/api/v1/menu/items
```

## Troubleshooting

### Error: "Cannot find module"
Run: `npm install` in the server directory

### Error: "Access denied for user"
Check your DB_USER and DB_PASSWORD in `.env`

### Error: "Unknown database"
Run the CREATE DATABASE command from Step 2

### Port 3001 already in use
Change PORT in `.env` to another port (e.g., 3002)

## Optional: External Services

For full functionality, configure these in `.env`:

**Google Maps API** (for distance validation):
- Get key from: https://console.cloud.google.com/
- Enable: Distance Matrix API, Geocoding API
- Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key`

**Email (Gmail)**:
```env
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password
```
Get app password from: https://myaccount.google.com/apppasswords

**Twilio SMS**:
- Sign up at: https://www.twilio.com/
- Add to `.env`:
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

**PayHere** (Sri Lankan payments):
- Merchant account: https://www.payhere.lk/
- Add merchant ID and secret to `.env`

**Stripe** (International payments):
- Account: https://stripe.com/
- Add secret key to `.env`

## Next Steps After Server Runs

1. Create admin user (see DEPLOYMENT_GUIDE.md Step 3)
2. Test API endpoints
3. Seed initial data (categories, menu items)
4. Start frontend development
5. Connect frontend to backend API

## Files Created

- `server/index.js` - Main server file
- `server/.env` - Environment configuration
- `server/package.json` - Dependencies
- `server/config/database.js` - Database configuration
- `server/services/` - All business logic services
- `server/middleware/` - Authentication, validation, rate limiting
- `database/production_schema.sql` - Database schema

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify MySQL is running
3. Confirm database exists
4. Check `.env` configuration
5. Review DEPLOYMENT_GUIDE.md for detailed steps

---

**Quick Command Reference:**

```powershell
# Install dependencies
npm install

# Start server
npm start

# Start minimal server (no database)
node server-minimal.js

# Check MySQL status
Get-Service MySQL80

# Create database
mysql -u root -p -e "CREATE DATABASE voleena_foods_db;"

# Load schema
mysql -u root -p voleena_foods_db < ../database/production_schema.sql
```
