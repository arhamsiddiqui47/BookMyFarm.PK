const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const HttpError = require('./httpError');

// Photos are received into memory, checked, then stored.
// If CLOUDINARY_URL is set they go to Cloudinary (needed on Render, whose disk is wiped on restart).
// Otherwise they are saved in server/uploads and served at /uploads, which is fine for local development.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new HttpError(400, 'Photos must be JPG, PNG or WEBP'));
    }
    cb(null, true);
  },
});

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

async function storeFile(file, folder = 'farmhouses') {
  if (process.env.CLOUDINARY_URL) {
    const cloudinary = require('cloudinary').v2; // reads CLOUDINARY_URL automatically
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `bookmyfarm/${folder}` }, (err, res) => (err ? reject(err) : resolve(res)))
        .end(file.buffer);
    });
    return result.secure_url;
  }
  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
  const name = `${folder}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  const base = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${name}`;
}

async function storeFiles(files = [], folder) {
  return Promise.all(files.map((f) => storeFile(f, folder)));
}

module.exports = { upload, storeFiles, UPLOAD_DIR };
