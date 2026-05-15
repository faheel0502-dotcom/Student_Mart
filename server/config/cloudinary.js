const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Check if Cloudinary is configured
const hasCloudinary = (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key'
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── Local Disk Storage (fallback when Cloudinary not configured) ──────────────
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const localProductStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../client/public/uploads/products');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${unique}${path.extname(file.originalname)}`);
  },
});

const localAvatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../client/public/uploads/avatars');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${unique}${path.extname(file.originalname)}`);
  },
});

// ── Cloudinary Storage ────────────────────────────────────────────────────────
const productStorage = hasCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'studentmart/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
      },
    })
  : localProductStorage;

const avatarStorage = hasCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'studentmart/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }],
      },
    })
  : localAvatarStorage;

// ── Multer Upload Instances ───────────────────────────────────────────────────
const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ── Delete image helper ───────────────────────────────────────────────────────
const deleteImage = async (publicId) => {
  if (!publicId) return;
  if (hasCloudinary) {
    try { await cloudinary.uploader.destroy(publicId); }
    catch (error) { console.error('Cloudinary delete error:', error); }
  } else {
    // For local storage: publicId is just the filename
    try {
      const filePath = path.join(__dirname, '../../client/public/uploads/products', publicId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (error) { /* ignore */ }
  }
};

if (!hasCloudinary) {
  console.log('⚠️  Cloudinary not configured — using local file storage for images');
}

module.exports = { cloudinary, uploadProduct, uploadAvatar, deleteImage };
