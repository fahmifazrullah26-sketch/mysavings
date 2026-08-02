const ExpenseModel = require('../models/expenseModel');
const { checkAchievements } = require('../utils/achievements');

exports.create = async (req, res, next) => {
  try {
    const id = await ExpenseModel.create(req.user.id, req.body);
    await checkAchievements(req.user.id);
    res.status(201).json({ success: true, message: 'Pengeluaran ditambahkan', data: { id } });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;
    const rows = await ExpenseModel.findAllByUser(req.user.id, { category, startDate, endDate });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await ExpenseModel.findById(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await ExpenseModel.findById(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await ExpenseModel.update(req.params.id, req.user.id, req.body);
    res.json({ success: true, message: 'Pengeluaran diperbarui' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await ExpenseModel.findById(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await ExpenseModel.remove(req.params.id, req.user.id);
    res.json({ success: true, message: 'Pengeluaran dihapus' });
  } catch (err) {
    next(err);
  }
};
