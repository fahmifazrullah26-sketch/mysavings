const IncomeModel = require('../models/incomeModel');
const { checkAchievements } = require('../utils/achievements');

exports.create = async (req, res, next) => {
  try {
    const id = await IncomeModel.create(req.user.id, req.body);
    await checkAchievements(req.user.id);
    res.status(201).json({ success: true, message: 'Pemasukan ditambahkan', data: { id } });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;
    const rows = await IncomeModel.findAllByUser(req.user.id, { category, startDate, endDate });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await IncomeModel.findById(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await IncomeModel.findById(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await IncomeModel.update(req.params.id, req.user.id, req.body);
    res.json({ success: true, message: 'Pemasukan diperbarui' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await IncomeModel.findById(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await IncomeModel.remove(req.params.id, req.user.id);
    res.json({ success: true, message: 'Pemasukan dihapus' });
  } catch (err) {
    next(err);
  }
};
