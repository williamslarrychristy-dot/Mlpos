import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/command', async (req: AuthRequest, res) => {
  const { prompt } = req.body;
  const businessId = req.user?.businessId;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
  }

  const ai = new GoogleGenAI({ apiKey });

  // Define tools / declaration functions
  const toolDeclarations = [
    {
      name: 'update_stock',
      description: 'Update product stock level by adding or setting quantity',
      parameters: {
        type: Type.OBJECT,
        properties: {
          product_name: { type: Type.STRING, description: 'Product name or matching keyword' },
          qty: { type: Type.NUMBER, description: 'Quantity to set or add' },
          mode: { type: Type.STRING, description: 'Set to "add" to increment or "set" to overwrite', enum: ['add', 'set'] }
        },
        required: ['product_name', 'qty']
      }
    },
    {
      name: 'update_price',
      description: 'Update cost price and sale price for a product',
      parameters: {
        type: Type.OBJECT,
        properties: {
          product_name: { type: Type.STRING },
          cost_price: { type: Type.NUMBER },
          sale_price: { type: Type.NUMBER }
        },
        required: ['product_name']
      }
    },
    {
      name: 'create_product',
      description: 'Create a new inventory product',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sale_price: { type: Type.NUMBER },
          cost_price: { type: Type.NUMBER },
          stock: { type: Type.NUMBER },
          sku: { type: Type.STRING }
        },
        required: ['name', 'sale_price']
      }
    },
    {
      name: 'delete_product',
      description: 'Delete a product by name',
      parameters: {
        type: Type.OBJECT,
        properties: {
          product_name: { type: Type.STRING }
        },
        required: ['product_name']
      }
    },
    {
      name: 'get_sales_summary',
      description: 'Get sales summary for a date range or total',
      parameters: {
        type: Type.OBJECT,
        properties: {
          start_date: { type: Type.STRING },
          end_date: { type: Type.STRING }
        }
      }
    },
    {
      name: 'get_low_stock',
      description: 'Get products running low on stock',
      parameters: {
        type: Type.OBJECT,
        properties: {}
      }
    },
    {
      name: 'search_products',
      description: 'Search products by keyword',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING }
        },
        required: ['query']
      }
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      config: {
        tools: [{ functionDeclarations: toolDeclarations as any }],
        systemInstruction: `You are MotoLarry AI Assistant for retail management. You operate on business_id = ${businessId}. Execute tools accurately.`
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return res.json({ reply: 'No response generated.' });
    }

    const firstCandidate = candidates[0];
    const functionCalls = firstCandidate.content?.parts?.filter(p => p.functionCall)?.map(p => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const name = call?.name;
      const args = call?.args as any;

      let toolResult: any = null;

      if (name === 'update_stock') {
        const { product_name, qty, mode } = args;
        const pRes = await query(`SELECT id, stock FROM products WHERE business_id = $1 AND name ILIKE $2 LIMIT 1`, [businessId, `%${product_name}%`]);
        if (pRes.rows.length === 0) {
          toolResult = `Product matching '${product_name}' not found.`;
        } else {
          const prod = pRes.rows[0];
          const newQty = mode === 'set' ? qty : Number(prod.stock) + Number(qty);
          await query(`UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`, [newQty, prod.id, businessId]);
          toolResult = `Successfully updated stock for ${product_name} to ${newQty}.`;
        }
      } else if (name === 'update_price') {
        const { product_name, cost_price, sale_price } = args;
        const pRes = await query(`SELECT id FROM products WHERE business_id = $1 AND name ILIKE $2 LIMIT 1`, [businessId, `%${product_name}%`]);
        if (pRes.rows.length === 0) {
          toolResult = `Product matching '${product_name}' not found.`;
        } else {
          await query(
            `UPDATE products SET cost_price = COALESCE($1, cost_price), sale_price = COALESCE($2, sale_price), updated_at = NOW() WHERE id = $3 AND business_id = $4`,
            [cost_price, sale_price, pRes.rows[0].id, businessId]
          );
          toolResult = `Successfully updated prices for ${product_name}.`;
        }
      } else if (name === 'create_product') {
        const { name: pName, sale_price, cost_price, stock, sku } = args;
        const pRes = await query(
          `INSERT INTO products (business_id, name, sale_price, cost_price, stock, sku) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [businessId, pName, sale_price, cost_price || 0, stock || 0, sku || null]
        );
        toolResult = `Created product '${pName}' with sale price $${sale_price}.`;
      } else if (name === 'delete_product') {
        const { product_name } = args;
        await query(`DELETE FROM products WHERE business_id = $1 AND name ILIKE $2`, [businessId, `%${product_name}%`]);
        toolResult = `Deleted product '${product_name}'.`;
      } else if (name === 'get_sales_summary') {
        const resSum = await query(`SELECT SUM(total) as total, COUNT(id) as count FROM sales WHERE business_id = $1 AND status = 'completed'`, [businessId]);
        toolResult = `Total sales: $${resSum.rows[0].total || 0} across ${resSum.rows[0].count} orders.`;
      } else if (name === 'get_low_stock') {
        const resLow = await query(`SELECT name, stock, low_stock_threshold FROM products WHERE business_id = $1 AND stock <= low_stock_threshold LIMIT 10`, [businessId]);
        toolResult = resLow.rows;
      } else if (name === 'search_products') {
        const resP = await query(`SELECT name, sale_price, stock FROM products WHERE business_id = $1 AND name ILIKE $2 LIMIT 10`, [businessId, `%${args.query}%`]);
        toolResult = resP.rows;
      }

      return res.json({ reply: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2), toolCalled: name });
    }

    const textResponse = firstCandidate.content?.parts?.map(p => p.text).join('\n') || 'Completed.';
    return res.json({ reply: textResponse });
  } catch (err: any) {
    console.error('AI command execution error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
