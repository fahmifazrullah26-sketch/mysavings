const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');

// Konfigurasi upload foto profil — validasi tipe file & batas ukuran 2MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Format foto harus jpg, jpeg, png, atau webp'));
    }
    cb(null, true);
  },
});

router.use(verifyToken);
router.put('/', upload.single('photo'), profileController.updateProfile);
router.put('/password', profileController.changePassword);
router.get('/settings', profileController.getSettings);
router.put('/settings', profileController.updateSettings);

module.exports = router;
