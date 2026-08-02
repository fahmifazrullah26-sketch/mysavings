const { pool } = require('../config/db');
const { Parser } = require('json2csv');

// GET /api/transactions — riwayat gabungan income+expense dengan filter & search
exports.getAll = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, minAmount, maxAmount } = req.query;
    let sql = `SELECT * FROM transactions WHERE user_id = ?`;
    const params = [req.user.id];

    if (type) { sql += ` AND type = ?`; params.push(type); }
    if (category) { sql += ` AND category = ?`; params.push(category); }
    if (startDate) { sql += ` AND transaction_date >= ?`; params.push(startDate); }
    if (endDate) { sql += ` AND transaction_date <= ?`; params.push(endDate); }
    if (minAmount) { sql += ` AND amount >= ?`; params.push(minAmount); }
    if (maxAmount) { sql += ` AND amount <= ?`; params.push(maxAmount); }
    if (search) { sql += ` AND description LIKE ?`; params.push(`%${search}%`); }

    sql += ` ORDER BY transaction_date DESC`;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/export?format=csv|excel
// Catatan: format Excel di-generate sebagai CSV yang dapat dibuka Excel;
// untuk file .xlsx murni gunakan library exceljs pada implementasi lanjutan.
exports.exportData = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const [rows] = await pool.query(
      `SELECT transaction_date, type, category, amount, description
       FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC`,
      [req.user.id]
    );

    if (format === 'csv' || format === 'excel') {
      const parser = new Parser({
        fields: ['transaction_date', 'type', 'category', 'amount', 'description'],
      });
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment(`mysavings-transactions.${format === 'excel' ? 'csv' : 'csv'}`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      // Diimplementasikan dengan pdfkit — lihat utils/pdfExport.js
      const generatePdf = require('../utils/pdfExport');
      return generatePdf(res, rows);
    }

    res.status(400).json({ success: false, message: 'Format tidak didukung' });
  } catch (err) {
    next(err);
  }
};
