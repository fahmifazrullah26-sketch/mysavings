const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
const { pool } = require('../config/db');

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, email } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    await UserModel.updateProfile(req.user.id, { fullName, email, photoUrl });
    res.json({ success: true, message: 'Profil diperbarui' });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await pool.execute(`SELECT password_hash FROM users WHERE id = ?`, [req.user.id]);
    const passwordHash = user[0][0].password_hash;

    const isMatch = await bcrypt.compare(currentPassword, passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password saat ini salah' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(req.user.id, newHash);
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { darkMode, language, dailyTarget, weeklyTarget, monthlyTarget, reminderEnabled } = req.body;
    await pool.execute(
      `UPDATE settings SET dark_mode = ?, language = ?, daily_target = ?, weekly_target = ?,
       monthly_target = ?, reminder_enabled = ? WHERE user_id = ?`,
      [darkMode, language, dailyTarget || null, weeklyTarget || null, monthlyTarget || null,
       reminderEnabled, req.user.id]
    );
    res.json({ success: true, message: 'Pengaturan disimpan' });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM settings WHERE user_id = ?`, [req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
