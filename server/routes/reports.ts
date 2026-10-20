import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/:type', async (req: AuthRequest, res) => {
  const { type } = req.params;
  const { start, end } = req.query;
  const businessId = req.user?.businessId;

  let dateClause = '';
  const params: any[] = [businessId];
  if (start) {
    params.push(start);
    dateClause += ` AND created_at >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    dateClause += ` AND created_at <= $${params.length}`;
  }

  try {
    switch (type) {
      case 'sales-summary': {
        const result = await query(
          `SELECT
             COALESCE(SUM(total), 0) as gross_sales,
             COALESCE(SUM(discount), 0) as total_discounts,
             COALESCE(SUM(tax), 0) as total_tax,
             COUNT(id) as total_orders
           FROM sales WHERE business_id = $1 AND status = 'completed' ${dateClause}`,
          params
        );
        const refundRes = await query(
          `SELECT COALESCE(SUM(total), 0) as total_refunds FROM sales WHERE business_id = $1 AND status = 'returned' ${dateClause}`,
          params
        );
        res.json({
          ...result.rows[0],
          total_refunds: refundRes.rows[0]?.total_refunds || 0,
          net_sales: Number(result.rows[0]?.gross_sales || 0) - Number(refundRes.rows[0]?.total_refunds || 0)
        });
        break;
      }

      case 'daily-sales': {
        const result = await query(
          `SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as total, COUNT(id) as orders
           FROM sales WHERE business_id = $1 AND status = 'completed' ${dateClause}
           GROUP BY DATE(created_at) ORDER BY date DESC`,
          params
        );
        res.json(result.rows);
        break;
      }

      case 'sales-all': {
        const result = await query(
          `SELECT s.*, c.name as customer_name, m.name as cashier
           FROM sales s
           LEFT JOIN customers c ON s.customer_id = c.id
           LEFT JOIN members m ON s.member_id = m.id
           WHERE s.business_id = $1 ${dateClause.replace(/created_at/g, 's.created_at')}
           ORDER BY s.created_at DESC`,
          params
        );
        res.json(result.rows);
        break;
      }

      case 'sales-by-product': {
        const result = await query(
          `SELECT p.name as product_name, p.sku, SUM(si.qty) as qty_sold, SUM(si.total) as total_revenue, SUM(si.profit) as total_profit
           FROM sale_items si
           JOIN sales s ON si.sale_id = s.id
           JOIN products p ON si.product_id = p.id
           WHERE s.business_id = $1 AND s.status = 'completed' ${dateClause.replace(/created_at/g, 's.created_at')}
           GROUP BY p.id, p.name, p.sku ORDER BY qty_sold DESC`,
          params
        );
        res.json(result.rows);
        break;
      }

      case 'sales-by-category': {
        const result = await query(
          `SELECT COALESCE(c.name, 'Uncategorized') as category_name, SUM(si.qty) as qty_sold, SUM(si.total) as total_revenue
           FROM sale_items si
           JOIN sales s ON si.sale_id = s.id
           JOIN products p ON si.product_id = p.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE s.business_id = $1 AND s.status = 'completed' ${dateClause.replace(/created_at/g, 's.created_at')}
           GROUP BY c.id, c.name ORDER BY total_revenue DESC`,
          params
        );
        res.json(result.rows);
        break;
      }

      case 'sales-by-payment-method': {
        const result = await query(
          `SELECT payment_method, COUNT(id) as transaction_count, SUM(total) as total_amount
           FROM sales WHERE business_id = $1 AND status = 'completed' ${dateClause}
           GROUP BY payment_method ORDER BY total_amount DESC`,
          params
        );
        res.json(result.rows);
        break;
      }

      case 'profit-loss': {
        const salesRes = await query(
          `SELECT COALESCE(SUM(si.profit), 0) as gross_profit, COALESCE(SUM(s.total), 0) as revenue
           FROM sales s
           JOIN sale_items si ON si.sale_id = s.id
           WHERE s.business_id = $1 AND s.status = 'completed' ${dateClause.replace(/created_at/g, 's.created_at')}`,
          params
        );
        const expRes = await query(
          `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE business_id = $1 ${dateClause}`,
          params
        );
        const rev = Number(salesRes.rows[0]?.revenue || 0);
        const gross = Number(salesRes.rows[0]?.gross_profit || 0);
        const exp = Number(expRes.rows[0]?.total_expenses || 0);
        res.json({
          revenue: rev,
          grossProfit: gross,
          totalExpenses: exp,
          netProfit: gross - exp
        });
        break;
      }

      case 'tax-report': {
        const result = await query(
          `SELECT COALESCE(SUM(total), 0) as taxable_sales, COALESCE(SUM(tax), 0) as total_tax
           FROM sales WHERE business_id = $1 AND status = 'completed' ${dateClause}`,
          params
        );
        res.json(result.rows[0]);
        break;
      }

      case 'discounts-refunds': {
        const discRes = await query(
          `SELECT COALESCE(SUM(discount), 0) as total_discounts FROM sales WHERE business_id = $1 ${dateClause}`,
          params
        );
        const refRes = await query(
          `SELECT COALESCE(SUM(total), 0) as total_refunds FROM sales WHERE business_id = $1 AND status = 'returned' ${dateClause}`,
          params
        );
        res.json({
          totalDiscounts: discRes.rows[0]?.total_discounts || 0,
          totalRefunds: refRes.rows[0]?.total_refunds || 0
        });
        break;
      }

      case 'transactions': {
        const result = await query(
          `SELECT id, receipt_no as reference, 'sale' as type, total as amount, payment_method, created_at
           FROM sales WHERE business_id = $1 ${dateClause}
           UNION ALL
           SELECT id, title as reference, 'expense' as type, amount, category as payment_method, created_at
           FROM expenses WHERE business_id = $1 ${dateClause}
           ORDER BY created_at DESC`,
          params
        );
        res.json(result.rows);
        break;
      }

      case 'stock-summary': {
        const result = await query(
          `SELECT
             COUNT(id) filter (where stock <= low_stock_threshold and stock > 0) as low_stock_count,
             COUNT(id) filter (where stock <= 0) as out_of_stock_count,
             COUNT(id) as total_products,
             SUM(stock) as total_inventory_units
           FROM products WHERE business_id = $1 AND active = true`,
          [businessId]
        );
        res.json(result.rows[0]);
        break;
      }

      case 'stock-report': {
        const result = await query(
          `SELECT sm.*, p.name as product_name, p.sku
           FROM stock_movements sm
           JOIN products p ON sm.product_id = p.id
           WHERE sm.business_id = $1
           ORDER BY sm.created_at DESC LIMIT 100`,
          [businessId]
        );
        res.json(result.rows);
        break;
      }

      case 'purchases-receiving': {
        const result = await query(
          `SELECT r.*, s.name as supplier_name
           FROM restocks r
           LEFT JOIN suppliers s ON r.supplier_id = s.id
           WHERE r.business_id = $1 ORDER BY r.created_at DESC`,
          [businessId]
        );
        res.json(result.rows);
        break;
      }

      case 'customer-records':
      case 'top-customers': {
        const result = await query(
          `SELECT c.id, c.name, c.phone, COUNT(s.id) as order_count, COALESCE(SUM(s.total), 0) as total_spent
           FROM customers c
           LEFT JOIN sales s ON s.customer_id = c.id AND s.business_id = c.business_id
           WHERE c.business_id = $1
           GROUP BY c.id, c.name, c.phone
           ORDER BY total_spent DESC`,
          [businessId]
        );
        res.json(result.rows);
        break;
      }

      case 'employee-performance': {
        const result = await query(
          `SELECT m.id, m.name, COUNT(s.id) as total_sales_count, COALESCE(SUM(s.total), 0) as total_revenue
           FROM members m
           LEFT JOIN sales s ON s.member_id = m.id AND s.business_id = m.business_id
           WHERE m.business_id = $1
           GROUP BY m.id, m.name
           ORDER BY total_revenue DESC`,
          [businessId]
        );
        res.json(result.rows);
        break;
      }

      case 'management-overview': {
        const sales = await query(`SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE business_id = $1 AND status = 'completed'`, [businessId]);
        const expenses = await query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = $1`, [businessId]);
        const customers = await query(`SELECT COUNT(id) as count FROM customers WHERE business_id = $1`, [businessId]);
        const products = await query(`SELECT COUNT(id) as count FROM products WHERE business_id = $1`, [businessId]);
        res.json({
          totalRevenue: sales.rows[0]?.total || 0,
          totalExpenses: expenses.rows[0]?.total || 0,
          totalCustomers: customers.rows[0]?.count || 0,
          totalProducts: products.rows[0]?.count || 0
        });
        break;
      }

      case 'best-selling': {
        const result = await query(
          `SELECT p.name, SUM(si.qty) as qty_sold, SUM(si.total) as total_revenue
           FROM sale_items si
           JOIN sales s ON si.sale_id = s.id
           JOIN products p ON si.product_id = p.id
           WHERE s.business_id = $1 AND s.status = 'completed'
           GROUP BY p.id, p.name ORDER BY qty_sold DESC LIMIT 10`,
          [businessId]
        );
        res.json(result.rows);
        break;
      }

      case 'slow-moving': {
        const result = await query(
          `SELECT p.name, p.stock, COALESCE(SUM(si.qty), 0) as qty_sold
           FROM products p
           LEFT JOIN sale_items si ON si.product_id = p.id
           WHERE p.business_id = $1 AND p.active = true
           GROUP BY p.id, p.name, p.stock
           ORDER BY qty_sold ASC, p.stock DESC LIMIT 10`,
          [businessId]
        );
        res.json(result.rows);
        break;
      }

      default:
        res.status(400).json({ error: 'Unknown report type' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
