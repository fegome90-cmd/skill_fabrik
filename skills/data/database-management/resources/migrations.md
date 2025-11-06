# Database Migrations - Estrategias y Versioning

## Migration Principles

### Golden Rules
1. **Version Controlled** - Every change tracked in Git
2. **Idempotent** - Can run multiple times safely
3. **Reversible** - Can rollback if needed
4. **Backward Compatible** - Don't break existing code
5. **Tested** - Always test in staging first
6. **Documented** - Clear description of changes
7. **Atomic** - All-or-nothing execution

### Migration File Structure
```
migrations/
├── 20251102_143000_create_users_table.sql
├── 20251102_144500_add_user_preferences.sql
├── 20251102_150000_create_products_table.sql
└── README.md
```

## Migration Strategies

### Forward-Only (Dangerous)
```sql
-- Only forward migration, no rollback
-- USE WITH CAUTION

BEGIN;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- This is dangerous because if something fails later,
-- you need manual rollback
COMMIT;
```

### Reversible Migrations (Recommended)
```sql
-- Create table (forward)
-- File: migrations/20251102_143000_create_users_table.sql

BEGIN;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Rollback instructions in comments
-- ROLLBACK:
-- DROP INDEX idx_users_email;
-- DROP TABLE users;

COMMIT;

---

-- Rollback migration
-- File: migrations/20251102_143000_create_users_table.down.sql

BEGIN;

DROP INDEX IF EXISTS idx_users_email;
DROP TABLE users;

COMMIT;
```

### Up/Down Pattern
```sql
-- Migrations versioned by timestamp

-- Up migration: 20251102_143000_add_user_preferences.up.sql
BEGIN;

-- Add new column
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- Create index on new column
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

COMMIT;

---

-- Down migration: 20251102_143000_add_user_preferences.down.sql
BEGIN;

-- Drop index
DROP INDEX idx_users_preferences;

-- Drop column
ALTER TABLE users DROP COLUMN preferences;

COMMIT;
```

## Safe Migration Patterns

### 1. Add Column (Zero Downtime)

#### Pattern: Add with Default, Backfill, Set NOT NULL
```sql
-- Step 1: Add column with default (no NOT NULL constraint)
-- migration: 20251102_143000_add_user_status.up.sql
BEGIN;

ALTER TABLE users
  ADD COLUMN status VARCHAR(20) DEFAULT 'active';

CREATE INDEX idx_users_status ON users(status);

COMMIT;

-- Step 2: Backfill data (can be done separately)
-- script: backfill_user_status.sh
psql -d mydb << 'EOF'
  UPDATE users
  SET status = 'active'
  WHERE status IS NULL;
EOF

-- Step 3: Add NOT NULL constraint
-- migration: 20251102_144500_add_user_status_not_null.up.sql
BEGIN;

ALTER TABLE users
  ALTER COLUMN status SET NOT NULL;

COMMIT;

---

-- Rollback: Remove column
-- migration: 20251102_144500_add_user_status_not_null.down.sql
BEGIN;

ALTER TABLE users
  ALTER COLUMN status DROP NOT NULL;

COMMIT;

-- migration: 20251102_143000_add_user_status.down.sql
BEGIN;

DROP INDEX idx_users_status;
ALTER TABLE users DROP COLUMN status;

COMMIT;
```

### 2. Rename Column (Safe)

#### Pattern: Add New Column, Sync Data, Switch, Remove Old
```sql
-- Step 1: Add new column
-- migration: 20251102_143000_rename_email.up.sql
BEGIN;

ALTER TABLE users
  ADD COLUMN email_address VARCHAR(255);

-- Copy data
UPDATE users
SET email_address = email;

-- Add unique constraint
ALTER TABLE users
  ADD CONSTRAINT unique_users_email_address
  UNIQUE (email_address);

COMMIT;

---

-- Step 2: Update application code to use email_address
-- (Deploy new version)

---

-- Step 3: Remove old column
-- migration: 20251102_150000_drop_old_email_column.up.sql
BEGIN;

ALTER TABLE users DROP COLUMN email;

COMMIT;

---

-- Rollback: Restore from backup or recreate
-- This is complex, so document the backup point
```

### 3. Create Index (Concurrently)

#### PostgreSQL: CONCURRENTLY
```sql
-- migration: 20251102_143000_create_indexes.up.sql
BEGIN;

-- Regular index (locks table)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Concurrent index (no lock, slower but safe)
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at DESC);

-- Concurrent partial index
CREATE INDEX CONCURRENTLY idx_active_customers ON customers(email)
WHERE active = true;

-- Concurrent unique index
CREATE UNIQUE INDEX CONCURRENTLY idx_unique_customer_email
ON customers(email) WHERE deleted_at IS NULL;

COMMIT;

---

-- Rollback: Drop indexes
-- migration: 20251102_143000_create_indexes.down.sql
BEGIN;

DROP INDEX CONCURRENTLY IF EXISTS idx_orders_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_active_customers;
DROP INDEX CONCURRENTLY IF EXISTS idx_unique_customer_email;

COMMIT;
```

### 4. Modify Column Type

#### Pattern: Add New Column, Convert, Switch, Remove Old
```sql
-- Change INT to BIGINT

-- Step 1: Add new column with target type
-- migration: 20251102_143000_change_id_type.up.sql
BEGIN;

ALTER TABLE orders
  ADD COLUMN new_id BIGINT;

-- Copy and convert data
UPDATE orders
SET new_id = id::BIGINT;

-- Add primary key constraint
ALTER TABLE orders
  ADD CONSTRAINT pk_orders_new_id PRIMARY KEY (new_id);

COMMIT;

---

-- Step 2: Create foreign keys to new column
-- (Update child tables)

-- migration: 20251102_144000_update_foreign_keys.up.sql
BEGIN;

-- Update child table
ALTER TABLE order_items
  ADD COLUMN order_new_id BIGINT;

UPDATE order_items
SET order_new_id = oi.order_id::BIGINT
FROM orders oi
WHERE order_items.order_id = oi.id;

-- Drop old foreign key
ALTER TABLE order_items DROP CONSTRAINT fk_order_items_order_id;

-- Add new foreign key
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order_new_id
  FOREIGN KEY (order_new_id) REFERENCES orders(new_id) ON DELETE CASCADE;

-- Drop old column
ALTER TABLE order_items DROP COLUMN order_id;

-- Rename new column
ALTER TABLE order_items RENAME COLUMN order_new_id TO order_id;

COMMIT;

---

-- Step 3: Switch table references
-- (Update application code)

---

-- Step 4: Remove old column and rename
-- migration: 20251102_150000_finalize_id_change.up.sql
BEGIN;

-- Drop old primary key
ALTER TABLE orders DROP CONSTRAINT pk_orders_new_id;
ALTER TABLE orders DROP COLUMN id;

-- Rename new column
ALTER TABLE orders RENAME COLUMN new_id TO id;

-- Add new primary key
ALTER TABLE orders ADD CONSTRAINT pk_orders PRIMARY KEY (id);

COMMIT;
```

### 5. Create Table with Data

#### Pattern: Create Empty, Copy Data, Switch
```sql
-- Partition large table by date

-- Step 1: Create new partitioned table
-- migration: 20251102_143000_create_partitioned_table.up.sql
BEGIN;

CREATE TABLE orders_2025 (
  LIKE orders INCLUDING ALL
) PARTITION OF orders
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE INDEX idx_orders_2025_customer ON orders_2025(customer_id);
CREATE INDEX idx_orders_2025_created_at ON orders_2025(created_at);

COMMIT;

---

-- Step 2: Create trigger to insert to correct partition
-- migration: 20251102_144000_add_partitioning_trigger.up.sql
BEGIN;

CREATE OR REPLACE FUNCTION orders_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at >= '2025-01-01' AND NEW.created_at < '2026-01-01' THEN
    INSERT INTO orders_2025 VALUES (NEW.*);
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_insert ON orders;
CREATE TRIGGER orders_insert
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_insert_trigger();

COMMIT;
```

### 6. Data Migration

#### Batch Processing
```sql
-- Large data migration in batches
-- script: migrate_user_data.sh
#!/bin/bash

BATCH_SIZE=1000
OFFSET=0

while true; do
  COUNT=$(psql -d mydb -t << EOF
    UPDATE users
    SET preferences = jsonb_build_object(
      'theme', COALESCE(preferences->>'theme', 'light'),
      'notifications', COALESCE((preferences->>'notifications')::boolean, true)
    )
    WHERE id IN (
      SELECT id FROM users
      WHERE preferences->>'migrated' IS NULL
      ORDER BY id
      LIMIT $BATCH_SIZE
      OFFSET $OFFSET
    )
    RETURNING 1;
EOF
  )

  if [ -z "$COUNT" ]; then
    break
  fi

  OFFSET=$((OFFSET + BATCH_SIZE))
  echo "Migrated $OFFSET records..."

  sleep 1  -- Brief pause to avoid overwhelming database
done

echo "Migration complete!"
```

#### Validation
```sql
-- Verify data integrity after migration
-- script: validate_migration.sh
#!/bin/bash

echo "Validating user preferences migration..."

# Check for NULL preferences (shouldn't exist)
NULL_COUNT=$(psql -d mydb -t -c "SELECT COUNT(*) FROM users WHERE preferences IS NULL;")
if [ "$NULL_COUNT" -gt 0 ]; then
  echo "❌ Validation failed: $NULL_COUNT users with NULL preferences"
  exit 1
fi

# Check schema
EXPECTED_KEYS="theme"
for KEY in $EXPECTED_KEYS; do
  MISSING=$(psql -d mydb -t -c "SELECT COUNT(*) FROM users WHERE NOT (preferences ? '$KEY');")
  if [ "$MISSING" -gt 0 ]; then
    echo "⚠️  Warning: $MISSING users missing '$KEY' in preferences"
  fi
done

# Check counts
TOTAL=$(psql -d mydb -t -c "SELECT COUNT(*) FROM users;")
echo "Total users: $TOTAL"
echo "✅ Validation passed"
```

## Migration Tools

### Prisma Migrations

#### Setup
```bash
# Initialize
npx prisma init

# Create migration
npx prisma migrate dev --name add-user-preferences

# Generate client
npx prisma generate

# Apply to production
npx prisma migrate deploy

# Reset development database
npx prisma migrate reset

# Create migration without applying
npx prisma migrate dev --create-only --name add-product-table
```

#### Prisma Schema
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  name         String?
  preferences  Json     @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Product {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  price       Decimal  @db.Decimal(10, 2)
  categoryId  String?  @map("category_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  category    Category? @relation(fields: [categoryId], references: [id])
  @@map("products")
}
```

#### Custom Migrations
```sql
-- Generated by Prisma but can be edited
-- File: migrations/20251102_143000_add_user_preferences/migration.sql

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive', 'suspended');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");
```

### Flyway Migrations

#### Setup
```bash
# Install
npm install -g flyway

# Configure
cat > flyway.conf << 'EOF'
flyway.url=jdbc:postgresql://localhost:5432/mydb
flyway.user=postgres
flyway.password=password
flyway.locations=filesystem:sql/migrations
flyway.table=schema_version
EOF

# Create migration
echo "CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL
);" > sql/migrations/V1__Create_users_table.sql

# Run migrations
flyway migrate

# Check status
flyway info

# Repair (if schema version table is corrupted)
flyway repair

# Rollback (requires undo migrations)
flyway undo
```

### Liquibase

#### Setup
```bash
# Maven
<dependency>
  <groupId>org.liquibase</groupId>
  <artifactId>liquibase-core</artifactId>
  <version>4.20.0</version>
</dependency>

# Gradle
implementation 'org.liquibase:liquibase-core:4.20.0'
```

#### Changelog XML
```xml
<!-- changelog.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

  <changeSet id="1" author="developer">
    <createTable tableName="users">
      <column name="id" type="INT" autoIncrement="true">
        <constraints primaryKey="true" nullable="false"/>
      </column>
      <column name="email" type="VARCHAR(255)">
        <constraints nullable="false" unique="true"/>
      </column>
      <column name="created_at" type="TIMESTAMP">
        <constraints nullable="false"/>
      </column>
    </createTable>
  </changeSet>

  <changeSet id="2" author="developer">
    <addColumn tableName="users">
      <column name="preferences" type="JSONB" defaultValue="{}"/>
    </addColumn>
  </changeSet>

  <changeSet id="3" author="developer">
    <createIndex tableName="users" indexName="idx_users_email">
      <column name="email"/>
    </createIndex>
  </changeSet>

</databaseChangeLog>
```

#### Rollback
```sql
-- Rollback changesets
 liquibase rollback-count 3 -- Rollback last 3 changesets
 liquibase rollback-to-date "2025-11-02T14:30:00" -- Rollback to specific time
```

### Django Migrations

#### Automatic Migrations
```bash
# Create migration from models.py
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration plan
python manage.py migrate --plan

# Create empty migration for custom SQL
python manage.py makemigrations --empty appname
```

#### Custom Migration
```python
# migrations/0002_add_user_preferences.py
from django.db import migrations, models
import jsonfield.fields

class Migration(migrations.Migration):

    dependencies = [
        ('appname', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='preferences',
            field=jsonfield.fields.JSONField(blank=True, default=dict),
        ),
        migrations.RunSQL(
            sql="CREATE INDEX idx_users_preferences ON users USING GIN (preferences);",
            reverse_sql="DROP INDEX idx_users_preferences;",
        ),
    ]
```

## Deployment Strategies

### Blue-Green Deployment Pattern

```bash
# 1. Create green database with new schema
createdb mydb_green

# 2. Apply migrations to green database
npx prisma migrate deploy --schema=prisma/schema.prisma --db-url=postgresql://localhost/mydb_green

# 3. Migrate data from blue to green
pg_dump mydb_blue | psql mydb_green

# 4. Run data validation on green
npm run test:db:validate -- --db-url=postgresql://localhost/mydb_green

# 5. Switch application to green (update DATABASE_URL)

# 6. Monitor for issues

# 7. Drop blue database
dropdb mydb_blue
```

### Rolling Deployment Pattern

```sql
-- Use conditional DDL based on schema version

-- Check current version
DO $$
DECLARE
  version_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'schema_version'
  ) INTO version_exists;

  IF NOT version_exists THEN
    -- Initial migration
    CREATE TABLE schema_version (
      version VARCHAR(50) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO schema_version (version) VALUES ('001');

    -- Create initial tables
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL
    );
  END IF;
END $$;

-- Check if version already applied
SELECT NOT EXISTS (
  SELECT 1 FROM schema_version WHERE version = '002'
) AS should_apply;

-- Only run if not already applied
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM schema_version WHERE version = '002') THEN
    -- Add new column
    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

    -- Mark as applied
    INSERT INTO schema_version (version) VALUES ('002');
  END IF;
END $$;
```

## Migration Testing

### Unit Tests
```sql
-- Test migration in transaction
BEGIN;

-- Apply migration
\i 20251102_143000_add_user_preferences.up.sql

-- Test data
INSERT INTO users (email) VALUES ('test@example.com');

-- Validate
SELECT COUNT(*) = 1 FROM users WHERE preferences = '{}';

-- Rollback
ROLLBACK;
```

### Integration Tests
```python
# Python pytest for migrations
import pytest
from sqlalchemy import create_engine
from migrations import upgrade, downgrade

@pytest.fixture
def db():
    engine = create_engine('postgresql://localhost/test_db')
    connection = engine.connect()

    # Run upgrade
    upgrade(connection)

    yield connection

    # Cleanup
    connection.close()

def test_user_preferences_column(db):
    result = db.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
    columns = [row[0] for row in result]

    assert 'preferences' in columns

def test_user_preferences_default(db):
    result = db.execute("INSERT INTO users (email) VALUES ('test@example.com') RETURNING preferences")
    preferences = result.fetchone()[0]

    assert preferences == '{}'
```

### Test Database Setup
```bash
#!/bin/bash
# test/migrate-test-db.sh

set -e

TEST_DB="mydb_test_$(date +%s)"

echo "Creating test database: $TEST_DB"
createdb "$TEST_DB"

echo "Running migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma --db-url=postgresql://localhost/$TEST_DB

echo "Seeding test data..."
psql -d "$TEST_DB" -f test/seed.sql

echo "Running tests..."
npm test

echo "Cleaning up..."
dropdb "$TEST_DB"

echo "Test complete!"
```

## Migration Monitoring

### Track Migration Progress
```sql
-- Create migration log table
CREATE TABLE migration_log (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INT,
  error_message TEXT
);

-- Log from migration script
-- File: migration_with_logging.sql
BEGIN;

INSERT INTO migration_log (migration_name, status, started_at)
VALUES ('add_user_preferences', 'started', CURRENT_TIMESTAMP);

-- Apply migration
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Mark as completed
UPDATE migration_log
SET status = 'completed',
    completed_at = CURRENT_TIMESTAMP,
    duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) * 1000
WHERE migration_name = 'add_user_preferences'
  AND status = 'started';

COMMIT;
```

### Migration Health Checks
```sql
-- Check for long-running migrations
SELECT
  migration_name,
  started_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) AS duration_seconds,
  status
FROM migration_log
WHERE status = 'started'
  AND (CURRENT_TIMESTAMP - started_at) > INTERVAL '10 minutes';

-- Check failed migrations
SELECT * FROM migration_log
WHERE status = 'failed'
ORDER BY started_at DESC;

-- Migration success rate
SELECT
  COUNT(*) AS total_migrations,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS successful,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) AS success_rate
FROM migration_log;
```

## Rollback Procedures

### Automated Rollback Script
```bash
#!/bin/bash
# rollback.sh

MIGRATION=$1

if [ -z "$MIGRATION" ]; then
  echo "Usage: $0 <migration_name>"
  exit 1
fi

echo "Rolling back migration: $MIGRATION"

# Check if rollback file exists
if [ -f "migrations/${MIGRATION}.down.sql" ]; then
  echo "Applying rollback migration..."
  psql -d mydb -f "migrations/${MIGRATION}.down.sql"

  if [ $? -eq 0 ]; then
    echo "✅ Rollback successful"
    exit 0
  else
    echo "❌ Rollback failed"
    exit 1
  fi
else
  echo "❌ Rollback file not found: migrations/${MIGRATION}.down.sql"
  exit 1
fi
```

### Point-in-Time Recovery
```bash
#!/bin/bash
# point-in-time-recovery.sh

TARGET_TIME=$1

if [ -z "$TARGET_TIME" ]; then
  echo "Usage: $0 '<timestamp>'"
  echo "Example: $0 '2025-11-02 14:30:00'"
  exit 1
fi

echo "Restoring to point in time: $TARGET_TIME"

# Restore from base backup
pg_restore -d mydb_restore backup.dump

# Apply WAL files up to target time
pg_restore --verbose --clean --if-exists --no-acl --no-owner \
  --dbname=mydb_restore \
  --target-time="$TARGET_TIME" \
  backup.dump

echo "Point-in-time recovery complete"
```

---

**Estado**: Migration strategies documentadas
**Coverage**: Safe patterns, tools, testing, deployment, rollback
**Best Practices**: Idempotent, reversible, tested migrations
