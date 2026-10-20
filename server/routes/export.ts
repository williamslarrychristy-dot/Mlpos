import { Router } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType } from 'docx';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res) => {
  const { format, start, end } = req.query;
  const businessId = req.user?.businessId;

  let sql = `
    SELECT s.receipt_no, s.total, s.discount, s.tax, s.payment_method, s.created_at,
           c.name as customer_name,
           json_agg(json_build_object('name', p.name, 'qty', si.qty, 'unit_price', si.unit_price, 'profit', si.profit)) as items
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN products p ON si.product_id = p.id
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

  sql += ` GROUP BY s.id, c.name ORDER BY s.created_at DESC`;

  try {
    const salesRes = await query(sql, params);
    const sales = salesRes.rows;

    let totalCash = 0;
    let totalPOS = 0;
    let totalTransfer = 0;

    sales.forEach(s => {
      const pm = (s.payment_method || '').toLowerCase();
      const amt = Number(s.total || 0);
      if (pm.includes('cash')) totalCash += amt;
      else if (pm.includes('pos') || pm.includes('card')) totalPOS += amt;
      else if (pm.includes('transfer')) totalTransfer += amt;
      else totalCash += amt;
    });

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Sales_Book.pdf"');
      doc.pipe(res);

      doc.fontSize(18).text('Sales History Ledger (ViewAsBook)', { align: 'center' });
      doc.moveDown();

      // Header row
      doc.fontSize(10).text('S/N | Receipt | Customer | Method | Total', { underline: true });
      doc.moveDown(0.5);

      sales.forEach((s, idx) => {
        doc.fontSize(9).text(`${idx + 1}. ${s.receipt_no} | ${s.customer_name || 'Walk-in'} | ${s.payment_method} | $${Number(s.total).toFixed(2)}`);
      });

      doc.moveDown();
      doc.fontSize(12).text(`Totals: Cash: $${totalCash.toFixed(2)} | POS: $${totalPOS.toFixed(2)} | Transfer: $${totalTransfer.toFixed(2)}`);
      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Ledger');

      worksheet.columns = [
        { header: 'S/N', key: 'sn', width: 8 },
        { header: 'Receipt No', key: 'receipt_no', width: 18 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Payment Method', key: 'method', width: 15 },
        { header: 'Total ($)', key: 'total', width: 12 },
        { header: 'Date', key: 'date', width: 20 },
      ];

      sales.forEach((s, idx) => {
        worksheet.addRow({
          sn: idx + 1,
          receipt_no: s.receipt_no,
          customer: s.customer_name || 'Walk-in',
          method: s.payment_method,
          total: Number(s.total),
          date: new Date(s.created_at).toLocaleString(),
        });
      });

      worksheet.addRow({});
      worksheet.addRow({ sn: 'TOTALS', method: `Cash: $${totalCash}`, total: totalCash + totalPOS + totalTransfer });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Sales_Book.xlsx"');
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'word') {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'S/N', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Receipt', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Customer', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Method', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })] }),
          ],
        }),
      ];

      sales.forEach((s, idx) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(idx + 1))] }),
              new TableCell({ children: [new Paragraph(s.receipt_no)] }),
              new TableCell({ children: [new Paragraph(s.customer_name || 'Walk-in')] }),
              new TableCell({ children: [new Paragraph(s.payment_method || '')] }),
              new TableCell({ children: [new Paragraph(`$${Number(s.total).toFixed(2)}`)] }),
            ],
          })
        );
      });

      const wordDoc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({ text: 'Sales History Ledger', heading: 'Heading1' }),
              new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
              new Paragraph({ text: `Totals: Cash: $${totalCash.toFixed(2)}, POS: $${totalPOS.toFixed(2)}, Transfer: $${totalTransfer.toFixed(2)}` }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(wordDoc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="Sales_Book.docx"');
      res.send(buffer);
    } else {
      res.status(400).json({ error: 'Invalid export format' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
