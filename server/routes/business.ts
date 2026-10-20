import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ---------------- PRODUCTS ----------------
router.get('/products/search', async (req: AuthRequest, res) => {
  const { q } = req.query;
  const businessId = req.user?.businessId;
  const searchStr = `%${q || ''}%`;

  try {
    const result = await query(
      `SELECT p.*, c.name as category_name, b.name as brand_name, u.name as unit_name,
              COALESCE(sales_count.total_qty_sold, 0) as total_sold
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN units u ON p.unit_id = u.id
       LEFT JOIN (
         SELECT product_id, SUM(qty) as total_qty_sold
         FROM sale_items
         GROUP BY product_id
       ) sales_count ON sales_count.product_id = p.id
       WHERE p.business_id = $1 AND p.active = true
         AND (p.name ILIKE $2 OR p.sku ILIKE $2 OR p.aliases ILIKE $2 OR p.description ILIKE $2)
       ORDER BY total_sold DESC, p.name ASC
       LIMIT 50`,
      [businessId, searchStr]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  try {
    const result = await query(
      `SELECT p.*, c.name as category_name, b.name as brand_name, u.name as unit_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE p.business_id = $1
       ORDER BY p.name ASC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const {
    name, sku, category_id, brand_id, unit_id, cost_price, sale_price,
    stock, low_stock_threshold, image_url, aliases, description, active
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO products
       (business_id, name, sku, category_id, brand_id, unit_id, cost_price, sale_price, stock, low_stock_threshold, image_url, aliases, description, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        businessId, name, sku || null, category_id || null, brand_id || null, unit_id || null,
        cost_price || 0, sale_price || 0, stock || 0, low_stock_threshold ?? 3,
        image_url || null, aliases || null, description || null, active ?? true
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { id } = req.params;
  const {
    name, sku, category_id, brand_id, unit_id, cost_price, sale_price,
    stock, low_stock_threshold, image_url, aliases, description, active
  } = req.body;

  try {
    const result = await query(
      `UPDATE products SET
         name = COALESCE($1, name),
         sku = $2,
         category_id = $3,
         brand_id = $4,
         unit_id = $5,
         cost_price = COALESCE($6, cost_price),
         sale_price = COALESCE($7, sale_price),
         stock = COALESCE($8, stock),
         low_stock_threshold = COALESCE($9, low_stock_threshold),
         image_url = $10,
         aliases = $11,
         description = $12,
         active = COALESCE($13, active),
         updated_at = NOW()
       WHERE id = $14 AND business_id = $15
       RETURNING *`,
      [
        name, sku, category_id, brand_id, unit_id, cost_price, sale_price,
        stock, low_stock_threshold, image_url, aliases, description, active,
        id, businessId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { id } = req.params;
  try {
    await query(`DELETE FROM products WHERE id = $1 AND business_id = $2`, [id, businessId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CATEGORIES, BRANDS, UNITS ----------------
router.get('/categories', async (req: AuthRequest, res) => {
  try {
    const resCat = await query(`SELECT * FROM categories WHERE business_id = $1 ORDER BY name ASC`, [req.user?.businessId]);
    res.json(resCat.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/categories', async (req: AuthRequest, res) => {
  try {
    const resCat = await query(
      `INSERT INTO categories (business_id, name) VALUES ($1, $2) RETURNING *`,
      [req.user?.businessId, req.body.name]
    );
    res.json(resCat.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const resCat = await query(
      `UPDATE categories SET name = $1 WHERE id = $2 AND business_id = $3 RETURNING *`,
      [req.body.name, req.params.id, req.user?.businessId]
    );
    res.json(resCat.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/categories/:id', async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM categories WHERE id = $1 AND business_id = $2`, [req.params.id, req.user?.businessId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/brands', async (req: AuthRequest, res) => {
  try {
    const resB = await query(`SELECT * FROM brands WHERE business_id = $1 ORDER BY name ASC`, [req.user?.businessId]);
    res.json(resB.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/brands', async (req: AuthRequest, res) => {
  try {
    const resB = await query(
      `INSERT INTO brands (business_id, name) VALUES ($1, $2) RETURNING *`,
      [req.user?.businessId, req.body.name]
    );
    res.json(resB.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/units', async (req: AuthRequest, res) => {
  try {
    const resU = await query(`SELECT * FROM units WHERE business_id = $1 ORDER BY name ASC`, [req.user?.businessId]);
    res.json(resU.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/units', async (req: AuthRequest, res) => {
  try {
    const resU = await query(
      `INSERT INTO units (business_id, name, short_name) VALUES ($1, $2, $3) RETURNING *`,
      [req.user?.businessId, req.body.name, req.body.short_name]
    );
    res.json(resU.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Category/Brand product assignments
router.post('/categories/:id/products', async (req: AuthRequest, res) => {
  const { product_id, assigned } = req.body;
  try {
    if (assigned) {
      await query(`UPDATE products SET category_id = $1 WHERE id = $2 AND business_id = $3`, [req.params.id, product_id, req.user?.businessId]);
    } else {
      await query(`UPDATE products SET category_id = NULL WHERE id = $2 AND business_id = $3 AND category_id = $1`, [req.params.id, product_id, req.user?.businessId]);
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------------- SALES & POS ----------------
router.post('/sales', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const memberId = req.user?.id;
  const { customer_id, items, total, discount, tax, payment_method, amount_paid, change_given } = req.body;

  try {
    await query('BEGIN');

    const receiptNo = `REC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const saleRes = await query(
      `INSERT INTO sales (business_id, receipt_no, customer_id, member_id, total, discount, tax, payment_method, amount_paid, change_given, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed')
       RETURNING *`,
      [businessId, receiptNo, customer_id || null, memberId, total, discount || 0, tax || 0, payment_method, amount_paid || total, change_given || 0]
    );
    const sale = saleRes.rows[0];

    for (const item of items) {
      // Get current cost price
      const pRes = await query(`SELECT cost_price, stock FROM products WHERE id = $1 AND business_id = $2`, [item.product_id, businessId]);
      const costPrice = pRes.rows[0]?.cost_price || 0;
      const profit = (item.unit_price - costPrice) * item.qty;

      await query(
        `INSERT INTO sale_items (sale_id, product_id, qty, unit_price, total, profit)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sale.id, item.product_id, item.qty, item.unit_price, item.qty * item.unit_price, profit]
      );

      // Deduct stock
      await query(
        `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`,
        [item.qty, item.product_id, businessId]
      );

      // Record stock movement
      await query(
        `INSERT INTO stock_movements (business_id, product_id, type, qty, reference_id)
         VALUES ($1, $2, 'sale', -$3, $4)`,
        [businessId, item.product_id, item.qty, sale.id]
      );
    }

    await query('COMMIT');
    res.json(sale);
  } catch (err: any) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { start, end, payment, sold_by } = req.query;

  let sql = `
    SELECT s.*, c.name as customer_name, m.name as member_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN members m ON s.member_id = m.id
    WHERE s.business_id = $1
  `;
  const params: any[] = [businessId];

  if (start) {
    params.push(start);
    sql += ` AND s.created_at >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    sql += ` AND s.created_at <= $${params.length}`;
  }
  if (payment) {
    params.push(payment);
    sql += ` AND s.payment_method = $${params.length}`;
  }
  if (sold_by) {
    params.push(sold_by);
    sql += ` AND s.member_id = $${params.length}`;
  }

  sql += ` ORDER BY s.created_at DESC`;

  try {
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales/:id', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { id } = req.params;

  try {
    const saleRes = await query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone, m.name as member_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN members m ON s.member_id = m.id
       WHERE s.id = $1 AND s.business_id = $2`,
      [id, businessId]
    );

    if (saleRes.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });

    const itemsRes = await query(
      `SELECT si.*, p.name as product_name, p.sku
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({
      ...saleRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Return/Refund flow
router.post('/sales/:id/return', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { id } = req.params;
  const { items } = req.body; // [{ product_id, qty }]

  try {
    await query('BEGIN');

    for (const item of items) {
      // Restore stock
      await query(
        `UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`,
        [item.qty, item.product_id, businessId]
      );

      // Stock movement
      await query(
        `INSERT INTO stock_movements (business_id, product_id, type, qty, reference_id)
         VALUES ($1, $2, 'return', $3, $4)`,
        [businessId, item.product_id, item.qty, id]
      );
    }

    await query(
      `UPDATE sales SET status = 'returned' WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    await query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ---------------- RESTOCKS & SUPPLIERS ----------------
router.get('/restocks', async (req: AuthRequest, res) => {
  try {
    const resR = await query(
      `SELECT r.*, s.name as supplier_name
       FROM restocks r
       LEFT JOIN suppliers s ON r.supplier_id = s.id
       WHERE r.business_id = $1 ORDER BY r.created_at DESC`,
      [req.user?.businessId]
    );
    res.json(resR.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/restocks', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { supplier_id, reference, items } = req.body; // items: [{ product_id, qty, unit_cost }]

  try {
    await query('BEGIN');

    const totalCost = items.reduce((acc: number, cur: any) => acc + (cur.qty * cur.unit_cost), 0);

    const rRes = await query(
      `INSERT INTO restocks (business_id, supplier_id, reference, total_cost, status)
       VALUES ($1, $2, $3, $4, 'received') RETURNING *`,
      [businessId, supplier_id || null, reference || `PO-${Date.now().toString().slice(-6)}`, totalCost]
    );
    const restock = rRes.rows[0];

    for (const item of items) {
      await query(
        `INSERT INTO restock_items (restock_id, product_id, qty, unit_cost)
         VALUES ($1, $2, $3, $4)`,
        [restock.id, item.product_id, item.qty, item.unit_cost]
      );

      // Update stock & cost price on product
      await query(
        `UPDATE products
         SET stock = stock + $1, cost_price = $2, updated_at = NOW()
         WHERE id = $3 AND business_id = $4`,
        [item.qty, item.unit_cost, item.product_id, businessId]
      );

      // Stock movement
      await query(
        `INSERT INTO stock_movements (business_id, product_id, type, qty, reference_id)
         VALUES ($1, $2, 'restock', $3, $4)`,
        [businessId, item.product_id, item.qty, restock.id]
      );
    }

    await query('COMMIT');
    res.json(restock);
  } catch (err: any) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ---------------- EXPENSES ----------------
router.get('/expenses', async (req: AuthRequest, res) => {
  try {
    const resE = await query(`SELECT * FROM expenses WHERE business_id = $1 ORDER BY date DESC`, [req.user?.businessId]);
    res.json(resE.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/expenses', async (req: AuthRequest, res) => {
  const { title, amount, category, date } = req.body;
  try {
    const resE = await query(
      `INSERT INTO expenses (business_id, title, amount, category, date)
       VALUES ($1, $2, $3, $4, COALESCE($5, NOW())) RETURNING *`,
      [req.user?.businessId, title, amount, category || 'General', date || null]
    );
    res.json(resE.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/expenses/:id', async (req: AuthRequest, res) => {
  const { title, amount, category, date } = req.body;
  try {
    const resE = await query(
      `UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4
       WHERE id = $5 AND business_id = $6 RETURNING *`,
      [title, amount, category, date, req.params.id, req.user?.businessId]
    );
    res.json(resE.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/expenses/:id', async (req: AuthRequest, res) => {
  try {
    await query(`DELETE FROM expenses WHERE id = $1 AND business_id = $2`, [req.params.id, req.user?.businessId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------------- CUSTOMERS & SUPPLIERS ----------------
router.get('/customers', async (req: AuthRequest, res) => {
  try {
    const resC = await query(`SELECT * FROM customers WHERE business_id = $1 ORDER BY name ASC`, [req.user?.businessId]);
    res.json(resC.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/customers', async (req: AuthRequest, res) => {
  const { name, phone, email, address, credit_balance } = req.body;
  try {
    const resC = await query(
      `INSERT INTO customers (business_id, name, phone, email, address, credit_balance)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user?.businessId, name, phone, email, address, credit_balance || 0]
    );
    res.json(resC.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/customers/:id/purchases', async (req: AuthRequest, res) => {
  try {
    const resP = await query(
      `SELECT s.*, json_agg(si.*) as items
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       WHERE s.customer_id = $1 AND s.business_id = $2
       GROUP BY s.id ORDER BY s.created_at DESC`,
      [req.params.id, req.user?.businessId]
    );
    res.json(resP.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/suppliers', async (req: AuthRequest, res) => {
  try {
    const resS = await query(`SELECT * FROM suppliers WHERE business_id = $1 ORDER BY name ASC`, [req.user?.businessId]);
    res.json(resS.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/suppliers', async (req: AuthRequest, res) => {
  const { name, phone, email, address } = req.body;
  try {
    const resS = await query(
      `INSERT INTO suppliers (business_id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user?.businessId, name, phone, email, address]
    );
    res.json(resS.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------------- DISCOUNTS & PAYMENT METHODS ----------------
router.get('/discounts', async (req: AuthRequest, res) => {
  try {
    const resD = await query(`SELECT * FROM discounts WHERE business_id = $1`, [req.user?.businessId]);
    res.json(resD.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/discounts', async (req: AuthRequest, res) => {
  const { name, type, value, active } = req.body;
  try {
    const resD = await query(
      `INSERT INTO discounts (business_id, name, type, value, active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user?.businessId, name, type, value, active ?? true]
    );
    res.json(resD.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/payment-methods', async (req: AuthRequest, res) => {
  try {
    const resP = await query(`SELECT * FROM payment_methods WHERE business_id = $1`, [req.user?.businessId]);
    res.json(resP.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/payment-methods', async (req: AuthRequest, res) => {
  const { name, active } = req.body;
  try {
    const resP = await query(
      `INSERT INTO payment_methods (business_id, name, active)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user?.businessId, name, active ?? true]
    );
    res.json(resP.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------------- MEMBERS ----------------
router.get('/members', async (req: AuthRequest, res) => {
  try {
    const resM = await query(
      `SELECT id, email, name, role, status, created_at FROM members WHERE business_id = $1 ORDER BY created_at DESC`,
      [req.user?.businessId]
    );
    res.json(resM.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/members', async (req: AuthRequest, res) => {
  const { email, name, role, password } = req.body;
  const bcrypt = require('bcryptjs');
  const pwd = password || 'Password123!';
  const hash = await bcrypt.hash(pwd, 10);

  try {
    const resM = await query(
      `INSERT INTO members (business_id, email, name, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id, email, name, role, status`,
      [req.user?.businessId, email, name, hash, role || 'staff']
    );
    res.json(resM.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/members/:id', async (req: AuthRequest, res) => {
  const { status, role } = req.body;
  try {
    const resM = await query(
      `UPDATE members SET status = COALESCE($1, status), role = COALESCE($2, role)
       WHERE id = $3 AND business_id = $4 RETURNING id, email, name, role, status`,
      [status, role, req.params.id, req.user?.businessId]
    );
    res.json(resM.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------------- SETTINGS ----------------
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    const resS = await query(`SELECT key, value FROM settings WHERE business_id = $1`, [req.user?.businessId]);
    const settingsMap: Record<string, string> = {};
    for (const r of resS.rows) {
      settingsMap[r.key] = r.value;
    }
    res.json(settingsMap);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/settings', async (req: AuthRequest, res) => {
  const settings = req.body; // { key: value }
  try {
    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO settings (business_id, key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (business_id, key) DO UPDATE SET value = EXCLUDED.value`,
        [req.user?.businessId, key, String(value)]
      );
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ---------------- TIER B PRODUCTS ----------------
router.get('/tier-b-products', async (req: AuthRequest, res) => {
  try {
    const resTB = await query(`SELECT * FROM tier_b_products WHERE business_id = $1 ORDER BY name ASC`, [req.user?.businessId]);
    res.json(resTB.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/tier-b-products', async (req: AuthRequest, res) => {
  const { name, price, notes } = req.body;
  try {
    const resTB = await query(
      `INSERT INTO tier_b_products (business_id, name, price, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user?.businessId, name, price || 0, notes || null]
    );
    res.json(resTB.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/tier-b-products/:id/graduate', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  const { name, sku, cost_price, sale_price, stock, category_id } = req.body;

  try {
    await query('BEGIN');

    // Create regular product
    const pRes = await query(
      `INSERT INTO products (business_id, name, sku, cost_price, sale_price, stock, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [businessId, name, sku, cost_price || 0, sale_price || 0, stock || 0, category_id || null]
    );

    // Mark tier b product as graduated
    await query(
      `UPDATE tier_b_products SET graduated = true WHERE id = $1 AND business_id = $2`,
      [req.params.id, businessId]
    );

    await query('COMMIT');
    res.json(pRes.rows[0]);
  } catch (err: any) {
    await query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DASHBOARD METRICS ----------------
router.get('/dashboard', async (req: AuthRequest, res) => {
  const businessId = req.user?.businessId;
  try {
    // Total Sales
    const salesToday = await query(
      `SELECT COALESCE(SUM(total), 0) as total, COUNT(id) as count
       FROM sales WHERE business_id = $1 AND status = 'completed' AND created_at >= CURRENT_DATE`,
      [businessId]
    );
    const salesWeek = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '7 days'`,
      [businessId]
    );
    const salesMonth = await query(
      `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'`,
      [businessId]
    );

    // Total Expenses
    const expensesRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1`,
      [businessId]
    );

    // Grand Profit
    const profitRes = await query(
      `SELECT COALESCE(SUM(si.profit), 0) as total_profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.business_id = $1 AND s.status = 'completed'`,
      [businessId]
    );

    // Purchases (restocks)
    const restocksRes = await query(
      `SELECT COALESCE(SUM(total_cost), 0) as total FROM restocks WHERE business_id = $1`,
      [businessId]
    );

    // Stock value
    const stockValRes = await query(
      `SELECT SUM(CASE WHEN cost_price > 0 THEN cost_price * stock ELSE sale_price * stock END) as total_value
       FROM products WHERE business_id = $1`,
      [businessId]
    );

    // Sales Overview Graph (last 7 days)
    const salesGraphRes = await query(
      `SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as total_sales
       FROM sales
       WHERE business_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [businessId]
    );

    // Low stock alert (arranged 0 first, top 10)
    const lowStockRes = await query(
      `SELECT id, name, stock, low_stock_threshold
       FROM products
       WHERE business_id = $1 AND active = true AND stock <= low_stock_threshold
       ORDER BY stock ASC, name ASC
       LIMIT 10`,
      [businessId]
    );

    res.json({
      sales: {
        today: Number(salesToday.rows[0]?.total || 0),
        todayCount: Number(salesToday.rows[0]?.count || 0),
        week: Number(salesWeek.rows[0]?.total || 0),
        month: Number(salesMonth.rows[0]?.total || 0),
      },
      expenses: Number(expensesRes.rows[0]?.total || 0),
      grandProfit: Number(profitRes.rows[0]?.total_profit || 0) - Number(expensesRes.rows[0]?.total || 0),
      orderCount: Number(salesToday.rows[0]?.count || 0),
      purchases: Number(restocksRes.rows[0]?.total || 0),
      stockValue: Number(stockValRes.rows[0]?.total_value || 0),
      salesOverview: salesGraphRes.rows,
      lowStockAlerts: lowStockRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
