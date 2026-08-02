const jwt = require('jsonwebtoken');

// Memverifikasi access token JWT yang dikirim di header Authorization.
// Jika valid, data user (id, role) disisipkan ke req.user untuk dipakai
// oleh controller berikutnya.
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' });
    }
    req.user = decoded; // { id, username, role }
    next();
  });
}

// Membatasi akses hanya untuk role tertentu (dipakai untuk admin panel)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
