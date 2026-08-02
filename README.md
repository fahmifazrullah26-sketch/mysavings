# 💰 MySavings — Aplikasi Manajemen Tabungan Online

Aplikasi web multi-user untuk mencatat pemasukan, pengeluaran, target tabungan, dan memantau
perkembangan keuangan secara real-time, lengkap dengan dashboard, grafik, kalender menabung,
sistem badge/achievement, dan admin panel.

## Struktur Folder

```
mysavings/
├── client/                  # Frontend (HTML, CSS, JS vanilla)
│   ├── index.html           # Redirect ke halaman login
│   ├── pages/                # Semua halaman aplikasi
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── forgot-password.html
│   │   ├── dashboard.html
│   │   ├── income.html
│   │   ├── expense.html
│   │   ├── targets.html
│   │   ├── calendar.html
│   │   ├── history.html
│   │   ├── achievements.html
│   │   ├── profile.html
│   │   └── admin.html
│   └── public/
│       ├── css/style.css     # Tema glassmorphism + dark mode
│       └── js/
│           ├── config.js     # URL API backend
│           ├── api.js        # Helper fetch + auth token
│           └── layout.js     # Sidebar & topbar bersama
├── server/                   # Backend (Express + MySQL)
│   ├── config/db.js          # Koneksi pool MySQL
│   ├── controllers/          # Logika bisnis tiap fitur
│   ├── middleware/           # auth, validators, error handler
│   ├── models/                # Query database (prepared statement)
│   ├── routes/                # Definisi endpoint REST API
│   ├── utils/                 # achievements.js, pdfExport.js, seed.js
│   ├── uploads/                # Foto profil yang diunggah
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Entry point
└── database/
    └── schema.sql             # ERD + skema tabel lengkap
```

## Fitur

- **Autentikasi**: Register, Login, Remember Me, Lupa/Reset Password, JWT (access + refresh token), logout
- **Dashboard**: Total saldo, pemasukan, pengeluaran, tabungan, progress target + 3 grafik (bar, line, pie)
- **Pemasukan & Pengeluaran**: CRUD lengkap dengan kategori
- **Target Tabungan**: Progress otomatis, animasi konfeti saat tercapai, riwayat kontribusi
- **Kalender Menabung**: Visualisasi hari menabung (hijau) vs tidak (merah)
- **Riwayat Transaksi**: Filter tanggal/kategori/jenis/nominal, pencarian, export CSV/Excel/PDF
- **Achievement**: Badge otomatis (streak menabung, saldo tercapai, target selesai)
- **Profil**: Ubah foto, nama, email, password, dark mode, bahasa
- **Admin Panel**: Kelola pengguna, statistik agregat (bukan detail finansial pribadi)
- **Keamanan**: bcrypt, JWT, Helmet, rate limiter, CORS, validasi input, prepared statement (anti SQL Injection & XSS)

## Persyaratan

- Node.js 18+
- MySQL 8+
- npm

## Instalasi Lokal

### 1. Setup Database

```bash
mysql -u root -p < database/schema.sql
```

Ini akan membuat database `mysavings` beserta seluruh tabel dan data achievement default.

### 2. Setup Backend

```bash
cd server
cp .env.example .env
# Edit .env: isi DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET dengan nilai kamu sendiri
npm install
npm run dev        # mode development (auto-reload dengan nodemon)
# atau
npm start           # mode production
```

Server berjalan di `http://localhost:5000`. Cek `http://localhost:5000/api/health` untuk memastikan aktif.

**(Opsional) Buat akun admin pertama:**

```bash
npm run seed
```

### 3. Setup Frontend

Frontend adalah file statis (HTML/CSS/JS), tidak butuh build step.

1. Buka `client/public/js/config.js`, pastikan `MYSAVINGS_API_BASE` mengarah ke backend (`http://localhost:5000/api` untuk lokal).
2. Jalankan dengan live server apa pun, misalnya:

```bash
cd client
npx serve .
# atau ekstensi "Live Server" di VS Code
```

3. Buka `http://localhost:3000/pages/login.html` (atau port sesuai tool yang dipakai) → Register → Login.

## Environment Variables (server/.env)

| Variabel | Keterangan |
|---|---|
| `PORT` | Port backend (default 5000) |
| `CLIENT_URL` | URL frontend, dipakai untuk CORS |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Koneksi MySQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | String acak panjang, **wajib diganti** sebelum produksi |
| `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES` | Masa berlaku token |
| `SMTP_*` | Kredensial email untuk fitur lupa password (opsional, lihat catatan di bawah) |

Generate secret yang aman:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Dokumentasi API (ringkas)

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Keterangan | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registrasi akun baru | - |
| POST | `/auth/login` | Login, mengembalikan accessToken | - |
| POST | `/auth/refresh` | Perbarui accessToken via refresh cookie | - |
| POST | `/auth/logout` | Logout | - |
| POST | `/auth/forgot-password` | Kirim link reset password | - |
| POST | `/auth/reset-password` | Reset password dengan token | - |
| GET | `/auth/me` | Data user yang login | ✅ |
| GET/POST | `/income` | List / tambah pemasukan | ✅ |
| PUT/DELETE | `/income/:id` | Update / hapus pemasukan | ✅ |
| GET/POST | `/expense` | List / tambah pengeluaran | ✅ |
| PUT/DELETE | `/expense/:id` | Update / hapus pengeluaran | ✅ |
| GET/POST | `/targets` | List / buat target tabungan | ✅ |
| PUT/DELETE | `/targets/:id` | Update / hapus target | ✅ |
| POST | `/targets/:id/contribute` | Tambah kontribusi menabung | ✅ |
| GET | `/targets/calendar?year=&month=` | Tanggal menabung dalam sebulan | ✅ |
| GET | `/dashboard/summary` | Ringkasan saldo & progress target | ✅ |
| GET | `/dashboard/charts?year=` | Data grafik bulanan | ✅ |
| GET | `/transactions` | Riwayat gabungan + filter/search | ✅ |
| GET | `/transactions/export?format=csv\|excel\|pdf` | Export riwayat | ✅ |
| PUT | `/profile` | Update profil (multipart, field `photo`) | ✅ |
| PUT | `/profile/password` | Ubah password | ✅ |
| GET/PUT | `/profile/settings` | Preferensi (dark mode, bahasa, reminder) | ✅ |
| GET | `/notifications` | Daftar notifikasi | ✅ |
| PATCH | `/notifications/:id/read` | Tandai sudah dibaca | ✅ |
| GET | `/notifications/achievements` | Daftar badge + status unlock | ✅ |
| GET | `/admin/users` | Daftar pengguna (khusus admin) | ✅ admin |
| PATCH | `/admin/users/:id/deactivate` | Nonaktifkan akun | ✅ admin |
| PATCH | `/admin/users/:id/activate` | Aktifkan akun | ✅ admin |
| DELETE | `/admin/users/:id` | Hapus akun | ✅ admin |
| GET | `/admin/stats` | Statistik agregat platform | ✅ admin |

Semua response mengikuti format:
```json
{ "success": true, "message": "...", "data": { } }
```

Endpoint yang butuh auth mengirim header: `Authorization: Bearer <accessToken>`.

## Deployment

### Database → Railway MySQL / PlanetScale
1. Buat instance MySQL baru di Railway atau PlanetScale.
2. Jalankan `database/schema.sql` pada instance tersebut (via `mysql` CLI atau dashboard import).
3. Catat host, port, user, password, nama database untuk diisi ke environment variable backend.

### Backend → Railway / Render
1. Push folder `server/` ke repository GitHub.
2. Buat service baru di Railway/Render, hubungkan ke repo, root directory `server/`.
3. Set start command: `npm start`.
4. Isi environment variables sesuai `.env.example` (gunakan kredensial database dari langkah sebelumnya).
5. Set `CLIENT_URL` ke domain frontend (Vercel) agar CORS berfungsi.
6. Deploy — catat URL backend yang dihasilkan, misal `https://mysavings-api.up.railway.app`.

### Frontend → Vercel
1. Push folder `client/` ke repository GitHub (bisa repo yang sama atau terpisah).
2. Import project di Vercel, set root directory ke `client/`.
3. Karena ini situs statis, tidak perlu build command khusus (framework preset: "Other").
4. Sebelum deploy, edit `client/public/js/config.js` agar `MYSAVINGS_API_BASE` menunjuk ke URL backend produksi.
5. Deploy — aplikasi dapat diakses lewat domain Vercel yang diberikan.

### Setelah Deploy
- Uji `https://<backend-url>/api/health` harus mengembalikan `{"success":true}`.
- Uji alur register → login → tambah transaksi dari domain frontend produksi.
- Jalankan `npm run seed` di lingkungan produksi (atau lewat Railway shell) untuk membuat akun admin pertama.

## Catatan Pengembangan Lanjutan

Scaffold ini mengimplementasikan seluruh alur inti secara utuh dan teruji (server berhasil di-boot,
seluruh route dan middleware auth/validasi diverifikasi merespons dengan benar). Beberapa area berikut
disediakan strukturnya dan siap dikembangkan lebih lanjut sesuai kebutuhan:

- **Email lupa password**: endpoint sudah menghasilkan token reset; tinggal hubungkan `nodemailer`
  (sudah ada di dependencies) di `authController.forgotPassword` untuk benar-benar mengirim email.
- **Notifikasi real-time**: saat ini notifikasi disimpan di tabel `notifications` dan diambil via polling
  (`GET /api/notifications`). Untuk real-time, tambahkan Socket.IO atau Server-Sent Events.
- **Import Excel**: kolom & endpoint transaksi sudah siap menerima data; tambahkan endpoint
  `POST /api/transactions/import` dengan `multer` + `xlsx`/`exceljs` untuk parsing file.
- **Export Excel murni (.xlsx)**: saat ini export "excel" menghasilkan CSV yang bisa dibuka Excel;
  untuk file `.xlsx` asli, gunakan library `exceljs` di `transactionController.exportData`.
- **Multi-bahasa (ID/EN)**: kolom `language` sudah tersimpan di `settings`; tambahkan file kamus JSON
  dan terapkan di frontend berdasarkan nilai tersebut.
- **CSRF protection**: karena refresh token disimpan di cookie httpOnly, jika ditambahkan endpoint
  cookie-based lain, terapkan token CSRF (mis. `csrf-csrf`) pada endpoint tersebut.
- **Multer**: proyek ini memakai Multer 1.x untuk kesederhanaan; sebelum produksi skala besar,
  pertimbangkan migrasi ke Multer 2.x yang lebih aman.

## Lisensi

Bebas digunakan dan dimodifikasi untuk keperluan pembelajaran maupun pengembangan lebih lanjut.
