import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { publicUploadUrl } from '../utils/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

// Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext || ext === '.') {
      ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    }
    const safeName = `file-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, safeName);
  },
});

function rejectUpload(cb, message) {
  const err = new Error(message);
  err.statusCode = 400;
  cb(err);
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|pdf/;
  const mime = (file.mimetype || '').toLowerCase();
  const rawExt = path.extname(file.originalname || '').toLowerCase().replace('.', '');
  const mimeValid = allowedTypes.test(mime);
  const extValid = rawExt ? allowedTypes.test(rawExt) : true;
  if (mimeValid && extValid) {
    cb(null, true);
  } else {
    rejectUpload(cb, 'Invalid file format. Only JPEG, PNG, WEBP, GIF, and PDF are allowed.');
  }
};

const complaintImageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mime = (file.mimetype || '').toLowerCase();
  const rawExt = path.extname(file.originalname || '').toLowerCase().replace('.', '');
  const mimeValid = allowedTypes.test(mime);
  const extValid = rawExt ? allowedTypes.test(rawExt) : true;
  if (mimeValid && extValid) {
    cb(null, true);
  } else {
    rejectUpload(cb, 'Invalid complaint photo. Only JPG, JPEG, PNG, and WEBP images are allowed.');
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

const complaintUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: complaintImageFilter,
});

const questionPaperUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    if (file.mimetype === 'application/pdf' && (!rawExt || rawExt === '.pdf')) cb(null, true);
    else {
      const err = new Error('Invalid question paper. Only PDF files are allowed.');
      err.statusCode = 400;
      cb(err);
    }
  },
});

export const complaintImageUpload = (req, res, next) => {
  complaintUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files['photo']?.[0] || req.files['file']?.[0] || null;
    }
    next();
  });
};

export const fileUpload = (req, res, next) => {
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'document', maxCount: 1 }, { name: 'photo', maxCount: 1 }])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files['file']?.[0] || req.files['document']?.[0] || req.files['photo']?.[0] || null;
    }
    next();
  });
};

export const questionPaperFileUpload = questionPaperUpload.single('file');

const router = Router();
router.use(authenticate);

// Multipart file upload
router.post('/', fileUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const fileUrl = publicUploadUrl(req.file);
  res.status(201).json({
    success: true,
    message: 'File uploaded successfully.',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

// Base64 image upload (e.g. from camera capture)
router.post('/base64', (req, res) => {
  try {
    const { image, name = 'capture' } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid image data.' });
    }

    const matches = image.match(/^data:([A-Za-z0-9-+./]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 image data URL.' });
    }

    const mime = matches[1].toLowerCase();
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = mimeToExt[mime];
    if (!ext) {
      return res.status(400).json({ success: false, message: 'Invalid image type. Only JPEG, PNG, WEBP, and GIF are allowed.' });
    }
    const buffer = Buffer.from(matches[2], 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Image exceeds 5MB limit.' });
    }

    const filename = `capture-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    res.status(201).json({
      success: true,
      message: 'Image captured and saved successfully.',
      data: {
        url: fileUrl,
        filename,
        size: buffer.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process base64 image: ' + err.message });
  }
});

export default router;
