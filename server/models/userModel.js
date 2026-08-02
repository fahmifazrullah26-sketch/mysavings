// Semua query di sini menggunakan prepared statement (placeholder ?)
// untuk mencegah SQL Injection.
const { pool } = require('../config/db');

const UserModel = {
  async create({ fullName, username, email, passwordHash }) {
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, username, email, password_hash) VALUES (?, ?, ?, ?)`,
      [fullName, username, email, passwordHash]
    );
    // Buat baris settings default untuk user baru
    await pool.execute(`INSERT INTO settings (user_id) VALUES (?)`, [result.insertId]);
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
    return rows[0];
  },

  async findByUsername(username) {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE username = ? LIMIT 1`, [username]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, full_name, username, email, photo_url, role, is_active, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0];
  },

  async updateProfile(id, { fullName, email, photoUrl }) {
    await pool.execute(
      `UPDATE users SET full_name = ?, email = ?, photo_url = COALESCE(?, photo_url) WHERE id = ?`,
      [fullName, email, photoUrl, id]
    );
  },

  async updatePassword(id, passwordHash) {
    await pool.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
  },

  async setResetToken(email, token, expires) {
    await pool.execute(
      `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?`,
      [token, expires, email]
    );
  },

  async findByResetToken(token) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1`,
      [token]
    );
    return rows[0];
  },

  async clearResetToken(id) {
    await pool.execute(`UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?`, [id]);
  },

  // --- Admin ---
  async findAll({ limit = 20, offset = 0 } = {}) {
    const [rows] = await pool.query(
      `SELECT id, full_name, username, email, role, is_active, created_at
       FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  },

  async setActive(id, isActive) {
    await pool.execute(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive, id]);
  },

  async remove(id) {
    await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
  },

  async countAll() {
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users`);
    return rows[0].total;
  },
};

module.exports = UserModel;
