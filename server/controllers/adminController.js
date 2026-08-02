const { pool } = require('../config/db');
const UserModel = require('../models/userModel');

// GET /api/admin/users
exports.listUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const users = await UserModel.findAll({ limit, offset });
    const total = await UserModel.countAll();
    res.json({ success: true, data: users, meta: { total, limit, offset } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    await UserModel.remove(req.params.id);
    res.json({ success: true, message: 'Akun dihapus' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/deactivate
exports.deactivateUser = async (req, res, next) => {
  try {
    await UserModel.setActive(req.params.id, 0);
    res.json({ success: true, message: 'Akun dinonaktifkan' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/activate
exports.activateUser = async (req, res, next) => {
  try {
    await UserModel.setActive(req.params.id, 1);
    res.json({ success: true, message: 'Akun diaktifkan' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stats — statistik agregat, BUKAN data finansial pribadi per user
exports.stats = async (req, res, next) => {
  try {
    const [[{ totalUsers }]] = await pool.query(`SELECT COUNT(*) AS totalUsers FROM users`);
    const [[{ activeUsers }]] = await pool.query(`SELECT COUNT(*) AS activeUsers FROM users WHERE is_active = 1`);
    const [[{ totalTransactions }]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM income) + (SELECT COUNT(*) FROM expense) AS totalTransactions`
    );
    const [[{ targetsCompleted }]] = await pool.query(
      `SELECT COUNT(*) AS targetsCompleted FROM saving_targets WHERE status = 'completed'`
    );
    // Agregat total tercatat seluruh pengguna — hanya angka ringkasan, tanpa rincian per akun
    const [[{ totalRecorded }]] = await pool.query(
      `SELECT (SELECT COALESCE(SUM(amount),0) FROM income) +
              (SELECT COALESCE(SUM(amount),0) FROM expense) AS totalRecorded`
    );

    const [growth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS newUsers
       FROM users GROUP BY month ORDER BY month DESC LIMIT 12`
    );

    res.json({
      success: true,
      data: { totalUsers, activeUsers, totalTransactions, targetsCompleted, totalRecorded, growth },
    });
  } catch (err) {
    next(err);
  }
};
