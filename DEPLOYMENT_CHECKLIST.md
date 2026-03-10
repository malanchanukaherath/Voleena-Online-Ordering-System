# Quick Deployment Checklist

**Production Safety Fixes - Version 2.0**  
**Deployment Date:** ******\_******  
**Deployed By:** ******\_******

---

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

```bash
# Add to server/.env
ADMIN_EMAIL=admin@voleena.com,operations@voleena.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@voleena.com
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@voleena.com
NODE_ENV=production
```

**Status:** [ ] Completed

---

### 2. Backup Current System

```bash
# Database backup
mysqldump -u voleena_user -p voleena_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Code backup
git tag -a v1.0-pre-safety-fixes -m "Before production safety fixes"
git push origin v1.0-pre-safety-fixes
```

**Status:** [ ] Completed

---

### 3. Code Deployment

```bash
# Pull latest code
cd /var/www/voleena-backend
git pull origin main

# Install dependencies (production only)
npm ci --production

# Restart application
pm2 restart voleena-backend

# Monitor startup
pm2 logs voleena-backend --lines 50
```

**Status:** [ ] Completed

---

### 4. Verify Deployment

```bash
# Check server health
curl https://api.voleena.com/health
# Expected: {"status": "ok"}

# Verify automated jobs started
pm2 logs voleena-backend | grep "automated jobs started"
# Expected: ✅ Automated jobs started

# Test admin email alert (optional)
curl -X POST https://api.voleena.com/admin/test-alert \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: Check admin inbox for test email
```

**Status:** [ ] Completed

---

### 5. Post-Deployment Monitoring (First 24 Hours)

#### Hour 1-2: Critical Monitoring

```bash
# Watch for errors
pm2 logs voleena-backend --lines 100 | grep -i error

# Monitor order creation
mysql -u voleena_user -p voleena_db -e \
  "SELECT COUNT(*) as orders_last_hour FROM orders WHERE created_at > NOW() - INTERVAL 1 HOUR"

# Check stock integrity
mysql -u voleena_user -p voleena_db -e \
  "SELECT COUNT(*) as negative_stock FROM daily_stock WHERE (opening_quantity - sold_quantity + adjusted_quantity) < 0"
# Expected: 0
```

**Status:** [ ] Completed

#### Hour 2-24: Continuous Monitoring

```bash
# Monitor key metrics every hour
watch -n 3600 'curl -s https://api.voleena.com/api/v1/admin/metrics'

# Check for failed stock jobs (runs at midnight)
# Review at 12:05 AM next day
pm2 logs voleena-backend | grep "Daily stock creation"
# Expected: ✅ Daily stock creation completed
```

**Status:** [ ] Completed

---

## 🔍 What Changed?

### Files Modified

1. ✅ `server/middleware/validation.js` - Added 5 new validation rules
2. ✅ `server/routes/orders.js` - Applied validation to cancel endpoint
3. ✅ `server/controllers/orderController.js` - Enhanced logging
4. ✅ `server/services/orderService.js` - Enhanced cancellation with row locking
5. ✅ `server/services/emailService.js` - Added admin alert function
6. ✅ `server/services/automatedJobs.js` - Integrated email alerts

### No Database Changes

✅ All changes are code-level only  
✅ No schema migrations required  
✅ Backward compatible with existing data

---

## 🚨 Rollback Plan (If Needed)

```bash
# Stop current version
pm2 stop voleena-backend

# Revert to previous tag
git checkout v1.0-pre-safety-fixes

# Reinstall dependencies
npm ci --production

# Restart application
pm2 start voleena-backend

# Verify rollback
curl https://api.voleena.com/health
```

**Rollback executed:** [ ] YES [ ] NO  
**Reason:** ******\_******

---

## 📊 Success Metrics (First Week)

Track these metrics to verify deployment success:

| Metric                      | Target       | Actual   | Status   |
| --------------------------- | ------------ | -------- | -------- |
| Orders oversold             | 0            | \_\_\_\_ | [ ] Pass |
| Cancellation errors         | < 5          | \_\_\_\_ | [ ] Pass |
| Stock job failures          | 0            | \_\_\_\_ | [ ] Pass |
| Admin alerts received       | All failures | \_\_\_\_ | [ ] Pass |
| Validation errors (attacks) | > 0          | \_\_\_\_ | [ ] Pass |
| System uptime               | 99.9%        | \_\_\_\_ | [ ] Pass |

---

## 📞 Incident Response

If issues occur, follow this order:

1. **Check PM2 logs**

   ```bash
   pm2 logs voleena-backend --lines 100
   ```

2. **Check database**

   ```bash
   mysql -u voleena_user -p voleena_db -e "SHOW PROCESSLIST"
   ```

3. **Contact team**
   - Development: dev@voleena.com
   - Operations: ops@voleena.com
   - Emergency: +94 XXX XXX XXX

4. **Emergency rollback** (if critical)
   ```bash
   ./rollback.sh
   ```

---

## ✅ Final Sign-off

- [ ] All environment variables configured
- [ ] Database backup completed
- [ ] Code deployed successfully
- [ ] Health checks passing
- [ ] Automated jobs running
- [ ] No errors in logs (first hour)
- [ ] Admin email alert system tested
- [ ] Monitoring dashboard updated
- [ ] Team notified of deployment

**Deployment Status:** [ ] SUCCESS [ ] FAILED [ ] ROLLED BACK

**Deployed by:** ******\_\_\_\_******  
**Date/Time:** ******\_\_\_\_******  
**Version:** 2.0-production-safety-fixes

---

## 📝 Notes

```
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
```

---

**Next Steps:**

1. Monitor for 24 hours
2. Review metrics after 1 week
3. Schedule post-deployment review meeting
4. Update runbooks if needed

**Post-Deployment Review:** ******\_\_\_****** (Date)
