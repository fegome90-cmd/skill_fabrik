---
id: database-management
version: 0.1.0
type: guideline
summary: 'Guía completa de database management: schema design, migrations, optimization, backup/recovery, y maintenance. Implementa robust database architecture y operations.'
description: 'Guía completa de database management que abarca: schema design, migrations, optimization, backup/recovery, y maintenance. Implementa robust database architecture y operations para production environments.'
audience: developers, dbas, devops, architects
when_to_use: 'Para design de nuevos databases, refactoring de schemas, performance optimization, y disaster recovery planning. Usa en every database change y quarterly reviews.'
provides: 'Robust database design, versioned migrations, optimized queries, reliable backups, disaster recovery capability, y operational excellence.'
resources:
  - resources/design.md
  - resources/migrations.md
  - resources/optimization.md
  - resources/backup.md
scripts:
  - name: init-db
    run: npx prisma init && npx prisma migrate dev --name init
    note: Inicializa database con Prisma
  - name: migrate
    run: npx prisma migrate dev --name "migration-name"
    note: Ejecuta database migration
  - name: backup
    run: pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
    note: Crea database backup (PostgreSQL)
  - name: analyze-db
    run: npx prisma db pull && npx prisma generate
    note: Actualiza Prisma schema desde database
limits: 'Requiere DBA expertise. Schema changes son risky. Backup verification essential. Migration rollback plans necesarios. Performance impact de schema changes.'
---

## Objetivo

Establecer **estrategias integrales de database management** para design, maintain, optimize, y recover databases en production environments.

**Cuándo usar**:
- New application database setup
- Schema changes o refactoring
- Performance optimization
- Disaster recovery planning
- Database migration projects
- Quarterly health reviews

**Cuándo NO usar**: Para simple prototypes, temporary data stores, o applications con minimal data requirements.

**Qué problema resuelve**: Data inconsistency, performance issues, backup failures, migration disasters, data loss, y poor database design.

## Database Management Lifecycle

### 1. Design Phase
- **Requirements gathering** - Understand data needs
- **Schema design** - Normalization y denormalization decisions
- **ERD creation** - Entity relationship diagrams
- **Constraint definition** - PKs, FKs, unique constraints
- **Index strategy** - Performance considerations
- **Naming conventions** - Consistency across database

### 2. Development Phase
- **Migration scripts** - Version-controlled changes
- **Seed data** - Test data population
- **Development database** - Isolate from production
- **Testing** - Unit tests para queries
- **Review process** - Code review for schema changes

### 3. Production Phase
- **Deployment strategy** - Zero-downtime migrations
- **Monitoring** - Performance, connections, locks
- **Maintenance** - VACUUM, statistics updates
- **Backup verification** - Regular restore tests
- **Scaling** - Read replicas, sharding

### 4. Optimization Phase
- **Query analysis** - Slow query identification
- **Index optimization** - Add/remove/rebuild indexes
- **Statistics updates** - Query planner improvements
- **Architecture changes** - Partitioning, sharding

## Schema Design Principles

### Normalization
**First Normal Form (1NF)**
- [ ] **Atomic values** - No repeating groups
- [ ] **Primary key** - Each row uniquely identified
- [ ] **No arrays or multi-valued fields**

**Second Normal Form (2NF)**
- [ ] **1NF compliance**
- [ ] **No partial dependencies** - Non-key columns depend on entire primary key

**Third Normal Form (3NF)**
- [ ] **2NF compliance**
- [ ] **No transitive dependencies** - Non-key columns depend only on PK

**Example - Proper Normalization:**
```sql
-- Bad: Repeating groups
CREATE TABLE orders_bad (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  customer_email VARCHAR(100),
  product_ids VARCHAR(500), -- Comma-separated list
  quantities VARCHAR(500)     -- Comma-separated
);

-- Good: Normalized
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  UNIQUE(email)
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10, 2)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  UNIQUE(order_id, product_id)
);
```

### Data Types Selection

**Numeric Types**
- Use **INTEGER** for whole numbers (-2B to 2B)
- Use **BIGINT** for large numbers
- Use **DECIMAL(p, s)** for precise money/percentages
- Use **REAL/FLOAT** only when approximate values acceptable

**String Types**
- Use **VARCHAR(n)** for variable-length strings
- Use **TEXT** for unlimited length (when necessary)
- Avoid **CHAR(n)** unless fixed-length required

**Date/Time Types**
- Use **TIMESTAMP** for date and time
- Use **DATE** for date only (no time)
- Use **TIMESTAMPTZ** for timezone-aware timestamps
- Use **INTERVAL** for time differences

**Boolean**
- Use **BOOLEAN** for true/false values

### Constraints Best Practices

**Primary Keys**
```sql
-- Auto-incrementing (PostgreSQL)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  ...
);

-- UUID (globally unique)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- Natural key (if truly unique)
CREATE TABLE countries (
  code CHAR(2) PRIMARY KEY, -- ISO country codes
  name VARCHAR(100) NOT NULL
);
```

**Foreign Keys**
```sql
-- Referential integrity
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
```

**Check Constraints**
```sql
-- Enforce business rules
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100)
);
```

**Unique Constraints**
```sql
-- Ensure uniqueness
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  UNIQUE(email),
  UNIQUE(username)
);
```

## Database Design Patterns

### 1. Inheritance Patterns

**Single Table Inheritance**
```sql
-- All types in one table with type discriminator
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'invoice', 'contract', 'report'
  -- Common fields
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Invoice-specific
  invoice_number VARCHAR(50),
  total_amount DECIMAL(10, 2),
  -- Contract-specific
  contract_value DECIMAL(10, 2),
  start_date DATE,
  end_date DATE
);
```

**Class Table Inheritance**
```sql
-- Separate tables with shared base
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY REFERENCES documents(id),
  invoice_number VARCHAR(50) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY REFERENCES documents(id),
  contract_value DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);
```

### 2. Audit Pattern
```sql
-- Track all changes automatically
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Soft Delete Pattern
```sql
-- Mark as deleted instead of removing
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL, -- NULL = active, timestamp = deleted
  CONSTRAINT valid_delete_time CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

-- Query with soft delete filter
CREATE OR REPLACE VIEW active_orders AS
SELECT * FROM orders
WHERE deleted_at IS NULL;
```

## Migration Strategy

### Migration Principles
1. **Version controlled** - Track all changes
2. **Backward compatible** - Don't break existing code
3. **Reversible** - Can rollback if needed
4. **Tested** - Test in staging first
5. **Documented** - Clear migration descriptions
6. **Idempotent** - Can run multiple times safely

### Migration Workflow

**Development Phase**
```bash
# Create new migration
npx prisma migrate dev --name "add-user-preferences"

# This creates:
# migrations/
#   20251102_add_user_preferences/
#     migration.sql
#     README.md
```

**Testing Phase**
```bash
# Test migration in staging
npx prisma migrate deploy

# Verify data integrity
npm run test:db:integrity

# Test rollback
npx prisma migrate reset
```

**Production Deployment**
```bash
# Create production migration (Django example)
python manage.py makemigrations
python manage.py migrate --plan

# Deploy migration
python manage.py migrate

# Verify successful deployment
npm run test:db:verify
```

### Safe Migration Patterns

**Add Column (Backward Compatible)**
```sql
-- Step 1: Add column with default
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- Step 2: Application code starts using column
-- No breaking changes

-- Step 3: Backfill data (if needed)
UPDATE users
SET preferences = jsonb_build_object(
  'theme', 'light',
  'notifications', true
)
WHERE preferences = '{}';

-- Step 4: Update NOT NULL constraint
ALTER TABLE users
ALTER COLUMN preferences SET NOT NULL;
```

**Rename Column (Safe)**
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);

-- Step 2: Copy data
UPDATE users
SET email_address = email;

-- Step 3: Application updates to use new column

-- Step 4: Remove old column
ALTER TABLE users DROP COLUMN email;
```

**Split Table (Partitioning)**
```sql
-- Create partitioned table
CREATE TABLE orders_2025 (
  LIKE orders INCLUDING ALL
) PARTITION OF orders
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
