import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import QuestionPaper from '../models/QuestionPaper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { questionPaperFileUpload } from './upload.js';
import { publicUploadUrl } from '../utils/uploads.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../uploads');
const DEMO_FILE_NAME = 'campushub-demo-cs3301-2024.pdf';
const DEMO_FILE_URL = `/uploads/${DEMO_FILE_NAME}`;

const DEMO_PAPERS = [
  { _id: 'demo-paper-cs3301-2024', department: 'CSE', subject: 'Data Structures & Algorithms', subjectCode: 'CS3301', semester: 3, year: 2024, academicYear: '2024-2025', examType: 'semester', fileName: DEMO_FILE_NAME, fileUrl: DEMO_FILE_URL, isActive: true },
  { _id: 'demo-paper-cs3302-2024', department: 'CSE', subject: 'Operating Systems', subjectCode: 'CS3302', semester: 3, year: 2024, academicYear: '2024-2025', examType: 'model', fileName: 'CS3302-Model2024.pdf', fileUrl: '/api/question-papers/demo-paper-cs3302-2024/file', isActive: true },
  { _id: 'demo-paper-cs3303-2023', department: 'CSE', subject: 'Database Management Systems', subjectCode: 'CS3303', semester: 3, year: 2023, academicYear: '2023-2024', examType: 'semester', fileName: 'CS3303-Nov2023-Semester.pdf', fileUrl: '/api/question-papers/demo-paper-cs3303-2023/file', isActive: true },
  { _id: 'demo-paper-cs3304-2024', department: 'CSE', subject: 'Computer Networks', subjectCode: 'CS3304', semester: 3, year: 2024, academicYear: '2024-2025', examType: 'internal', fileName: 'CS3304-Internal2024.pdf', fileUrl: '/api/question-papers/demo-paper-cs3304-2024/file', isActive: true },
];

// Students/All: filter and list question papers
router.get('/', async (req, res, next) => {
  try {
    const { department, subject, semester, year, examType, page = 1, limit = 20 } = req.query;
    if (!isDbConnected()) {
      try { await connectDB(); } catch {
        const papers = DEMO_PAPERS.filter((paper) =>
          (!department || paper.department === department) &&
          (!subject || paper.subject.toLowerCase().includes(String(subject).toLowerCase())) &&
          (!semester || paper.semester === Number(semester)) &&
          (!year || paper.year === Number(year)) &&
          (!examType || paper.examType === examType)
        );
        return res.json({ success: true, message: 'Question papers fetched (Demo Mode).', data: { papers, total: papers.length, page: Number(page), pages: Math.ceil(papers.length / Number(limit)) } });
      }
    }

    await connectDB();
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (semester) filter.semester = parseInt(semester);
    if (year) filter.year = parseInt(year);
    if (examType) filter.examType = examType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [papers, total] = await Promise.all([
      QuestionPaper.find(filter).select('-__v').sort({ year: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      QuestionPaper.countDocuments(filter),
    ]);
    res.json({ success: true, message: 'Question papers fetched.', data: { papers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Admin: upload question paper metadata (file URL from Cloudinary)
router.post('/', authenticate, requireRole('admin'), questionPaperFileUpload, async (req, res, next) => {
  try {
    await connectDB();
    const { department, subject, subjectCode, semester, year, academicYear, examType } = req.body;
    if (!req.file) return res.status(400).json({ success: false, code: 'QUESTION_PAPER_FILE_REQUIRED', message: 'Please upload a PDF question paper.' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ success: false, code: 'QUESTION_PAPER_PDF_REQUIRED', message: 'Only PDF question papers are allowed.' });
    const paper = await QuestionPaper.create({
      department, subject, subjectCode, semester: Number(semester), year: Number(year), academicYear, examType,
      fileUrl: publicUploadUrl(req.file), fileName: req.file.originalname, fileSize: req.file.size, uploadedBy: req.user.id,
    });
    res.status(201).json({ success: true, message: 'Question paper added.', data: paper });
  } catch (err) { next(err); }
});

// Increment download count
router.post('/:id/download', async (req, res, next) => {
  try {
    if (!isDbConnected()) return res.json({ success: true, message: 'Download recorded (Demo Mode).' });

    await connectDB();
    await QuestionPaper.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    res.json({ success: true, message: 'Download recorded.' });
  } catch (err) { next(err); }
});

router.get('/:id/file', async (req, res, next) => {
  try {
    if (req.params.id === 'demo-paper-cs3301-2024') {
      return sendLocalPaper(res, DEMO_FILE_NAME, 'CS3301-Nov2024-Semester.pdf', req.query.download === '1');
    }

    if (!isDbConnected()) {
      try { await connectDB(); } catch {
        return res.status(404).json({ success: false, message: 'Question paper file not found.' });
      }
    }
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Question paper file not found.' });
    }
    const paper = await QuestionPaper.findOne({ _id: req.params.id, isActive: true }).select('fileUrl fileName').lean();
    if (!paper?.fileUrl) return res.status(404).json({ success: false, message: 'Question paper file not found.' });
    if (paper.fileUrl.startsWith('/uploads/')) {
      return sendLocalPaper(res, paper.fileUrl, paper.fileName, req.query.download === '1');
    }
    if (!/^https?:\/\//i.test(paper.fileUrl)) {
      return res.status(404).json({ success: false, message: 'Question paper file not found.' });
    }
    res.setHeader('Content-Disposition', `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${path.basename(paper.fileName || new URL(paper.fileUrl).pathname)}"`);
    res.redirect(paper.fileUrl);
  } catch (err) { next(err); }
});

function sendLocalPaper(res, fileReference, downloadName, shouldDownload) {
  const fileName = path.basename(fileReference);
  const filePath = path.resolve(uploadDir, fileName);
  if (!filePath.startsWith(`${uploadDir}${path.sep}`)) {
    return res.status(404).json({ success: false, message: 'Question paper file not found.' });
  }
  const resolvedPath = fs.existsSync(filePath)
    ? filePath
    : path.resolve(uploadDir, DEMO_FILE_NAME);
  if (!fs.existsSync(resolvedPath)) return res.status(404).json({ success: false, message: 'Question paper file not found.' });

  res.type(path.extname(resolvedPath));
  res.setHeader('Content-Disposition', `${shouldDownload ? 'attachment' : 'inline'}; filename="${path.basename(downloadName || fileName)}"`);
  return res.sendFile(resolvedPath);
}

// Admin: remove
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    await QuestionPaper.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Question paper removed.' });
  } catch (err) { next(err); }
});

export default router;
