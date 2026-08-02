// Membuat akun admin pertama. Jalankan dengan: npm run seed
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@mysavings.local';
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin12345';

  const [existing] = await pool.execute(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing.length) {
    console.log('Admin sudah ada, dilewati.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    `INSERT INTO users (full_name, username, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')`,
    ['Administrator', username, email, passwordHash]
  );
  await pool.execute(`INSERT INTO settings (user_id) VALUES (?)`, [result.insertId]);

  console.log(`✅ Admin dibuat: ${email} / ${password} (segera ganti password setelah login pertama)`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Gagal membuat admin:', err.message);
  process.exit(1);
});
