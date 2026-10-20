import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/motolarry',
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

export async function initSchema() {
  console.log('Initializing self-healing database schema and RLS policies...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Enable pgcrypto extension for UUID generation if needed
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Helper function for business_id from user
    await client.query(`
      CREATE OR REPLACE FUNCTION get_user_business_id()
      RETURNS uuid AS $$
        SELECT business_id FROM members WHERE user_id = auth.uid() LIMIT 1;
      $$ LANGUAGE sql SECURITY DEFINER;
    `);

    // 1. Businesses
    await client.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        owner_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        user_id UUID,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL
      );
    `);

    // 4. Brands
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL
      );
    `);

    // 5. Units
    await client.query(`
      CREATE TABLE IF NOT EXISTS units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(50)
      );
    `);

    // 6. Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        category_id UUID,
        brand_id UUID,
        unit_id UUID,
        cost_price NUMERIC(12,2) DEFAULT 0,
        sale_price NUMERIC(12,2) DEFAULT 0,
        stock INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 3,
        image_url TEXT,
        aliases TEXT,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        credit_balance NUMERIC(12,2) DEFAULT 0
      );
    `);

    // 8. Suppliers
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT
      );
    `);

    // 9. Sales
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        receipt_no VARCHAR(100) NOT NULL,
        customer_id UUID,
        member_id UUID,
        total NUMERIC(12,2) NOT NULL DEFAULT 0,
        discount NUMERIC(12,2) DEFAULT 0,
        tax NUMERIC(12,2) DEFAULT 0,
        payment_method VARCHAR(100),
        amount_paid NUMERIC(12,2) DEFAULT 0,
        change_given NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Sale Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id UUID NOT NULL,
        product_id UUID,
        qty INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
        total NUMERIC(12,2) NOT NULL DEFAULT 0,
        profit NUMERIC(12,2) DEFAULT 0
      );
    `);

    // 11. Stock Movements
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        product_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'sale', 'restock', 'adjustment', 'return'
        qty INTEGER NOT NULL,
        reference_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 12. Expenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        category VARCHAR(100),
        date TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 13. Restocks
    await client.query(`
      CREATE TABLE IF NOT EXISTS restocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        supplier_id UUID,
        reference VARCHAR(100),
        total_cost NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'received',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 14. Restock Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS restock_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restock_id UUID NOT NULL,
        product_id UUID NOT NULL,
        qty INTEGER NOT NULL,
        unit_cost NUMERIC(12,2) NOT NULL
      );
    `);

    // 15. Discounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS discounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'percentage' | 'fixed'
        value NUMERIC(12,2) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    // 16. Payment Methods
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    // 17. Tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        due_date TIMESTAMPTZ,
        status VARCHAR(50) DEFAULT 'pending'
      );
    `);

    // 18. Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        key VARCHAR(100) NOT NULL,
        value TEXT,
        UNIQUE(business_id, key)
      );
    `);

    // 19. Sync Queue
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id UUID NOT NULL,
        operation VARCHAR(50) NOT NULL,
        payload JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 20. Tier B / Unmetered Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS tier_b_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(12,2) DEFAULT 0,
        notes TEXT,
        graduated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Product Category / Brand mapping tables if needed, or multi-category / multi-brand junctions
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        product_id UUID NOT NULL,
        category_id UUID NOT NULL,
        PRIMARY KEY (product_id, category_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_brands (
        product_id UUID NOT NULL,
        brand_id UUID NOT NULL,
        PRIMARY KEY (product_id, brand_id)
      );
    `);

    // Product Attributes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        values TEXT[] -- e.g. ['Red', 'Blue', 'XL']
      );
    `);

    // Enable Row Level Security on all tenant tables
    const tenantTables = [
      'businesses', 'members', 'products', 'categories', 'brands', 'units',
      'sales', 'stock_movements', 'expenses', 'restocks', 'customers',
      'suppliers', 'discounts', 'payment_methods', 'tasks', 'settings',
      'sync_queue', 'tier_b_products', 'product_attributes'
    ];

    for (const table of tenantTables) {
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

      // Drop policy if exists then recreate
      await client.query(`DROP POLICY IF EXISTS "tenant_${table}" ON ${table};`);

      if (table === 'businesses') {
        await client.query(`
          CREATE POLICY "tenant_businesses" ON businesses
          FOR ALL USING (
            id IN (SELECT business_id FROM members WHERE user_id = auth.uid())
          ) WITH CHECK (
            id IN (SELECT business_id FROM members WHERE user_id = auth.uid())
          );
        `);
      } else {
        await client.query(`
          CREATE POLICY "tenant_${table}" ON ${table}
          FOR ALL USING (business_id = get_user_business_id())
          WITH CHECK (business_id = get_user_business_id());
        `);
      }
    }

    await client.query('COMMIT');
    console.log('Database schema initialization completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database schema initialization failed:', err);
  } finally {
    client.release();
  }
}
