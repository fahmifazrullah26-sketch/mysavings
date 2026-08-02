-- =========================================================
-- MySavings — Database Schema (MySQL 8+)
-- =========================================================
-- ERD (text form):
--
-- users (1) ───< income
-- users (1) ───< expense
-- users (1) ───< saving_targets ───< target_contributions
-- users (1) ───< notifications
-- users (1) ───< user_achievements >─── achievements
-- users (1) ─── settings (1:1)
-- users (1) ───< sessions
--
-- =========================================================

CREATE DATABASE IF NOT EXISTS mysavings
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mysavings;

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  photo_url VARCHAR(255) DEFAULT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- SETTINGS (1:1 dengan users)
-- ---------------------------------------------------------
CREATE TABLE settings (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  dark_mode TINYINT(1) NOT NULL DEFAULT 0,
  language ENUM('id', 'en') NOT NULL DEFAULT 'id',
  daily_target DECIMAL(15,2) DEFAULT NULL,
  weekly_target DECIMAL(15,2) DEFAULT NULL,
  monthly_target DECIMAL(15,2) DEFAULT NULL,
  reminder_enabled TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- INCOME (Pemasukan)
-- ---------------------------------------------------------
CREATE TABLE income (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  transaction_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category ENUM('Gaji','Bonus','Freelance','Bisnis','Hadiah','Lainnya') NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_income_user_date (user_id, transaction_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- EXPENSE (Pengeluaran)
-- ---------------------------------------------------------
CREATE TABLE expense (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  transaction_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category ENUM('Makan','Transportasi','Belanja','Pendidikan','Tagihan','Hiburan','Investasi','Lainnya') NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expense_user_date (user_id, transaction_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- SAVING TARGETS (Target Tabungan)
-- ---------------------------------------------------------
CREATE TABLE saving_targets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  deadline DATE DEFAULT NULL,
  category VARCHAR(100) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Riwayat kontribusi menabung ke sebuah target (dipakai juga utk kalender menabung)
CREATE TABLE target_contributions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  target_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  contribution_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_id) REFERENCES saving_targets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_contrib_user_date (user_id, contribution_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- TRANSACTIONS (view gabungan income + expense untuk riwayat/filter/export)
-- Diimplementasikan sebagai VIEW agar tidak duplikasi data
-- ---------------------------------------------------------
CREATE VIEW transactions AS
  SELECT id, user_id, transaction_date, amount, category, description,
         'income' AS type, created_at
  FROM income
  UNION ALL
  SELECT id, user_id, transaction_date, amount, category, description,
         'expense' AS type, created_at
  FROM expense;

-- ---------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type ENUM('reminder','achievement','target','system') NOT NULL DEFAULT 'system',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- ACHIEVEMENTS (master data badge) + relasi ke user
-- ---------------------------------------------------------
CREATE TABLE achievements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE user_achievements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  achievement_id BIGINT UNSIGNED NOT NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB;

INSERT INTO achievements (code, title, description, icon) VALUES
  ('SAVE_7_DAYS', 'Menabung 7 Hari', 'Berhasil menabung 7 hari berturut-turut', 'fa-fire'),
  ('SAVE_30_DAYS', 'Menabung 30 Hari', 'Berhasil menabung 30 hari berturut-turut', 'fa-trophy'),
  ('BALANCE_1M', 'Saldo Pertama Rp1 Juta', 'Saldo mencapai Rp1.000.000', 'fa-coins'),
  ('BALANCE_5M', 'Saldo Rp5 Juta', 'Saldo mencapai Rp5.000.000', 'fa-gem'),
  ('TARGET_1', 'Target Pertama Selesai', 'Menyelesaikan target tabungan pertama', 'fa-flag-checkered'),
  ('TARGET_5', 'Target Kelima Selesai', 'Menyelesaikan lima target tabungan', 'fa-medal');

-- ---------------------------------------------------------
-- SESSIONS (refresh token / device tracking untuk JWT)
-- ---------------------------------------------------------
CREATE TABLE sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
