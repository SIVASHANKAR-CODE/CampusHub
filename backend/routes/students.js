import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getStudentDashboard } from '../controllers/studentController.js';
import { connectDB } from '../config/db.js';
import Student from '../models/Student.js';
import { createAuditLog } from '../services/auditService.js';
import { sanitizeStoredFileUrl } from '../utils/uploads.js';

const router = Router();
router.use(authenticate);

// Student: get own dashboard
router.get('/dashboard', requireRole('student'), getStudentDashboard);

// Student: get own profile
router.get('/profile', requireRole('student'), async (req, res, next) => {
  try {
    await connectDB();
    const student = await Student.findOne({ userId: req.user.id })
      .populate('mentorId', 'name email phone department designation')
      .lean();
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({
      success: true,
      message: 'Profile fetched.',
      data: {
        ...student,
        regNo: student.regNo || student.registrationNumber,
        registrationNumber: student.registrationNumber || student.regNo,
      },
    });
  } catch (err) { next(err); }
});

// Student: update own profile (e.g. photo, contact)
router.patch('/profile', requireRole('student'), async (req, res, next) => {
  try {
    await connectDB();
    const allowed = ['photoUrl', 'phone', 'parentPhone', 'address', 'bloodGroup', 'gender', 'dateOfBirth'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (Object.prototype.hasOwnProperty.call(updates, 'photoUrl')) {
      const safePhoto = sanitizeStoredFileUrl(updates.photoUrl);
      if (updates.photoUrl && !safePhoto) {
        return res.status(400).json({ success: false, message: 'Profile photo must be an uploaded image from this app.' });
      }
      updates.photoUrl = safePhoto || '';
    }
    const student = await Student.findOneAndUpdate({ userId: req.user.id }, updates, { new: true })
      .populate('mentorId', 'name email phone department designation');
    if (!student) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        ...student.toObject(),
        regNo: student.regNo || student.registrationNumber,
        registrationNumber: student.registrationNumber || student.regNo,
      },
    });
  } catch (err) { next(err); }
});

// Admin: get student by registration number
router.get('/by-registration/:registrationNumber', requireRole('admin', 'faculty', 'mentor'), async (req, res, next) => {
  try {
    await connectDB();
    const reg = req.params.registrationNumber.trim();
    const student = await Student.findOne({
      $or: [{ regNo: reg }, { registrationNumber: reg }],
    }).populate('mentorId', 'name email phone department').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({
      success: true,
      message: 'Student fetched.',
      data: {
        ...student,
        regNo: student.regNo || student.registrationNumber,
        registrationNumber: student.registrationNumber || student.regNo,
      },
    });
  } catch (err) { next(err); }
});

// Admin: list all students
router.get('/', requireRole('admin', 'mentor', 'faculty'), async (req, res, next) => {
  try {
    await connectDB();
    const { dept, year, section, hostelStatus, q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (dept) filter.department = dept;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
    if (hostelStatus) filter.hostelStatus = hostelStatus;
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { regNo: { $regex: q, $options: 'i' } },
      { registrationNumber: { $regex: q, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter).select('-__v').sort({ regNo: 1, name: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      Student.countDocuments(filter),
    ]);
    const formatted = students.map(s => ({
      ...s,
      regNo: s.regNo || s.registrationNumber,
      registrationNumber: s.registrationNumber || s.regNo,
    }));
    res.json({ success: true, message: 'Students fetched.', data: { students: formatted, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Admin: search students by name or regNo (for fees page)
router.get('/search', requireRole('admin', 'faculty', 'mentor'), async (req, res, next) => {
  try {
    await connectDB();
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });
    const students = await Student.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { regNo: { $regex: q, $options: 'i' } },
        { registrationNumber: { $regex: q, $options: 'i' } },
      ],
      isActive: true,
    }).select('_id name regNo registrationNumber department year section semester hostelStatus photoUrl phone')
      .limit(20).lean();
    const formatted = students.map(s => ({
      ...s,
      regNo: s.regNo || s.registrationNumber,
      registrationNumber: s.registrationNumber || s.regNo,
    }));
    res.json({ success: true, message: 'Students found.', data: formatted });
  } catch (err) { next(err); }
});

// Admin: update student (including hostelStatus)
router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const allowedFields = ['hostelStatus', 'transportEligible', 'mentorId', 'year', 'semester', 'section', 'name', 'phone', 'parentPhone', 'address'];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (req.body.hostelStatus !== undefined) {
      await createAuditLog({
        actor: req.user.id, actorEmail: req.user.email, actorRole: 'admin',
        action: 'UPDATE_HOSTEL_STATUS',
        resource: 'Student', resourceId: student._id,
        description: `Admin changed hostel status to ${req.body.hostelStatus}`,
        before: { hostelStatus: student.hostelStatus }, after: { hostelStatus: req.body.hostelStatus }, req,
      });
    }

    res.json({ success: true, message: 'Student updated.', data: student });
  } catch (err) { next(err); }
});

export default router;
