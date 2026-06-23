import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

/** Image upload (profile pictures, galleries). */
export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Dozvoljene su samo slike.'));
  },
});

/** JSON upload (employee bulk facility creation). */
export const uploadJson = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/json' || /\.json$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Dozvoljen je samo JSON fajl.'));
  },
});
