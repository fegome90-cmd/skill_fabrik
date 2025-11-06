# Database Backup Strategies - Estrategias y Disaster Recovery

## Backup Fundamentals

### 3-2-1 Backup Rule
- **3** copies of data (1 primary + 2 backups)
- **2** different media types (disk + cloud, disk + tape)
- **1** offsite copy (geographically separated)

### RTO vs RPO
- **RTO (Recovery Time Objective)**: Maximum acceptable downtime
  - Critical systems: < 15 minutes
  - Important systems: < 1 hour
  - Standard systems: < 4 hours

- **RPO (Recovery Point Objective)**: Maximum acceptable data loss
  - Critical data: Zero (continuous replication)
  - Important data: < 5 minutes
  - Standard data: < 1 hour

## Backup Types

### 1. Full Backup
```bash
# PostgreSQL
pg_dump -Fc -v -f backup_full_20251102.dump mydb

# Or plain SQL format
pg_dump -v -f backup_full_20251102.sql mydb

# MySQL
mysqldump -u root -p --single-transaction --routines --triggers mydb > backup_full_20251102.sql

# MongoDB
mongodump --uri="mongodb://localhost:27017/mydb" --out=/backup/$(date +%Y%m%d)
```

**Characteristics:**
- Complete copy of entire database
- Can be slow for large databases
- Simple restore process
- Large storage requirements

### 2. Incremental Backup
```bash
# PostgreSQL with WAL archiving
# In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
max_wal_senders = 3

# Continuous WAL archiving
pg_receivewal -D /backup/wal --synchronous

# MySQL with binary logs
# In my.cnf:
log-bin=mysql-bin
server-id=1

# Backup binary logs
mysqlbinlog --start-datetime="2025-11-02 00:00:00" \
           --stop-datetime="2025-11-02 23:59:59" \
           mysql-bin.000001 > backup_incremental_20251102.sql
```

**Characteristics:**
- Only changes since last backup
- Fast backup process
- Requires full backup + all incrementals to restore
- Complex restore procedure

### 3. Differential Backup
```bash
# PostgreSQL (no direct support, use custom)
# Track changes since last full backup
pg_walarchive --since-full-backup /backup/incremental

# MySQL
mysqldump -u root -p --single-transaction --routines --triggers \
          --where="modified_at > '2025-11-01 00:00:00'" \
          mydb > backup_diff_20251102.sql
```

**Characteristics:**
- Changes since last full backup
- Restore: Full backup + latest differential
- Faster than full, slower than incremental
- Moderate complexity

### 4. Snapshot Backup

#### LVM Snapshots
```bash
# Create LVM snapshot
lvcreate -L 10G -s -n db_snapshot /dev/vg0/db_lv

# Mount snapshot
mkdir /mnt/db_snapshot
mount /dev/vg0/db_snapshot /mnt/db_snapshot

# Copy files
tar -czf /backup/filesystem_backup_20251102.tar.gz -C /mnt/db_snapshot .

# Unmount and remove snapshot
umount /mnt/db_snapshot
lvremove /dev/vg0/db_snapshot
```

#### Cloud Provider Snapshots
```bash
# AWS RDS
aws rds create-db-snapshot \
  --db-instance-identifier mydb-instance \
  --db-snapshot-identifier mydb-snapshot-20251102

# Google Cloud SQL
gcloud sql backups create \
  --instance=my-instance \
  --description="Full backup $(date)"

# Azure Database
az sql db export \
  --resource-group myResourceGroup \
  --server myServer \
  --name myDatabase \
  --storage-key-type StorageAccessKey \
  --storage-key YOUR_STORAGE_KEY \
  --storage-uri https://mystorageaccount.blob.core.windows.net/backups/mybackup.bacpac \
  --type Bacpac
```

**Characteristics:**
- Instantaneous (point-in-time)
- Consistent snapshot (if database is quiesced)
- Fast creation and restoration
- Storage-efficient (copy-on-write)

## Automated Backup Scripts

### PostgreSQL Backup Script
```bash
#!/bin/bash
# backup.sh

set -e

# Configuration
DB_NAME="mydb"
DB_USER="postgres"
DB_HOST="localhost"
BACKUP_DIR="/backups"
RETENTION_DAYS=30
S3_BUCKET="s3://my-database-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Starting PostgreSQL backup: $DATE"

# Full backup with compression
echo "Creating full backup..."
pg_dump -Fc -v \
  --host="$DB_HOST" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  | gzip > "$BACKUP_DIR/full_${DATE}.dump.gz"

# Verify backup
echo "Verifying backup..."
if pg_restore --list "$BACKUP_DIR/full_${DATE}.dump.gz" > /dev/null; then
  echo "✅ Backup verified successfully"
else
  echo "❌ Backup verification failed"
  exit 1
fi

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/full_${DATE}.dump.gz" \
  "$S3_BUCKET/full_${DATE}.dump.gz" \
  --storage-class STANDARD_IA

# Create checksums
sha256sum "$BACKUP_DIR/full_${DATE}.dump.gz" > "$BACKUP_DIR/full_${DATE}.dump.gz.sha256"
aws s3 cp "$BACKUP_DIR/full_${DATE}.dump.gz.sha256" \
  "$S3_BUCKET/full_${DATE}.dump.gz.sha256"

# Clean up old local backups
find "$BACKUP_DIR" -name "full_*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups
aws s3 ls "$S3_BUCKET" --recursive | \
  awk '{print $4}' | \
  grep "full_" | \
  sort -r | \
  tail -n +$((RETENTION_DAYS + 1)) | \
  while read key; do
    aws s3 rm "$S3_BUCKET/$key"
  done

# Create backup metadata
cat > "$BACKUP_DIR/backup_metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "$DB_NAME",
  "backup_type": "full",
  "size_bytes": $(stat -f%z "$BACKUP_DIR/full_${DATE}.dump.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/full_${DATE}.dump.gz"),
  "checksum_sha256": $(cat "$BACKUP_DIR/full_${DATE}.dump.gz.sha256" | awk '{print $1}'),
  "retention_days": $RETENTION_DAYS
}
EOF

aws s3 cp "$BACKUP_DIR/backup_metadata.json" \
  "$S3_BUCKET/backup_metadata.json"

# Upload to second location (offsite)
echo "Uploading to offsite location..."
rclone copy "$BACKUP_DIR/full_${DATE}.dump.gz" \
  offsite_storage:/backups/

echo "✅ Backup completed successfully"
echo "Backup location: $BACKUP_DIR/full_${DATE}.dump.gz"
echo "S3 location: $S3_BUCKET/full_${DATE}.dump.gz"
echo "Backup size: $(du -h "$BACKUP_DIR/full_${DATE}.dump.gz" | cut -f1)"
```

### Incremental Backup Script
```bash
#!/bin/bash
# incremental_backup.sh

set -e

DB_NAME="mydb"
DB_USER="postgres"
BACKUP_DIR="/backups/incremental"
DATE=$(date +%Y%m%d_%H%M%S)

# Get current WAL segment
CURRENT_WAL=$(psql -U "$DB_USER" -d "$DB_NAME" \
  -t -c "SELECT pg_walfile_name(pg_current_wal_lsn())")

# Archive WAL segment
echo "Archiving WAL segment: $CURRENT_WAL"
pg_walarchive --file="$BACKUP_DIR/${DATE}_$CURRENT_WAL"

# Compress and upload
gzip "$BACKUP_DIR/${DATE}_$CURRENT_WAL"
aws s3 cp "$BACKUP_DIR/${DATE}_$CURRENT_WAL.gz" \
  "s3://my-database-backups/wal/${DATE}_$CURRENT_WAL.gz"

echo "✅ Incremental backup completed"
```

## Backup Encryption

### Encrypt at Rest
```bash
# PostgreSQL with GPG
pg_dump -Fc mydb | gpg --cipher-algo AES256 --compress-algo 1 \
  --symmetric --output backup_encrypted_$(date +%Y%m%d).dump.gpg

# Decrypt and restore
gpg --decrypt backup_encrypted_20251102.dump.gpg | pg_restore -d mydb
```

### Encrypt in Transit
```bash
# S3 with server-side encryption
aws s3 cp backup.dump s3://my-backups/ \
  --server-side-encryption AES256 \
  --ssekms-key-id arn:aws:kms:us-east-1:123456789012:key/abc-def-123
```

### Encrypted Backup Script
```bash
#!/bin/bash
# encrypted_backup.sh

BACKUP_FILE="backup_$(date +%Y%m%d).dump"
GPG_RECIPIENT="backup@company.com"

# Create backup
pg_dump -Fc mydb > "$BACKUP_FILE"

# Encrypt with GPG
gpg --cipher-algo AES256 --compress-algo 1 \
  --trust-model always \
  --recipient "$GPG_RECIPIENT" \
  --encrypt "$BACKUP_FILE"

# Remove unencrypted file
shred -vfz -n 3 "$BACKUP_FILE"

# Upload encrypted backup
aws s3 cp "$BACKUP_FILE.gpg" s3://my-backups/

echo "✅ Encrypted backup uploaded"
```

## Backup Verification

### Automated Verification Script
```bash
#!/bin/bash
# verify_backup.sh

BACKUP_FILE=$1
TEST_DB="mydb_test_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "==================================="
echo "Starting Backup Verification"
echo "==================================="
echo "Backup file: $BACKUP_FILE"
echo "Test database: $TEST_DB"
echo ""

# Create test database
echo "Creating test database..."
createdb "$TEST_DB"

# Restore backup
echo "Restoring backup..."
if pg_restore --verbose --clean --if-exists --no-acl --no-owner \
  --dbname="$TEST_DB" "$BACKUP_FILE"; then
  echo "✅ Restore completed successfully"
else
  echo "❌ Restore failed"
  exit 1
fi

# Verify data integrity
echo ""
echo "Verifying data integrity..."

# Check table counts
echo "Checking table counts..."
for table in users orders products; do
  COUNT=$(psql -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM $table;" | xargs)
  echo "  $table: $COUNT rows"
done

# Check for NULL critical columns
echo ""
echo "Checking for NULL values in critical columns..."
NULL_EMAILS=$(psql -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM users WHERE email IS NULL;" | xargs)
if [ "$NULL_EMAILS" -gt 0 ]; then
  echo "⚠️  Warning: $NULL_EMAILS users with NULL email"
else
  echo "✅ All emails present"
fi

# Check referential integrity
echo ""
echo "Checking referential integrity..."
ORPHAN_ORDERS=$(psql -d "$TEST_DB" -t -c "
  SELECT COUNT(*) FROM orders o
  LEFT JOIN users u ON o.user_id = u.id
  WHERE u.id IS NULL;" | xargs)

if [ "$ORPHAN_ORDERS" -gt 0 ]; then
  echo "❌ Found $ORPHAN_ORDERS orphan orders"
  exit 1
else
  echo "✅ Referential integrity OK"
fi

# Check indexes
echo ""
echo "Checking indexes..."
psql -d "$TEST_DB" -c "
  SELECT schemaname, tablename, indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;"

# Run application tests
echo ""
echo "Running application tests..."
if psql -d "$TEST_DB" -f test/verify_queries.sql > /dev/null 2>&1; then
  echo "✅ Application tests passed"
else
  echo "❌ Application tests failed"
  exit 1
fi

# Performance check
echo ""
echo "Performance check..."
START_TIME=$(date +%s)
psql -d "$TEST_DB" -c "SELECT COUNT(*) FROM users u JOIN orders o ON u.id = o.user_id;" > /dev/null
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ "$DURATION" -lt 10 ]; then
  echo "✅ Query performance OK (${DURATION}s)"
else
  echo "⚠️  Slow query performance (${DURATION}s)"
fi

# Cleanup
echo ""
echo "Cleaning up test database..."
dropdb "$TEST_DB"

echo ""
echo "==================================="
echo "✅ Backup Verification Complete"
echo "==================================="
echo "Status: PASSED"
echo "Verification time: $(date)"
echo "Backup file: $BACKUP_FILE"
```

### Continuous Verification
```bash
#!/bin/bash
# continuous_backup_monitor.sh

# Check for recent backups
LAST_BACKUP=$(find /backups -name "full_*.dump.gz" -type f -mtime -1 | wc -l)

if [ "$LAST_BACKUP" -eq 0 ]; then
  echo "⚠️  WARNING: No backups found in the last 24 hours"
  # Send alert
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d '{"text":":warning: No database backups found in the last 24 hours!"}'
fi

# Check backup size (detect corruption)
BACKUP_SIZE=$(stat -f%z /backups/latest.dump.gz 2>/dev/null || stat -c%s /backups/latest.dump.gz 2>/dev/null)
MIN_SIZE=$((100 * 1024 * 1024))  # 100 MB

if [ "$BACKUP_SIZE" -lt "$MIN_SIZE" ]; then
  echo "⚠️  WARNING: Backup size suspicious ($BACKUP_SIZE bytes)"
fi

# Check encryption (if applicable)
if [[ /backups/latest.dump.gz.gpg -nt /backups/latest.dump.gz ]]; then
  echo "✅ Latest backup is encrypted"
else
  echo "⚠️  WARNING: Latest backup may not be encrypted"
fi
```

## Disaster Recovery Procedures

### Complete Failure Recovery
```bash
#!/bin/bash
# disaster_recovery.sh

NEW_DB_HOST="db-backup-site.example.com"
BACKUP_FILE="s3://my-backups/full_20251102.dump.gz"

echo "========================================="
echo "DISASTER RECOVERY PROCEDURE"
echo "========================================="

# Step 1: Prepare new server
echo ""
echo "Step 1: Installing PostgreSQL on new server..."
ssh backup-user@$NEW_DB_HOST << 'EOF'
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
  sudo systemctl enable postgresql
  sudo systemctl start postgresql
EOF

# Step 2: Download latest backup
echo ""
echo "Step 2: Downloading latest backup..."
ssh backup-user@$NEW_DB_HOST << EOF
  aws s3 cp $BACKUP_FILE /tmp/
  gunzip /tmp/full_20251102.dump.gz
EOF

# Step 3: Create database and restore
echo ""
echo "Step 3: Restoring database..."
ssh backup-user@$NEW_DB_HOST << 'EOF'
  sudo -u postgres createdb mydb
  sudo -u postgres pg_restore -d mydb /tmp/full_20251102.dump
EOF

# Step 4: Configure database
echo ""
echo "Step 4: Configuring database..."
ssh backup-user@$NEW_DB_HOST << 'EOF'
  # Update postgresql.conf
  sudo sed -i 's/#listen_addresses = .*/listen_addresses = "0.0.0.0"/' /etc/postgresql/*/main/postgresql.conf

  # Update pg_hba.conf
  sudo tee -a /etc/postgresql/*/main/pg_hba.conf << EOD
host mydb all 10.0.0.0/8 md5
EOD

  # Restart PostgreSQL
  sudo systemctl restart postgresql
EOF

# Step 5: Verify restoration
echo ""
echo "Step 5: Verifying restoration..."
ssh backup-user@$NEW_DB_HOST << 'EOF'
  sudo -u postgres psql -d mydb -c "SELECT COUNT(*) FROM users;"
  sudo -u postgres psql -d mydb -c "SELECT COUNT(*) FROM orders;"
EOF

# Step 6: Update application configuration
echo ""
echo "Step 6: Update application configuration"
echo "DATABASE_URL=postgresql://user:pass@$NEW_DB_HOST/mydb"

# Step 7: Test application
echo ""
echo "Step 7: Test application connectivity..."
if psql "postgresql://user:pass@$NEW_DB_HOST/mydb" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Application connection successful"
else
  echo "❌ Application connection failed"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ DISASTER RECOVERY COMPLETED"
echo "========================================="
echo "New database host: $NEW_DB_HOST"
echo "Database: mydb"
echo ""
echo "Next steps:"
echo "1. Update DNS records"
echo "2. Update firewall rules"
echo "3. Reconfigure monitoring"
echo "4. Notify stakeholders"
```

### Point-in-Time Recovery (PITR)
```bash
#!/bin/bash
# point_in_time_recovery.sh

TARGET_TIME="${1:-2025-11-02 14:30:00}"
RECOVERY_DB="mydb_recovery"
BACKUP_BASE="s3://my-backups"

echo "========================================="
echo "POINT-IN-TIME RECOVERY"
echo "========================================="
echo "Target time: $TARGET_TIME"
echo "Recovery database: $RECOVERY_DB"
echo ""

# Step 1: Restore base backup
echo "Step 1: Restoring base backup..."
createdb "$RECOVERY_DB"
pg_restore -d "$RECOVERY_DB" "${BACKUP_BASE}/full_20251102.dump"

# Step 2: Create recovery.conf
echo "Step 2: Configuring PITR..."
cat > recovery.conf << EOF
restore_command = 'aws s3 cp ${BACKUP_BASE}/wal/%f /var/lib/postgresql/wal/%p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_action = 'promote'
EOF

# Step 3: Start PostgreSQL with PITR
echo "Step 3: Starting PostgreSQL for recovery..."
sudo systemctl start postgresql

# Step 4: Monitor recovery
echo "Step 4: Monitoring recovery..."
tail -f /var/log/postgresql/postgresql-*.log

# Step 5: Verify
echo "Step 5: Verifying recovery..."
psql -d "$RECOVERY_DB" -c "SELECT COUNT(*) FROM orders;"

echo ""
echo "========================================="
echo "✅ POINT-IN-TIME RECOVERY COMPLETED"
echo "========================================="
```

## Backup Monitoring & Alerting

### Prometheus Monitoring
```yaml
# backup_exporter.yml
groups:
  - name: database_backup
    rules:
      - alert: BackupFailed
        expr: time() - database_backup_last_success_timestamp > 86400
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Database backup has failed"
          description: "Last successful backup was more than 24 hours ago"

      - alert: BackupStale
        expr: database_backup_size_bytes < 100000000
        for: 0m
        labels:
          severity: warning
        annotations:
          summary: "Database backup size suspiciously small"
          description: "Backup size is less than 100MB, possible corruption"

      - alert: BackupTooOld
        expr: time() - database_backup_last_success_timestamp > 604800
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Database backup is older than 7 days"
          description: "No backup in the last 7 days"
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Database Backup Status",
    "panels": [
      {
        "title": "Last Backup Time",
        "type": "stat",
        "targets": [
          {
            "expr": "database_backup_last_success_timestamp",
            "legendFormat": "Last Success"
          }
        ]
      },
      {
        "title": "Backup Size",
        "type": "graph",
        "targets": [
          {
            "expr": "database_backup_size_bytes",
            "legendFormat": "Size"
          }
        ]
      },
      {
        "title": "Backup Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "database_backup_duration_seconds",
            "legendFormat": "Duration"
          }
        ]
      },
      {
        "title": "Backup Status",
        "type": "table",
        "targets": [
          {
            "expr": "changes database_backup_status",
            "legendFormat": "Status"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules
```bash
#!/bin/bash
# check_backup_health.sh

# Check backup age
LAST_BACKUP=$(stat -f%Y /backups/latest.dump 2>/dev/null || stat -c%Y /backups/latest.dump 2>/dev/null)
NOW=$(date +%s)
AGE_HOURS=$(( (NOW - LAST_BACKUP) / 3600 ))

if [ "$AGE_HOURS" -gt 24 ]; then
  echo "CRITICAL: Backup is $AGE_HOURS hours old"
  # Send critical alert
fi

# Check backup size
SIZE=$(stat -f%z /backups/latest.dump 2>/dev/null || stat -c%s /backups/latest.dump 2>/dev/null)
MIN_SIZE=$((100 * 1024 * 1024))  # 100 MB

if [ "$SIZE" -lt "$MIN_SIZE" ]; then
  echo "WARNING: Backup size ($SIZE bytes) is too small"
  # Send warning alert
fi

# Check for corruption
if ! pg_restore --list /backups/latest.dump > /dev/null 2>&1; then
  echo "CRITICAL: Backup appears to be corrupted"
  # Send critical alert
fi
```

## Backup Testing Schedule

### Daily Checks
```bash
#!/bin/bash
# daily_backup_check.sh

# Verify last backup exists
# Check backup size
# Verify backup integrity
# Test restore to staging
# Run automated tests
```

### Weekly Tests
```bash
#!/bin/bash
# weekly_full_test.sh

# Full disaster recovery test
# Measure RTO (Recovery Time Objective)
# Measure RPO (Recovery Point Objective)
# Document issues and improvements
```

### Monthly Validation
```bash
#!/bin/bash
# monthly_backup_validation.sh

# Validate all backup destinations
# Test cloud storage access
# Verify encryption keys
# Update disaster recovery documentation
# Review and update RTO/RPO targets
```

---

**Estado**: Backup strategies y disaster recovery documentadas
**Coverage**: Full, incremental, differential, snapshot backups
**Automation**: Scripts for backup, verification, disaster recovery
**Monitoring**: Prometheus metrics, Grafana dashboards, alerting
**Testing**: Daily, weekly, monthly validation procedures
