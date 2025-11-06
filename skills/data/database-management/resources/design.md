# Database Schema Design - Patrones y Best Practices

## Normalization vs Denormalization

### Normalization Principles

#### First Normal Form (1NF)
**Requirements:**
- Each cell contains atomic (indivisible) values
- Each row is unique
- No repeating groups or arrays

```sql
-- ❌ VIOLATION: Repeating groups
CREATE TABLE orders_bad (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  product_1 VARCHAR(100),
  product_2 VARCHAR(100),
  product_3 VARCHAR(100)
);

-- ✅ COMPLIANCE: Atomic values
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10, 2)
);
```

#### Second Normal Form (2NF)
**Requirements:**
- Must be in 1NF
- All non-key attributes fully dependent on entire primary key

```sql
-- ❌ VIOLATION: Partial dependency
CREATE TABLE order_items_bad (
  order_id INT,
  product_id INT,
  product_name VARCHAR(100),  -- Depends only on product_id
  quantity INT,
  PRIMARY KEY (order_id, product_id)
);

-- ✅ COMPLIANCE: Full dependency
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2)
);

CREATE TABLE order_items (
  order_id INT,
  product_id INT,
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### Third Normal Form (3NF)
**Requirements:**
- Must be in 2NF
- No transitive dependencies (non-key column shouldn't depend on other non-key columns)

```sql
-- ❌ VIOLATION: Transitive dependency
CREATE TABLE customers_bad (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  city VARCHAR(50),
  city_population INT  -- Depends on city, not directly on id
);

-- ✅ COMPLIANCE: No transitive dependencies
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  population INT
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  city_id INT REFERENCES cities(id)
);
```

### When to Denormalize

#### Read-Heavy Applications
```sql
-- Normalized (many joins)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  order_date TIMESTAMP
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

-- Denormalized (pre-calculated)
CREATE TABLE order_summary (
  id SERIAL PRIMARY KEY,
  customer_id INT,
  customer_name VARCHAR(100),  -- Duplicated from customers table
  total_orders INT,
  total_spent DECIMAL(10, 2)
);
```

#### Performance Optimization
```sql
-- Pre-calculate expensive aggregations
CREATE TABLE product_stats (
  id SERIAL PRIMARY KEY,
  product_id INT,
  avg_rating DECIMAL(3, 2),
  review_count INT,
  last_reviewed TIMESTAMP
);
```

#### Data Warehouse Pattern
```sql
-- Star schema (denormalized for analytics)
CREATE TABLE sales_fact (
  id SERIAL PRIMARY KEY,
  date_id INT,
  product_id INT,
  customer_id INT,
  store_id INT,
  quantity INT,
  amount DECIMAL(10, 2)
);

-- Dimension tables (normalized)
CREATE TABLE dim_date (
  date_id INT PRIMARY KEY,
  year INT,
  quarter INT,
  month INT,
  day INT,
  weekday VARCHAR(10)
);
```

## Entity Relationship Design

### Entity Identification

#### Strong vs Weak Entities
```sql
-- Strong entity (has own key)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE
);

-- Weak entity (depends on owner)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  PRIMARY KEY (id, user_id)  -- Composite key with foreign key
);
```

#### Attributes Design

**Simple Attributes**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,  -- Simple
  last_name VARCHAR(50) NOT NULL    -- Simple
);
```

**Composite Attributes**
```sql
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  street_number INT,
  street_name VARCHAR(100),
  city VARCHAR(50),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  country VARCHAR(50)
);

-- Or use separate table for complex addresses
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type VARCHAR(20) CHECK (type IN ('billing', 'shipping')),
  line1 VARCHAR(100) NOT NULL,
  line2 VARCHAR(100),
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(2) NOT NULL  -- ISO country code
);
```

**Multi-valued Attributes**
```sql
-- Bad: Comma-separated values
CREATE TABLE users_bad (
  id SERIAL PRIMARY KEY,
  skills VARCHAR(500)  -- "javascript,python,sql"
);

-- Good: Separate table
CREATE TABLE user_skills (
  user_id INT REFERENCES users(id),
  skill VARCHAR(50),
  PRIMARY KEY (user_id, skill)
);
```

**Derived Attributes**
```sql
-- Store derived data for performance
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  shipping DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) GENERATED ALWAYS AS (subtotal + tax + shipping) STORED
);

-- Or compute on-the-fly
CREATE VIEW orders_total AS
SELECT
  id,
  subtotal,
  tax,
  shipping,
  (subtotal + tax + shipping) AS total
FROM orders;
```

### Relationship Design

#### One-to-One (1:1)
```sql
-- Users and user profiles
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  bio TEXT,
  avatar_url VARCHAR(255)
);
```

#### One-to-Many (1:N)
```sql
-- Users and orders
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10, 2)
);
```

#### Many-to-Many (M:N)
```sql
-- Students and courses
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  credits INT
);

-- Junction table
CREATE TABLE enrollments (
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_date DATE DEFAULT CURRENT_DATE,
  grade DECIMAL(3, 2),
  PRIMARY KEY (student_id, course_id)
);
```

#### Recursive Relationships
```sql
-- Employee hierarchy
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  manager_id INT REFERENCES employees(id) ON DELETE SET NULL,
  hire_date DATE NOT NULL
);

-- Query all subordinates
WITH RECURSIVE subordinates AS (
  -- Base case: direct reports
  SELECT id, name, manager_id, 1 AS level
  FROM employees
  WHERE manager_id = $1

  UNION ALL

  -- Recursive case: indirect reports
  SELECT e.id, e.name, e.manager_id, s.level + 1
  FROM employees e
  JOIN subordinates s ON e.manager_id = s.id
)
SELECT * FROM subordinates;
```

## Key Design Patterns

### 1. Supertype/Subtype (Inheritance)

#### Single Table (Discriminator)
```sql
-- All entities in one table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('invoice', 'contract', 'report')),
  -- Common attributes
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Invoice-specific
  invoice_number VARCHAR(50),
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2),
  -- Contract-specific
  contract_value DECIMAL(10, 2),
  start_date DATE,
  end_date DATE,
  -- Report-specific
  report_period_start DATE,
  report_period_end DATE
);

-- Query specific type
SELECT * FROM documents
WHERE type = 'invoice' AND total > 1000;
```

#### Separate Tables (Class Table)
```sql
-- Base table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subtype tables
CREATE TABLE invoices (
  id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2)
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  contract_value DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

-- Query all documents with type
SELECT d.*,
  CASE
    WHEN i.id IS NOT NULL THEN 'invoice'
    WHEN c.id IS NOT NULL THEN 'contract'
  END AS type
FROM documents d
LEFT JOIN invoices i ON d.id = i.id
LEFT JOIN contracts c ON d.id = c.id;
```

### 2. Audit Trail Pattern
```sql
-- Track changes automatically
CREATE TABLE customers_audit (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(100),
  old_values JSONB,
  new_values JSONB
);

-- Trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO customers_audit (customer_id, operation, old_values)
    VALUES (OLD.id, TG_OP, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO customers_audit (customer_id, operation, old_values, new_values)
    VALUES (OLD.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO customers_audit (customer_id, operation, new_values)
    VALUES (NEW.id, TG_OP, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER customers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### 3. Soft Delete Pattern
```sql
-- Mark as deleted instead of removing
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  deleted_by VARCHAR(100),
  CONSTRAINT valid_delete_time CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

-- Application-level filter
CREATE OR REPLACE VIEW active_orders AS
SELECT * FROM orders
WHERE deleted_at IS NULL;

-- Alternatively, use table partitioning
CREATE TABLE orders_active (
  LIKE orders INCLUDING ALL
) INHERITS (orders);

-- Move deleted rows to archive table
INSERT INTO orders_archive SELECT * FROM orders WHERE deleted_at IS NOT NULL;
DELETE FROM orders_active WHERE deleted_at IS NOT NULL;
```

### 4. Metadata Pattern
```sql
-- Flexible schema for dynamic attributes
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category_id INT
);

CREATE TABLE product_attributes (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  attribute_name VARCHAR(50) NOT NULL,
  attribute_value TEXT NOT NULL,
  data_type VARCHAR(20) CHECK (data_type IN ('text', 'number', 'boolean', 'date')),
  UNIQUE (product_id, attribute_name)
);

-- Query example
SELECT p.name, pa.attribute_name, pa.attribute_value
FROM products p
JOIN product_attributes pa ON p.id = pa.product_id
WHERE p.id = 123;

-- Pivot to JSON
SELECT p.id, p.name,
  jsonb_object_agg(pa.attribute_name, pa.attribute_value) AS attributes
FROM products p
JOIN product_attributes pa ON p.id = pa.product_id
GROUP BY p.id, p.name;
```

### 5. Hierarchy Pattern (Adjacency List vs Nested Set)

#### Adjacency List (Simple, Flexible)
```sql
-- Easy to modify
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL
);

-- Query children (easy)
SELECT * FROM categories WHERE parent_id = 5;

-- Query full tree (requires recursion)
WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, name AS path, 0 AS level
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  SELECT c.id, c.name, c.parent_id,
    ct.path || ' > ' || c.name, ct.level + 1
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY path;
```

#### Nested Set (Fast Reads, Complex Writes)
```sql
-- Efficient for reads
CREATE TABLE categories_nested (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  left_index INT NOT NULL,
  right_index INT NOT NULL
);

-- Query all descendants (very fast)
SELECT * FROM categories_nested
WHERE left_index > (SELECT left_index FROM categories_nested WHERE id = 5)
  AND right_index < (SELECT right_index FROM categories_nested WHERE id = 5);
```

## Data Types Selection

### Numeric Types
```sql
-- Small integers
SMALLINT   -- -32,768 to 32,767
INT        -- -2,147,483,648 to 2,147,483,647
BIGINT     -- -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807

-- Decimal for precise values
DECIMAL(10, 2)  -- 99999999.99
NUMERIC(10, 2)  -- Same as DECIMAL

-- When to use which
CREATE TABLE products (
  id SERIAL PRIMARY KEY,      -- Auto-incrementing ID
  inventory_count INT,        -- Integer count
  price DECIMAL(10, 2),       -- Money (precise)
  weight_kg DECIMAL(8, 3),    -- Weight (precise)
  rating REAL                 -- Rating (approximate)
);
```

### String Types
```sql
-- Fixed length
CHAR(10)     -- Always 10 bytes (padded)

-- Variable length
VARCHAR(50)  -- Up to 50 characters
TEXT         -- Unlimited length
```

**Choose VARCHAR for:**
- User input fields (emails, names)
- Variable-length identifiers
- Searchable text

**Choose TEXT for:**
- Long content (descriptions, comments)
- When no known maximum length

### Date/Time Types
```sql
-- Date only
DATE              -- 2025-11-02

-- Time only
TIME              -- 14:30:00

-- Date and time (no timezone)
TIMESTAMP         -- 2025-11-02 14:30:00

-- Date and time (with timezone)
TIMESTAMPTZ       -- 2025-11-02 14:30:00-05

-- Time interval
INTERVAL          -- 5 days, 3 hours
```

**Examples:**
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,          -- Just the date
  start_time TIME NOT NULL,          -- Just the time
  start_timestamp TIMESTAMPTZ NOT NULL,  -- Date and time with timezone
  duration INTERVAL,                 -- 2 hours, 30 minutes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### JSON/JSONB (PostgreSQL)
```sql
-- Store JSON documents
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB
);

-- Index JSON fields
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Query JSON fields
SELECT id, name, preferences->'theme' AS theme
FROM users
WHERE preferences->>'notifications' = 'enabled';

-- Update JSON field
UPDATE users
SET preferences = preferences || '{"theme": "dark"}'::jsonb
WHERE id = 1;
```

### Arrays
```sql
-- PostgreSQL arrays
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone_numbers TEXT[]  -- Array of text
);

-- Query arrays
SELECT * FROM users
WHERE '555-1234' = ANY(phone_numbers);

-- Add to array
UPDATE users
SET phone_numbers = array_append(phone_numbers, '555-5678')
WHERE id = 1;
```

## Constraints Strategy

### Check Constraints
```sql
-- Business rule enforcement
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100),
  CONSTRAINT reasonable_price CHECK (price < 10000)
);

-- Complex validation
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_date DATE NOT NULL,
  ship_date DATE,
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  CONSTRAINT valid_dates CHECK (ship_date IS NULL OR ship_date >= order_date),
  CONSTRAINT valid_shipped CHECK (
    (status IN ('shipped', 'delivered') AND ship_date IS NOT NULL) OR
    (status NOT IN ('shipped', 'delivered'))
  )
);
```

### Exclusion Constraints (PostgreSQL)
```sql
-- Prevent overlapping time ranges
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  EXCLUDE USING GIST (
    room_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);
```

### Foreign Key Constraints

**Cascading Options**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE      -- Delete orders when customer deleted
    ON UPDATE CASCADE      -- Update ID in orders when customer ID changes
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE      -- Delete items when order deleted
);

-- Alternatively
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id)
    ON DELETE SET NULL    -- Set NULL when user deleted
    ON UPDATE CASCADE
);
```

## Naming Conventions

### Tables
```sql
-- Plural form, snake_case
CREATE TABLE users;
CREATE TABLE user_orders;       -- NOT userorders
CREATE TABLE order_items;       -- NOT order_item
```

### Columns
```sql
-- snake_case
user_id
first_name
created_at
updated_at
email_address  -- NOT emailaddress
```

### Indexes
```sql
-- idx_table_column(s)
idx_users_email
idx_orders_user_id_created_at
```

### Constraints
```sql
-- pk_table for primary key
pk_users
pk_orders_order_items

-- fk_table_column for foreign key
fk_orders_customer_id
fk_order_items_order_id

-- unique_table_column for unique
unique_users_email

-- check_table_description
check_products_positive_price
```

### Foreign Key References
```sql
-- Reference naming convention
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_orders_customer_id
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE
);
```

## Performance Considerations

### Primary Key Selection

**Auto-incrementing (SERIAL)**
```sql
-- Pros: Simple, small, efficient
-- Cons: Not globally unique, reveals insert order
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  ...
);
```

**UUID**
```sql
-- Pros: Globally unique, can generate anywhere
-- Cons: Larger, not sequential (index bloat)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

**Natural Keys**
```sql
-- Use when truly unique and meaningful
CREATE TABLE countries (
  iso_code CHAR(2) PRIMARY KEY,  -- ISO 3166-1 alpha-2
  name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  sku VARCHAR(50) PRIMARY KEY,  -- Stock Keeping Unit
  ...
);
```

### Surrogate vs Natural Keys

**Surrogate Keys (Recommended)**
```sql
-- Use when:
-- - Natural key is complex (multiple columns)
-- - Natural key may change
-- - Natural key is not guaranteed stable

CREATE TABLE users (
  id SERIAL PRIMARY KEY,        -- Surrogate key
  email VARCHAR(100) NOT NULL UNIQUE,
  ssn VARCHAR(11) UNIQUE         -- Natural unique identifier
);
```

**Natural Keys (When Appropriate)**
```sql
-- Use when:
-- - Simple, stable, universally unique
-- - Never changes
-- - Meaningful to business

CREATE TABLE currency_codes (
  code CHAR(3) PRIMARY KEY,  -- USD, EUR, GBP
  name VARCHAR(50) NOT NULL
);
```

### Redundant Data Strategy

**Denormalize for Performance**
```sql
-- Duplicate to avoid joins
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  customer_name VARCHAR(100),  -- Duplicated from customers table
  customer_email VARCHAR(100), -- Duplicated from customers table
  ...
);

-- Use views to maintain single source of truth
CREATE VIEW orders_with_customer AS
SELECT o.*, c.name AS customer_name, c.email AS customer_email
FROM orders o
JOIN customers c ON o.customer_id = c.id;
```

---

**Estado**: Database schema design patterns documentados
**Coverage**: Normalization, ER design, patterns, data types, constraints
**Best Practices**: Naming conventions, performance considerations
