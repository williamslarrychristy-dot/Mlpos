import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Business Signup -> Creates business & admin user
router.post('/signup', async (req, res) => {
  const { businessName, name, email, password } = req.body;
  if (!businessName || !email || !password) {
    return res.status(400).json({ error: 'Business name, email, and password are required' });
  }

  try {
    // Check if member with email exists
    const existing = await query(`SELECT id FROM members WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Business
    const bizRes = await query(
      `INSERT INTO businesses (name) VALUES ($1) RETURNING id, name, created_at`,
      [businessName]
    );
    const business = bizRes.rows[0];

    // Create Admin Member
    const memberRes = await query(
      `INSERT INTO members (business_id, email, name, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'admin', 'active')
       RETURNING id, business_id, email, name, role, status`,
      [business.id, email, name || 'Admin', passwordHash]
    );
    const member = memberRes.rows[0];

    // Update owner_id
    await query(`UPDATE businesses SET owner_id = $1 WHERE id = $2`, [member.id, business.id]);

    // Seed default settings
    const defaultSettings = [
      ['business_name', businessName],
      ['currency', '$'],
      ['receipt_footer', 'Thank you for your business!'],
      ['low_stock_threshold', '3'],
      ['tax_rate', '0']
    ];
    for (const [key, val] of defaultSettings) {
      await query(
        `INSERT INTO settings (business_id, key, value) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [business.id, key, val]
      );
    }

    // Seed default payment methods
    const defaultMethods = ['Cash', 'POS', 'Transfer'];
    for (const m of defaultMethods) {
      await query(
        `INSERT INTO payment_methods (business_id, name, active) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`,
        [business.id, m]
      );
    }

    const token = generateToken({
      id: member.id,
      businessId: business.id,
      role: member.role,
      email: member.email,
      name: member.name,
    });

    res.json({
      token,
      user: member,
      business
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Server error during signup' });
  }
});

// Member Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const resMember = await query(
      `SELECT m.*, b.name as business_name FROM members m
       JOIN businesses b ON m.business_id = b.id
       WHERE m.email = $1`,
      [email]
    );

    if (resMember.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const member = resMember.rows[0];

    if (member.status !== 'active') {
      return res.status(403).json({ error: 'Your account is disabled/inactive' });
    }

    const isMatch = await bcrypt.compare(password, member.password_hash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: member.id,
      businessId: member.business_id,
      role: member.role,
      email: member.email,
      name: member.name,
    });

    res.json({
      token,
      user: {
        id: member.id,
        businessId: member.business_id,
        email: member.email,
        name: member.name,
        role: member.role,
        businessName: member.business_name
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

// Verify current token
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const resMember = await query(
      `SELECT m.id, m.business_id, m.email, m.name, m.role, m.status, b.name as business_name
       FROM members m
       JOIN businesses b ON m.business_id = b.id
       WHERE m.id = $1`,
      [req.user?.id]
    );

    if (resMember.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: resMember.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
