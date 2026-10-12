import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';

const router = Router();
router.use(authenticate);

// Admin: list all exams (with optional filters)
router.get('/admin/all', requireRole('admin', 'faculty'), async (req, res, next) => {
  try {
    await connectDB();
    const { department, year, semester, examType, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [exams, total] = await Promise.all([
      Exam.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Exam.countDocuments(filter),
    ]);
    res.json({ success: true, message: 'Exams fetched.', data: { exams, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Admin: list all results (with optional filters)
router.get('/results/all', requireRole('admin', 'faculty'), async (req, res, next) => {
  try {
    await connectDB();
    const { studentId, semester, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (semester) filter.semester = parseInt(semester);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate('studentId', 'name registrationNumber department year section')
        .populate('examId', 'examType subject date')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Result.countDocuments(filter),
    ]);
    res.json({ success: true, message: 'Results fetched.', data: { results, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Student: get upcoming exams
router.get('/', requireRole('student'), async (req, res, next) => {
  try {
    if (typeof req.user?.id === 'string' && req.user.id.startsWith('mock_')) {
      return res.json({
        success: true,
        message: 'Exams fetched (Demo Mode).',
        data: [
          { _id: 'mock_ex_01', name: 'Data Structures IA-2', subject: 'Data Structures & Algorithms', subjectCode: 'CS3301', date: new Date(Date.now() + 5 * 86400000), startTime: '10:00', duration: 90, room: 'Hall A', examType: 'internal' },
          { _id: 'mock_ex_02', name: 'Operating Systems IA-2', subject: 'Operating Systems', subjectCode: 'CS3302', date: new Date(Date.now() + 8 * 86400000), startTime: '10:00', duration: 90, room: 'Hall B', examType: 'internal' },
          { _id: 'mock_ex_03', name: 'Cloud Computing Semester', subject: 'Cloud Computing', subjectCode: 'CS3303', date: new Date(Date.now() + 20 * 86400000), startTime: '09:30', duration: 180, room: 'Main Aud', examType: 'semester' },
        ],
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    const now = new Date();
    const exams = await Exam.find({
      department: student.department,
      year: student.year,
      semester: student.semester,
      isPublished: true,
      date: { $gte: now },
    }).sort({ date: 1 }).lean();
    res.json({ success: true, message: 'Exams fetched.', data: exams });
  } catch (err) { next(err); }
});

// Student: get results
router.get('/results', requireRole('student'), async (req, res, next) => {
  try {
    if (typeof req.user?.id === 'string' && req.user.id.startsWith('mock_')) {
      return res.json({
        success: true,
        message: 'Results fetched (Demo Mode).',
        data: [
          { _id: 'mock_res_01', semester: 2, gpa: 8.75, cgpa: 8.6, subjects: [
            { subjectName: 'Python Programming', code: 'GE3151', grade: 'O', credits: 4, points: 10 },
            { subjectName: 'Digital Principles', code: 'EC3251', grade: 'A+', credits: 4, points: 9 },
            { subjectName: 'Engineering Math II', code: 'MA3251', grade: 'A', credits: 4, points: 8 },
          ]},
          { _id: 'mock_res_02', semester: 1, gpa: 8.45, cgpa: 8.45, subjects: [
            { subjectName: 'Professional English', code: 'HS3151', grade: 'A+', credits: 3, points: 9 },
            { subjectName: 'Matrices and Calculus', code: 'MA3151', grade: 'A', credits: 4, points: 8 },
            { subjectName: 'Engineering Physics', code: 'PH3151', grade: 'A+', credits: 3, points: 9 },
          ]},
        ],
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    const results = await Result.find({ studentId: student._id, isPublished: true })
      .populate('examId', 'examType subject date')
      .sort({ semester: -1 })
      .lean();
    res.json({ success: true, message: 'Results fetched.', data: results });
  } catch (err) { next(err); }
});

// Admin/Faculty: create exam
router.post('/', requireRole('admin', 'faculty'), async (req, res, next) => {
  try {
    await connectDB();
    const exam = await Exam.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Exam created.', data: exam });
  } catch (err) { next(err); }
});

// Admin: publish exam
router.patch('/:id/publish', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const exam = await Exam.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    res.json({ success: true, message: 'Exam published.', data: exam });
  } catch (err) { next(err); }
});

// Admin: post results
router.post('/results', requireRole('admin', 'faculty'), async (req, res, next) => {
  try {
    await connectDB();
    const result = await Result.create({ ...req.body, publishedBy: req.user.id });
    res.status(201).json({ success: true, message: 'Result added.', data: result });
  } catch (err) { next(err); }
});

// Admin: publish result
router.patch('/results/:id/publish', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const result = await Result.findByIdAndUpdate(req.params.id, { isPublished: true, publishedBy: req.user.id }, { new: true });
    res.json({ success: true, message: 'Result published.', data: result });
  } catch (err) { next(err); }
});

// Admin: delete exam
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Exam deleted.' });
  } catch (err) { next(err); }
});

export default router;
