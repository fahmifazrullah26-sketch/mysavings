const { pool } = require('../config/db');

const TargetModel = {
  async create(userId, { name, targetAmount, deadline, category, description }) {
    const [result] = await pool.execute(
      `INSERT INTO saving_targets (user_id, name, target_amount, deadline, category, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, targetAmount, deadline || null, category || null, description || null]
    );
    return result.insertId;
  },

  async findAllByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT *,
        ROUND(current_amount / target_amount * 100, 2) AS progress_percent
       FROM saving_targets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.execute(`SELECT * FROM saving_targets WHERE id = ? AND user_id = ?`, [id, userId]);
    return rows[0];
  },

  async update(id, userId, { name, targetAmount, deadline, category, description }) {
    await pool.execute(
      `UPDATE saving_targets SET name = ?, target_amount = ?, deadline = ?, category = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [name, targetAmount, deadline || null, category || null, description || null, id, userId]
    );
  },

  async remove(id, userId) {
    await pool.execute(`DELETE FROM saving_targets WHERE id = ? AND user_id = ?`, [id, userId]);
  },

  // Menambah kontribusi menabung ke target -> otomatis update current_amount
  // dan status (completed jika sudah mencapai target_amount).
  async addContribution(targetId, userId, amount, date) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `INSERT INTO target_contributions (target_id, user_id, amount, contribution_date)
         VALUES (?, ?, ?, ?)`,
        [targetId, userId, amount, date]
      );

      await conn.execute(
        `UPDATE saving_targets SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?`,
        [amount, targetId, userId]
      );

      const [[target]] = await conn.query(
        `SELECT * FROM saving_targets WHERE id = ? AND user_id = ?`,
        [targetId, userId]
      );

      let justCompleted = false;
      if (target && Number(target.current_amount) >= Number(target.target_amount) && target.status === 'active') {
        await conn.execute(`UPDATE saving_targets SET status = 'completed' WHERE id = ?`, [targetId]);
        justCompleted = true;
      }

      await conn.commit();
      return { target, justCompleted };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Tanggal-tanggal di bulan tertentu di mana user melakukan kontribusi
  // (dipakai untuk Kalender Menabung: hijau = menabung, merah = tidak)
  async contributionDatesInMonth(userId, year, month) {
    const [rows] = await pool.execute(
      `SELECT DISTINCT contribution_date FROM target_contributions
       WHERE user_id = ? AND YEAR(contribution_date) = ? AND MONTH(contribution_date) = ?`,
      [userId, year, month]
    );
    return rows.map((r) => r.contribution_date);
  },
};

module.exports = TargetModel;
