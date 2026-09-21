import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import Timetable from '../models/Timetable.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

const router = Router();
router.use(authenticate);

// Student: get own class timetable
router.get('/', requireRole('student'), async (req, res, next) => {
  try {
    const isMockUser = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      return res.json({
        success: true,
        message: 'Timetable fetched (Demo Mode).',
        data: {
          department: 'CSE', year: 2, semester: 3, section: 'A',
          slots: days.flatMap(day => [
            { day, period: 1, startTime: '09:00', endTime: '10:00', subject: 'Data Structures & Algorithms', facultyName: 'Dr. Rajesh Sharma', room: 'CS-204' },
            { day, period: 2, startTime: '10:00', endTime: '11:00', subject: 'Operating Systems', facultyName: 'Dr. Priya Raman', room: 'CS-205' },
            { day, period: 3, startTime: '11:15', endTime: '12:15', subject: 'Cloud Computing', facultyName: 'Prof. Ananya Sen', room: 'CS-301' },
            { day, period: 4, startTime: '01:30', endTime: '03:30', subject: 'Data Structures Lab', facultyName: 'Dr. Rajesh Sharma', room: 'Computing Lab 2' },
          ])
        },
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    const tt = await Timetable.findOne({
      department: student.department, year: student.year,
      semester: student.semester, section: student.section, isActive: true,
    }).lean();
    res.json({ success: true, message: 'Timetable fetched.', data: tt });
  } catch (err) { next(err); }
});

// Faculty: get own teaching timetable (slots where facultyId = this faculty)
router.get('/faculty', requireRole('faculty'), async (req, res, next) => {
  try {
    const isMockUser = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser) {
      const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = DAYS[new Date().getDay()];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      if (!days.includes(today)) days.push(today);

      const mockSlots = days.flatMap(d => [
        { day: d, period: 1, startTime: '09:00', endTime: '10:00', subject: 'Data Structures & Algorithms', department: 'CSE', year: 2, section: 'A', room: 'CS-204' },
        { day: d, period: 3, startTime: '11:15', endTime: '12:15', subject: 'Advanced Algorithms', department: 'CSE', year: 3, section: 'B', room: 'CS-302' },
        { day: d, period: 4, startTime: '01:30', endTime: '03:30', subject: 'DS & Algo Lab', department: 'CSE', year: 2, section: 'A', room: 'Lab 2' },
      ]);

      return res.json({
        success: true,
        message: 'Teaching timetable fetched (Demo Mode).',
        data: mockSlots,
      });
    }

    await connectDB();
    const faculty = await Faculty.findOne({ userId: req.user.id }).lean();
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found.' });
    const tts = await Timetable.find({ 'slots.facultyId': faculty._id, isActive: true }).lean();
    // Flatten slots with timetable metadata
    const flatSlots = tts.flatMap(t => (t.slots || []).filter(s => s.facultyId?.toString() === faculty._id.toString()).map(s => ({
      ...s, department: t.department, year: t.year, section: t.section, semester: t.semester
    })));
    res.json({ success: true, message: 'Teaching timetable fetched.', data: flatSlots });
  } catch (err) { next(err); }
});

// Admin: create/update timetable
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const { department, year, semester, section, academicYear, effectiveFrom, slots } = req.body;
    const tt = await Timetable.findOneAndUpdate(
      { department, year, semester, section, academicYear },
      { slots, effectiveFrom: new Date(effectiveFrom), isActive: true, createdBy: req.user.id },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Timetable saved.', data: tt });
  } catch (err) { next(err); }
});

// Admin: list all timetables
router.get('/all', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const { department, year, semester, section } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);
    if (section) filter.section = section;
    const timetables = await Timetable.find(filter)
      .sort({ department: 1, year: 1, section: 1 }).lean();
    res.json({ success: true, message: 'Timetables fetched.', data: timetables });
  } catch (err) { next(err); }
});

// Admin: delete timetable
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Timetable deleted.' });
  } catch (err) { next(err); }
});

export default router;
