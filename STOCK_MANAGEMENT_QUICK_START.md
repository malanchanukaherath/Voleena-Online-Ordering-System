# Stock Management - Quick Start Guide

**Status:** ✅ Production Ready  
**Last Updated:** February 19, 2026  
**Coverage:** All 7 Parts Complete

---

## 🎯 What's Working Now

✅ Daily stock auto-creation (12 AM daily)  
✅ Admin can update opening quantities  
✅ Manual stock adjustments (damaged items, waste)  
✅ Kitchen staff can view (read-only)  
✅ Low-stock alerts (≤5 units)  
✅ Complete audit trail  
✅ Race-condition safe with SERIALIZABLE transactions  

---

## 📡 API Commands

### View Today's Stock (Admin/Kitchen)
```bash
curl -X GET http://localhost:3001/api/v1/stock/today \
  -H "Authorization: Bearer <TOKEN>"
```
**Returns:** Item names, quantities, IsLowStock flag

### Update Opening Quantity (Admin Only)
```bash
curl -X PUT http://localhost:3001/api/v1/stock/update/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"openingQuantity": 60}'
```

### Manual Adjustment (Admin Only)
```bash
curl -X POST http://localhost:3001/api/v1/stock/manual-adjust/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "adjustment": -5,
    "reason": "Damaged during delivery"
  }'
```

### View Change History (Admin/Kitchen)
```bash
curl -X GET http://localhost:3001/api/v1/stock/movements \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔑 Access Control

| Action | Admin | Kitchen | Customer |
|--------|-------|---------|----------|
| View stock | ✅ | ✅ | ❌ |
| Update opening | ✅ | ❌ | ❌ |
| Manual adjust | ✅ | ❌ | ❌ |
| View history | ✅ | ✅ | ❌ |

---

## ⚠️ Low-Stock Alerts

- **Threshold:** ≤ 5 units
- **In Response:** `"IsLowStock": true`
- **In Logs:** `⚠️ LOW STOCK ALERT: Item Name (Qty: 2)`

---

## 🔄 Automatic Daily Job

- **When:** Every day at 12:00 AM
- **What:** Creates stock for all items
- **Logic:** opening_qty = yesterday's closing_qty
- **Location:** server/services/automatedJobs.js (line 19)
- **Enabled:** Yes (see index.js line 208)

---

## 📊 API Endpoints Reference

| Method | Endpoint | Who | Purpose |
|--------|----------|-----|---------|
| GET | `/api/v1/stock/today` | Admin, Kitchen | View stock + alerts |
| PUT | `/api/v1/stock/update/:id` | Admin | Update opening qty |
| POST | `/api/v1/stock/manual-adjust/:id` | Admin | Damage/waste adjust |
| GET | `/api/v1/stock/movements` | Admin, Kitchen | Audit trail |

---

## 🚀 Key Features

✅ **SERIALIZABLE transactions** - No race conditions  
✅ **Row locking** - SELECT FOR UPDATE prevents conflicts  
✅ **Automatic daily creation** - node-cron scheduler  
✅ **Low-stock alerts** - IsLowStock flag + console warnings  
✅ **Complete audit trail** - stock_movement table  
✅ **Role-based access** - Admin read/write, Kitchen read-only  
✅ **Performance indices** - Fast queries even with large datasets  

---

## 🆘 Troubleshooting

### Daily job not running?
```bash
# Check 1: Is it enabled in index.js?
grep -n "automatedJobs.start()" server/index.js
# Should show line 208

# Check 2: Timezone correct?
echo $TZ  # Should be Asia/Colombo
```

### Can't update stock as admin?
```bash
# Check your role
curl http://localhost:3001/api/v1/staff/me \
  -H "Authorization: Bearer <TOKEN>"
# Should show: "role": "Admin"
```

### Kitchen can't view stock?
```bash
# Check 1: Token is valid (not expired)
# Check 2: Role is Admin or Kitchen
# Check 3: Server running: curl http://localhost:3001/health
```

### Low-stock alerts not appearing?
```bash
# Check if any items actually have qty <= 5
SELECT COUNT(*) FROM daily_stock 
WHERE stock_date = CURDATE() AND closing_quantity <= 5;
```

---

## 📧 Server Log Watch

```bash
# Watch for daily job success
tail -f server/error.log | grep "Daily stock creation"
# Expected: "✅ Daily stock creation for 2026-02-19: Created=45"

# Watch for low-stock alerts
tail -f server/error.log | grep "LOW STOCK"
# Expected: "⚠️ LOW STOCK ALERT: Deviled Fish (Qty: 2)"

# Watch for errors
tail -f server/error.log | grep "❌ Failed\|ERROR"
```

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| server/services/stockService.js | +7 new methods |
| server/controllers/stockController.js | Rewritten |
| server/routes/stock.js | New role-based routing |
| server/services/automatedJobs.js | Daily job enabled |
| server/index.js | Jobs import + start (line 208) |

---

## 🧪 Quick Tests

```bash
# Test 1: View stock
curl http://localhost:3001/api/v1/stock/today \
  -H "Authorization: Bearer <TOKEN>"

# Test 2: Update opening (admin)
curl -X PUT http://localhost:3001/api/v1/stock/update/1 \
  -H "Authorization: Bearer <ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"openingQuantity": 100}'

# Test 3: Manual adjust (admin)
curl -X POST http://localhost:3001/api/v1/stock/manual-adjust/1 \
  -H "Authorization: Bearer <ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{"adjustment": -3, "reason": "Damaged"}'

# Test 4: Kitchen tries to update (should fail)
curl -X PUT http://localhost:3001/api/v1/stock/update/1 \
  -H "Authorization: Bearer <KITCHEN>" \
  -H "Content-Type: application/json" \
  -d '{"openingQuantity": 100}'
# Expected: 403 Forbidden
```

---

## 📚 Full Documentation

**Need more details?**
- [STOCK_MANAGEMENT_IMPLEMENTATION.md](STOCK_MANAGEMENT_IMPLEMENTATION.md) - Technical deep dive
- [STOCK_MANAGEMENT_SUMMARY.md](STOCK_MANAGEMENT_SUMMARY.md) - Complete reference

**Database:**
- [production_schema.sql](database/production_schema.sql) - All tables/indices

---

## ✨ Production Checklist

- [x] Daily job runs at 12 AM
- [x] Admin can update stock
- [x] Kitchen can view only
- [x] Low-stock alerts working
- [x] No race conditions (SERIALIZABLE)
- [x] Audit trail complete
- [x] All 7 parts implemented
- [ ] Monitor for 1 week in production

---

**Ready to Deploy:** Yes ✅
