const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.get('/', authenticate, getProfile);
router.put('/', authenticate, uploadAvatar.single('avatar'), updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
