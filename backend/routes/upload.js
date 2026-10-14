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
      if (req.accepts('html') && !req.xhr && !req.query.json && req.headers['sec-fetch-dest'] === 'document') {
        const frontendUrl = process.env.FRONTEND_URL || 'https://campushub-seven-eta.vercel.app';
        return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proof Image Unavailable — CampusHub</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px 32px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); text-align: center; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 9999px; padding: 4px 14px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    h1 { margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #fff; }
    p { margin: 0 0 20px; color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .file-tag { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 4px 8px; font-family: monospace; font-size: 12px; color: #cbd5e1; word-break: break-all; display: inline-block; margin-bottom: 20px; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
    .btn:hover { background: #2563eb; }
    .subtext { margin-top: 18px; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">⚠ Proof Image Unavailable</div>
    <h1>Attachment File Not Found</h1>
    <div class="file-tag">${req.params.filename || 'Requested file'}</div>
    <p>This image was uploaded prior to persistent cloud storage integration and is no longer available in serverless storage. The complaint record remains intact in CampusHub.</p>
    <a href="${frontendUrl}/student/complaints" class="btn">Return to CampusHub</a>
    <div class="subtext">If this proof is essential, please submit a replacement image or contact campus administration.</div>
  </div>
</body>
</html>`);
      }
      return res.status(404).json({ success: false, code: 'FILE_NOT_FOUND', message: 'File not found or no longer available.' });
    }

    if (file.cloudinaryUrl) {
      return res.redirect(302, file.cloudinaryUrl);
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (file.updatedAt) {
      res.setHeader('Last-Modified', new Date(file.updatedAt).toUTCString());
    }
    return res.status(200).type(file.mimetype || 'image/jpeg').send(file.buffer);
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
