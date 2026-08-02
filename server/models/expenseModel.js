const { pool } = require('../config/db');

const ExpenseModel = {
  async create(userId, { transactionDate, amount, category, description }) {
    const [result] = await pool.execute(
      `INSERT INTO expense (user_id, transaction_date, amount, category, description)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, transactionDate, amount, category, description || null]
    );
    return result.insertId;
  },

  async findAllByUser(userId, filters = {}) {
    let sql = `SELECT * FROM expense WHERE user_id = ?`;
    const params = [userId];

    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters.startDate) {
      sql += ` AND transaction_date >= ?`;
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ` AND transaction_date <= ?`;
      params.push(filters.endDate);
    }
    sql += ` ORDER BY transaction_date DESC, id DESC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(`SELECT * FROM expense WHERE id = ? AND user_id = ?`, [id, userId]);
    return rows[0];
  },

  async update(id, userId, { transactionDate, amount, category, description }) {
    await pool.execute(
      `UPDATE expense SET transaction_date = ?, amount = ?, category = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [transactionDate, amount, category, description || null, id, userId]
    );
  },

  async remove(id, userId) {
    await pool.execute(`DELETE FROM expense WHERE id = ? AND user_id = ?`, [id, userId]);
  },

  async sumByUser(userId, { startDate, endDate } = {}) {
    let sql = `SELECT COALESCE(SUM(amount), 0) AS total FROM expense WHERE user_id = ?`;
    const params = [userId];
    if (startDate) { sql += ` AND transaction_date >= ?`; params.push(startDate); }
    if (endDate) { sql += ` AND transaction_date <= ?`; params.push(endDate); }
    const [rows] = await pool.query(sql, params);
    return rows[0].total;
  },

  async monthlyTotals(userId, year) {
    const [rows] = await pool.execute(
      `SELECT MONTH(transaction_date) AS month, SUM(amount) AS total
       FROM expense WHERE user_id = ? AND YEAR(transaction_date) = ?
       GROUP BY MONTH(transaction_date) ORDER BY month`,
      [userId, year]
    );
    return rows;
  },
};

module.exports = ExpenseModel;
