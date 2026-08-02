const TargetModel = require('../models/targetModel');
const { checkAchievements } = require('../utils/achievements');

exports.create = async (req, res, next) => {
  try {
    const id = await TargetModel.create(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Target dibuat', data: { id } });
  } catch (err) {
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const rows = await TargetModel.findAllByUser(req.user.id);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const row = await TargetModel.findById(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ success: false, message: 'Target tidak ditemukan' });
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await TargetModel.findById(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Target tidak ditemukan' });
    await TargetModel.update(req.params.id, req.user.id, req.body);
    res.json({ success: true, message: 'Target diperbarui' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await TargetModel.remove(req.params.id, req.user.id);
    res.json({ success: true, message: 'Target dihapus' });
  } catch (err) {
    next(err);
  }
};

// POST /api/targets/:id/contribute — menabung ke target tertentu
// Mengembalikan justCompleted=true jika target baru saja tercapai,
// supaya frontend bisa menampilkan animasi konfeti.
exports.contribute = async (req, res, next) => {
  try {
    const { amount, date } = req.body;
    const { target, justCompleted } = await TargetModel.addContribution(
      req.params.id,
      req.user.id,
      amount,
      date || new Date().toISOString().slice(0, 10)
    );
    if (!target) return res.status(404).json({ success: false, message: 'Target tidak ditemukan' });

    await checkAchievements(req.user.id);

    res.json({ success: true, message: 'Kontribusi ditambahkan', data: { target, justCompleted } });
  } catch (err) {
    next(err);
  }
};

// GET /api/targets/calendar?year=2026&month=8 — untuk Kalender Menabung
exports.calendar = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const dates = await TargetModel.contributionDatesInMonth(req.user.id, year, month);
    res.json({ success: true, data: dates });
  } catch (err) {
    next(err);
  }
};
