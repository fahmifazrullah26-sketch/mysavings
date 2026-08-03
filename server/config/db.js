// Koneksi pool ke MySQL menggunakan mysql2/promise
// Pool dipakai (bukan single connection) agar aplikasi bisa menangani
// banyak request bersamaan tanpa membuka koneksi baru setiap saat.
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // agar kolom DECIMAL dikembalikan sebagai number, bukan string
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Uji koneksi sekali saat startup agar error konfigurasi langsung terlihat
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Database MySQL terhubung');
    conn.release();
  } catch (err) {
    console.error('❌ Gagal terhubung ke database:', err.message);
  }
}

module.exports = { pool, testConnection };
