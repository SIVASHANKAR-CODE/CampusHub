import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth.js';
import { publicUploadUrl } from '../utils/uploads.js';
import { saveUploadedFile, getStoredFile } from '../services/storageService.js';

const storage = multer.memoryStorage();

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

async function persistReqFile(req, folder = 'uploads') {
  if (!req.file || !req.file.buffer) return;
  const saved = await saveUploadedFile({
    buffer: req.file.buffer,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user?.id,
    folder,
  });
  req.file.filename = saved.filename;
  req.file.url = saved.url;
  req.file.provider = saved.provider;
}

export const complaintImageUpload = (req, res, next) => {
  complaintUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }])(req, res, async (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files['photo']?.[0] || req.files['file']?.[0] || null;
    }
    if (req.file) {
      try {
        await persistReqFile(req, 'complaints');
      } catch (persistErr) {
        return next(persistErr);
      }
    }
    next();
  });
};

export const fileUpload = (req, res, next) => {
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'document', maxCount: 1 }, { name: 'photo', maxCount: 1 }])(req, res, async (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files['file']?.[0] || req.files['document']?.[0] || req.files['photo']?.[0] || null;
    }
    if (req.file) {
      try {
        await persistReqFile(req, 'general');
      } catch (persistErr) {
        return next(persistErr);
      }
    }
    next();
  });
};

export const questionPaperFileUpload = (req, res, next) => {
  questionPaperUpload.single('file')(req, res, async (err) => {
    if (err) return next(err);
    if (req.file) {
      try {
        await persistReqFile(req, 'question-papers');
      } catch (persistErr) {
        return next(persistErr);
      }
    }
    next();
  });
};

const router = Router();

// Public / Authenticated retrieval of stored files by filename
router.get('/file/:filename', async (req, res) => {
  try {
    const file = await getStoredFile(req.params.filename);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.end(file.buffer);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve file.' });
  }
});

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
      provider: req.file.provider || 'mongodb',
    },
  });
});

// Base64 image upload (e.g. from camera capture)
router.post('/base64', async (req, res) => {
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

    const saved = await saveUploadedFile({
      buffer,
      originalname: `${name}.${ext}`,
      mimetype: mime,
      size: buffer.length,
      uploadedBy: req.user?.id,
      folder: 'camera',
    });

    res.status(201).json({
      success: true,
      message: 'Image captured and saved successfully.',
      data: {
        url: saved.url,
        filename: saved.filename,
        size: buffer.length,
        provider: saved.provider,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process base64 image: ' + err.message });
  }
});

export default router;
