# PRODUCTION OPERATIONS GUIDE - VOLEENA FOODS
**Date:** March 1, 2026  
**Version:** 1.0  
**Audience:** DevOps, System Administrators, Operations Team

---

## PART 1: DATABASE BACKUP STRATEGY

### Daily Backup Schedule

**Automated Backup Script** (`scripts/backup_database.sh`)
```bash
#!/bin/bash

# Voleena Foods - Daily Database Backup Script
# Schedule: 2:00 AM daily via cron
# 0 2 * * * /path/to/scripts/backup_database.sh

BACKUP_DIR="/backups/voleena-db"
ARCHIVE_DIR="/archive/voleena-db"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER}"
DB_PASS="${DB_PASSWORD}"
DB_NAME="${DB_NAME}"
RETENTION_DAYS=30
ARCHIVE_RETENTION_DAYS=90

# Create directories
mkdir -pv $BACKUP_DIR $ARCHIVE_DIR

# Generate timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/voleena_backup_$TIMESTAMP.sql"

# Create backup
echo "[$(date)] Starting backup..."
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

# Calculate file size
SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "[$(date)] Backup completed: $SIZE"

# Encrypt (optional but recommended)
# openssl enc -aes-256-cbc -salt -in $BACKUP_FILE -out "${BACKUP_FILE}.enc"

# Upload to S3
if command -v aws &> /dev/null; then
    echo "[$(date)] Uploading to S3..."
    aws s3 cp $BACKUP_FILE "s3://voleena-backups/daily/$TIMESTAMP.sql.gz" --sse AES256
    
    # Keep local copy for quick restore
    cp $BACKUP_FILE "$ARCHIVE_DIR/"
fi

# Cleanup old backups (keep 30 days local, 90 days in S3)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
echo "[$(date)] Cleanup completed"

# Send success notification
# mail -s "Voleena DB Backup Success - $SIZE" ops@voleena.lk << EOF
# Backup completed successfully at $(date)
# File size: $SIZE
# Location: $BACKUP_FILE
# EOF

echo "[$(date)] Backup script completed"
exit 0
```

### Backup Locations
1. **Primary:** Local disk (`/backups/voleena-db/`)
2. **Secondary:** AWS S3 (`s3://voleena-backups/daily/`)
3. **Archive:** External encrypted drive (monthly manual)

### Retention Policy
- **Daily backups:** 30 days
- **Weekly backups:** 90 days  
- **Monthly backups:** 1 year
- **Disaster recovery:** Off-site, encrypted

### Restore Procedure

**Quick Restore from Local Backup:**
```bash
# 1. Choose backup file
ls -lh /backups/voleena-db/

# 2. Decompress
gunzip -c /backups/voleena-db/voleena_backup_20260301_020000.sql.gz > /tmp/restore.sql

# 3. Restore to database
mysql -u root -p $DB_NAME < /tmp/restore.sql

# 4. Verify restore
mysql -u root -p -e "USE $DB_NAME; SELECT COUNT(*) FROM customer;"

# 5. Clean up temp file
rm /tmp/restore.sql
```

**Restore from S3:**
```bash
# Download from S3
aws s3 cp s3://voleena-backups/daily/20260301_020000.sql.gz /tmp/restore.sql.gz

# Decompress and restore
gunzip -c /tmp/restore.sql.gz | mysql -u root -p $DB_NAME

# Verify
mysql -u root -p -e "USE $DB_NAME; SELECT COUNT(*) FROM customer;"
```

### Weekly Restore Test

**Automated restore test (run every Sunday 3:00 AM):**
```bash
#!/bin/bash
# Weekly restore test script

LATEST_BACKUP=$(ls -t /backups/voleena-db/*.gz | head -1)
TEST_DB="${DB_NAME}_restore_test"

echo "[$(date)] Starting restore test..."

# Create test database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $TEST_DB;"

# Restore backup
gunzip -c $LATEST_BACKUP | mysql -u root -p $TEST_DB

# Run integrity checks
mysql -u root -p $TEST_DB -e "
  SELECT TABLE_NAME, TABLE_ROWS 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = '$TEST_DB'
  ORDER BY TABLE_ROWS DESC;
"

# Cleanup test database
mysql -u root -p -e "DROP DATABASE $TEST_DB;"

echo "[$(date)] Restore test completed successfully"
```

---

## PART 2: LOG ROTATION & MANAGEMENT

### Application Logs with Winston

**Configure Logger** (`server/utils/logger.js`)
```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voleena-api' },
  transports: [
    // Console output (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Daily rotating file - combined logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxDays: '30d',
      compress: true
    }),
    
    // Error logs only
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxDays: '30d',
      compress: true
    }),
    
    // Payment logs (audit trail)
    new DailyRotateFile({
      filename: 'logs/payments-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxDays: '90d',
      compress: true
    })
  ]
});

module.exports = logger;
```

### Log Rotation Configuration

**Log directories structure:**
```
/var/log/voleena/
├── combined-YYYY-MM-DD.log (gzipped after 1 day)
├── error-YYYY-MM-DD.log
├── payments-YYYY-MM-DD.log
└── archive/
    ├── combined-2026-02-*.log.gz (30 days)
    ├── error-2026-02-*.log.gz (30 days)
    └── payments-2026-02-*.log.gz (90 days)
```

### Log Cleanup Cron Job

```bash
# Add to crontab

# Clean logs older than 30 days (except payments)
0 3 * * * find /var/log/voleena -name "*.log" -mtime +30 ! -name "*payment*" -delete

# Clean payment logs older than 90 days
0 3 * * * find /var/log/voleena -name "*payment*" -mtime +90 -delete

# Compress and archive logs
0 2 * * * gzip /var/log/voleena/*.log 2>/dev/null || true
```

---

## PART 3: MONITORING & ALERTING

### Key Metrics to Monitor

**Server Health:**
- CPU utilization > 80% → Alert
- Memory usage > 85% → Alert
- Disk space < 20% → Critical

**Database Health:**
- Slow queries > 1 second
- Connection pool utilization > 80%
- Replication lag > 5 seconds (if applicable)
- Error rate in logs

**Application Metrics:**
- Response time P95 > 500ms → Warning
- Error rate > 1% → Alert
- Failed payments > 5 in 1 hour → Alert
- New user registration trend

**Business Metrics:**
- Daily revenue trend
- Order volume spike
- Customer complaints

### Alert Channels
- **Email:** ops@voleena.lk (critical alerts)
- **Slack:** #alerts channel (all alerts)
- **SMS:** +94-xxx-xxx-xxxx (critical only)

---

## PART 4: PERFORMANCE TUNING

### Query Optimization

**Monitor slow queries:**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Check slow query log
SHOW VARIABLES LIKE '%slow_query%';

-- Common slow queries to optimize
-- 1. Dashboard stats calculation
SELECT status, COUNT(*) as count 
FROM order 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY status;

-- Add index
CREATE INDEX idx_order_status_created ON order(status, created_at);
```

### Cache Strategy
- **Redis for:** Session tokens, OTP codes, rate limit counters
- **In-memory:** Promotion list (refresh hourly)
- **Browser:** Static assets (CSS, JS, images)

---

## PART 5: SECURITY HARDENING

### SSL/TLS Configuration

**Nginx reverse proxy (recommended):**
```nginx
server {
  listen 443 ssl http2;
  server_name api.voleena.lk;
  
  # SSL certificates
  ssl_certificate /etc/ssl/certs/voleena.crt;
  ssl_certificate_key /etc/ssl/private/voleena.key;
  
  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  
  # Proxy to Node.js
  location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Request-ID $request_id;
  }
}
```

### Regular Security Updates
- Node.js: Check monthly for security updates
- Dependencies: Run `npm audit` weekly
- Database: Apply security patches promptly
- OS: Security updates on weekly schedule

---

## PART 6: DISASTER RECOVERY PLAN

### RTO & RPO Targets
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 1 hour (daily backups)

### Failover Procedures

**Database Failover:**
1. Detect primary database failure
2. Promote read replica (if available)
3. Update connection string in .env
4. Restart application servers
5. Verify data integrity

**Application Failover:**
1. Use load balancer health checks
2. Automatically remove failed server
3. Health check passes → restore to pool
4. Blue-green deployment for updates

### Testing
- **Monthly:** Full restore test from backup
- **Quarterly:** Failover simulation
- **Annually:** Disaster recovery drill

---

## PART 7: DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All tests passing (unit, integration)
- [ ] Load test results reviewed (100+ concurrent users)
- [ ] Security audit completed
- [ ] Database migration tested in staging
- [ ] Rollback procedure documented
- [ ] Health check endpoints verified
- [ ] Monitoring dashboards ready
- [ ] Alert thresholds configured
- [ ] Backup automation tested
- [ ] Log rotation configured
- [ ] SSL certificates installed
- [ ] Environment variables configured (.env)
- [ ] Rate limiting thresholds adjusted
- [ ] Database indexes applied
- [ ] Support team trained
- [ ] Incident response plan ready

---

## PART 8: SUPPORT & ESCALATION

### Support Contact Tree

**Tier 1 (Level 1 Support):** 
- Hours: 9 AM - 5 PM
- Issues: User password resets, account unlocks
- Contact: support@voleena.lk

**Tier 2 (Technical Support):**
- Hours: 8 AM - 10 PM
- Issues: API errors, payment issues, delivery tracking
- Contact: tech-support@voleena.lk
- Escalation: 15 minutes for critical

**Tier 3 (DevOps/Engineering):**
- Hours: 24/7 (on-call)
- Issues: Server down, database issues, security incidents
- Contact: ops@voleena.lk
- Response time: 5 minutes for critical

### Incident Response

**P1 - Critical (System Down):**
- Escalate immediately to DevOps
- Page on-call engineer
- Update status page every 5 minutes
- Target resolution: < 30 minutes

**P2 - High (Major Feature Broken):**
- Alert engineering team
- Investigate root cause
- Target resolution: < 2 hours

**P3 - Medium (Partial Issues):**
- Log ticket
- Investigate during business hours
- Target resolution: < 8 hours

**P4 - Low (Cosmetic/Minor):**
- Log ticket
- Fix in next release
- Target resolution: next sprint

---

## PART 9: MAINTENANCE WINDOWS

### Planned Maintenance Schedule
- **Weekly:** Tuesday 2-3 AM (non-critical updates)
- **Monthly:** Second Sunday (database maintenance)
- **Quarterly:** Major version upgrades (communicated 2 weeks in advance)

**Maintenance announcement template:**
```
Dear Voleena Foods Customer,

We will be performing scheduled maintenance:
📅 Date: [DATE]
⏰ Time: [START] - [END] (Asia/Colombo timezone)
⏱️ Duration: ~1 hour

During this time:
- API may be unavailable
- Mobile app may not work
- You cannot place new orders

What you can do:
- Pre-order for later delivery before maintenance
- Call us at +94-XX-XXX-XXXX for urgent orders

Thank you for your patience!
```

---

**Document Version:** 1.0  
**Last Updated:** March 1, 2026  
**Next Review:** June 1, 2026
