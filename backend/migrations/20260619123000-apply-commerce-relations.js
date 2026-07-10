exports.up = function (db) {
  return db.runSql(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('MANAGER', 'ADMIN', 'DELIVERY', 'CUSTOMER');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE promotion_type AS ENUM ('FIXED', 'PERCENT');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE payment_method AS ENUM ('CASH', 'ONLINE');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE delivery_type AS ENUM ('PICKUP', 'DELIVERY');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name VARCHAR(200),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'CUSTOMER',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

    UPDATE users
    SET name = TRIM(firstname || ' ' || lastname)
    WHERE name IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE email IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone) WHERE phone IS NOT NULL;

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    INSERT INTO categories (name)
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL
    ON CONFLICT (name) DO NOTHING;

    CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type promotion_type NOT NULL,
      value NUMERIC(10, 2) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );

    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS url TEXT,
      ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
      ADD COLUMN IF NOT EXISTS promotion_id BIGINT REFERENCES promotions(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

    UPDATE products p
    SET category_id = c.id
    FROM categories c
    WHERE p.category_id IS NULL AND p.category = c.name;

    CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (cart_id, product_id)
    );

    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'CASH',
      ADD COLUMN IF NOT EXISTS delivery_type delivery_type NOT NULL DEFAULT 'PICKUP',
      ADD COLUMN IF NOT EXISTS delivery_address TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

    ALTER TABLE orders
      ALTER COLUMN status TYPE order_status
      USING CASE
        WHEN status = 'active' THEN 'PENDING'::order_status
        WHEN status = 'complete' THEN 'DELIVERED'::order_status
        ELSE status::order_status
      END,
      ALTER COLUMN status SET DEFAULT 'PENDING';

    ALTER TABLE order_products
      ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0;
  `)
}

exports.down = function (db) {
  return db.runSql(`
    DROP TABLE IF EXISTS cart_items CASCADE;
    DROP TABLE IF EXISTS carts CASCADE;
    DROP TABLE IF EXISTS promotions CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP INDEX IF EXISTS users_email_unique;
    DROP INDEX IF EXISTS users_phone_unique;
  `)
}
