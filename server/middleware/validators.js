const { body, validationResult } = require('express-validator');

// Menjalankan hasil validasi; jika ada error, hentikan request dengan 422
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validasi gagal', errors: errors.array() });
  }
  next();
}

const registerRules = [
  body('fullName').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, underscore'),
  body('email').isEmail().withMessage('Email tidak valid').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/\d/).withMessage('Password harus mengandung angka'),
];

const loginRules = [
  body('emailOrUsername').trim().notEmpty().withMessage('Email/username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

const incomeExpenseRules = [
  body('transactionDate').isDate().withMessage('Tanggal tidak valid'),
  body('amount').isFloat({ gt: 0 }).withMessage('Nominal harus lebih dari 0'),
  body('category').trim().notEmpty().withMessage('Kategori wajib diisi'),
  body('description').optional().trim().isLength({ max: 255 }),
];

const targetRules = [
  body('name').trim().notEmpty().withMessage('Nama target wajib diisi'),
  body('targetAmount').isFloat({ gt: 0 }).withMessage('Target nominal harus lebih dari 0'),
  body('deadline').optional({ nullable: true }).isDate().withMessage('Deadline tidak valid'),
];

module.exports = { validate, registerRules, loginRules, incomeExpenseRules, targetRules };
