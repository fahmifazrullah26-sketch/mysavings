const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/userModel');
const { pool } = require('../config/db');

const SALT_ROUNDS = 12;

function generateTokens(user) {
  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { fullName, username, email, password } = req.body;

    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }
    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username sudah digunakan' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await UserModel.create({ fullName, username, email, passwordHash });

    res.status(201).json({ success: true, message: 'Registrasi berhasil', data: { id: userId } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { emailOrUsername, password, rememberMe } = req.body;

    const user =
      (await UserModel.findByEmail(emailOrUsername)) ||
      (await UserModel.findByUsername(emailOrUsername));

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email/username atau password salah' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun dinonaktifkan. Hubungi admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email/username atau password salah' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Simpan refresh token di tabel sessions
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));
    await pool.execute(
      `INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, refreshToken, req.headers['user-agent'] || null, req.ip, expiresAt]
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        accessToken,
        user: {
          id: user.id,
          fullName: user.full_name,
          username: user.username,
          email: user.email,
          role: user.role,
          photoUrl: user.photo_url,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh — mendapatkan access token baru dari refresh token (cookie)
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'Tidak ada refresh token' });

    const [rows] = await pool.execute(`SELECT * FROM sessions WHERE refresh_token = ? LIMIT 1`, [token]);
    if (!rows[0]) return res.status(403).json({ success: false, message: 'Sesi tidak valid' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ success: false, message: 'Refresh token kedaluwarsa' });

      const user = await UserModel.findById(decoded.id);
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

      const { accessToken } = generateTokens(user);
      res.json({ success: true, data: { accessToken } });
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await pool.execute(`DELETE FROM sessions WHERE refresh_token = ?`, [token]);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logout berhasil' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findByEmail(email);

    // Selalu balas sukses (mencegah enumerasi email), walau user tidak ditemukan
    if (!user) {
      return res.json({ success: true, message: 'Jika email terdaftar, instruksi reset telah dikirim' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    await UserModel.setResetToken(email, token, expires);

    // TODO: kirim email berisi link reset menggunakan nodemailer (lihat utils/mailer.js)
    // Link contoh: `${process.env.CLIENT_URL}/reset-password.html?token=${token}`

    res.json({ success: true, message: 'Jika email terdaftar, instruksi reset telah dikirim' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await UserModel.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword(user.id, passwordHash);
    await UserModel.clearResetToken(user.id);

    res.json({ success: true, message: 'Password berhasil direset, silakan login' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
