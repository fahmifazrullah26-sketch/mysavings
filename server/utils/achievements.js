// Mengevaluasi apakah user berhak mendapat badge baru setelah suatu aksi
// (menambah pemasukan, kontribusi tabungan, dll). Dipanggil "on write",
// bukan lewat cron, supaya notifikasi badge langsung muncul.
const { pool } = require('../config/db');

async function grant(userId, code) {
  const [[ach]] = await pool.query(`SELECT id, title FROM achievements WHERE code = ?`, [code]);
  if (!ach) return;

  const [existing] = await pool.execute(
    `SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?`,
    [userId, ach.id]
  );
  if (existing.length) return; // sudah punya badge ini

  await pool.execute(
    `INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
    [userId, ach.id]
  );
  await pool.execute(
    `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'achievement')`,
    [userId, 'Badge Baru!', `Selamat, kamu mendapatkan badge "${ach.title}"`, ]
  );
}

async function checkAchievements(userId) {
  // Saldo total = total pemasukan - total pengeluaran
  const [[{ totalIncome }]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS totalIncome FROM income WHERE user_id = ?`, [userId]
  );
  const [[{ totalExpense }]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS totalExpense FROM expense WHERE user_id = ?`, [userId]
  );
  const balance = Number(totalIncome) - Number(totalExpense);

  if (balance >= 1000000) await grant(userId, 'BALANCE_1M');
  if (balance >= 5000000) await grant(userId, 'BALANCE_5M');

  // Streak menabung (hari berturut-turut ada kontribusi)
  const [rows] = await pool.query(
    `SELECT DISTINCT contribution_date FROM target_contributions
     WHERE user_id = ? ORDER BY contribution_date DESC LIMIT 30`,
    [userId]
  );
  let streak = 0;
  let cursor = new Date();
  for (const r of rows) {
    const d = new Date(r.contribution_date);
    const diffDays = Math.round((cursor - d) / 86400000);
    if (diffDays <= 1) {
      streak += 1;
      cursor = d;
    } else break;
  }
  if (streak >= 7) await grant(userId, 'SAVE_7_DAYS');
  if (streak >= 30) await grant(userId, 'SAVE_30_DAYS');

  // Target selesai
  const [[{ completedCount }]] = await pool.query(
    `SELECT COUNT(*) AS completedCount FROM saving_targets WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  if (completedCount >= 1) await grant(userId, 'TARGET_1');
  if (completedCount >= 5) await grant(userId, 'TARGET_5');
}

module.exports = { checkAchievements };
