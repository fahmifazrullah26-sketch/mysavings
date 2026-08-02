// Menangani semua error yang dilempar (via next(err)) di satu tempat,
// supaya tidak ada try/catch yang membocorkan stack trace ke client.
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Terjadi kesalahan pada server'
      : err.message;

  res.status(status).json({ success: false, message });
}

// Menangkap route yang tidak ditemukan
function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
}

module.exports = { errorHandler, notFound };
