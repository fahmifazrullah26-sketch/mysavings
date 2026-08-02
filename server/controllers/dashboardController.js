const { pool } = require('../config/db');
const IncomeModel = require('../models/incomeModel');
const ExpenseModel = require('../models/expenseModel');

// GET /api/dashboard/summary
exports.summary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const totalIncome = await IncomeModel.sumByUser(userId);
    const totalExpense = await ExpenseModel.sumByUser(userId);
    const balance = Number(totalIncome) - Number(totalExpense);

    const [[{ totalSavings }]] = await pool.query(
      `SELECT COALESCE(SUM(current_amount),0) AS totalSavings FROM saving_targets WHERE user_id = ?`,
      [userId]
    );
    const [[{ activeTargets }]] = await pool.query(
      `SELECT COUNT(*) AS activeTargets FROM saving_targets WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    const [targets] = await pool.query(
      `SELECT id, name, target_amount, current_amount,
        ROUND(current_amount / target_amount * 100, 2) AS progress_percent
       FROM saving_targets WHERE user_id = ? AND status = 'active'
       ORDER BY progress_percent DESC LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        totalSavings,
        activeTargets,
        targetsProgress: targets,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/charts?year=2026 — data untuk Chart.js
exports.charts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const incomeMonthly = await IncomeModel.monthlyTotals(userId, year);
    const expenseMonthly = await ExpenseModel.monthlyTotals(userId, year);

    // Normalisasi ke array 12 bulan supaya mudah dipakai Chart.js
    const fillMonths = (rows) => {
      const arr = new Array(12).fill(0);
      rows.forEach((r) => { arr[r.month - 1] = Number(r.total); });
      return arr;
    };

    const incomeArr = fillMonths(incomeMonthly);
    const expenseArr = fillMonths(expenseMonthly);
    const balanceArr = incomeArr.map((v, i) => v - expenseArr[i]);

    const [expenseByCategory] = await pool.execute(
      `SELECT category, SUM(amount) AS total FROM expense
       WHERE user_id = ? AND YEAR(transaction_date) = ? GROUP BY category`,
      [userId, year]
    );

    res.json({
      success: true,
      data: {
        months: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
        income: incomeArr,
        expense: expenseArr,
        balance: balanceArr,
        expenseByCategory,
      },
    });
  } catch (err) {
    next(err);
  }
};
