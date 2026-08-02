const { pool } = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await pool.execute(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [
      req.params.id,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.getAchievements = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.code, a.title, a.description, a.icon,
        ua.achieved_at IS NOT NULL AS unlocked, ua.achieved_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
       ORDER BY a.id`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
