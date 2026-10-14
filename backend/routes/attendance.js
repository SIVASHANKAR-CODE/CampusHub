import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

const router = Router();
router.use(authenticate);

// Standard 8 periods schedule definition
export const PERIOD_SCHEDULE = [
  { period: 1, startTime: '09:00', endTime: '09:55', defaultSubject: 'Data Structures & Algorithms', defaultCode: 'CS3301' },
  { period: 2, startTime: '09:55', endTime: '10:50', defaultSubject: 'Operating Systems', defaultCode: 'CS3302' },
  { period: 3, startTime: '11:10', endTime: '12:05', defaultSubject: 'Cloud Computing', defaultCode: 'CS3303' },
  { period: 4, startTime: '12:05', endTime: '01:00', defaultSubject: 'Computer Networks', defaultCode: 'CS3304' },
  { period: 5, startTime: '01:50', endTime: '02:45', defaultSubject: 'Database Management Systems', defaultCode: 'CS3305' },
  { period: 6, startTime: '02:45', endTime: '03:40', defaultSubject: 'Advanced Algorithms', defaultCode: 'CS3306' },
  { period: 7, startTime: '03:50', endTime: '04:40', defaultSubject: 'DS & Algo Lab (Session 1)', defaultCode: 'CS3311' },
  { period: 8, startTime: '04:40', endTime: '05:30', defaultSubject: 'DS & Algo Lab (Session 2)', defaultCode: 'CS3311' },
];

// Fallback mock students roster for demo/offline mode
const MOCK_CLASS_STUDENTS = [
  { _id: 'mock_st_001', name: 'Aarav Patel', regNo: '2026CSE001', registrationNumber: '2026CSE001', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_002', name: 'Priya Nair', regNo: '2026CSE002', registrationNumber: '2026CSE002', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_003', name: 'Rohan Gupta', regNo: '2026CSE003', registrationNumber: '2026CSE003', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_004', name: 'Sneha Reddy', regNo: '2026CSE004', registrationNumber: '2026CSE004', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_005', name: 'Vikram Verma', regNo: '2026CSE005', registrationNumber: '2026CSE005', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_006', name: 'Ananya Iyer', regNo: '2026CSE006', registrationNumber: '2026CSE006', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_007', name: 'Siddharth Joshi', regNo: '2026CSE007', registrationNumber: '2026CSE007', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_008', name: 'Divya Menon', regNo: '2026CSE008', registrationNumber: '2026CSE008', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_009', name: 'Karthik Raja', regNo: '2026CSE009', registrationNumber: '2026CSE009', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_010', name: 'Meera Nambiar', regNo: '2026CSE010', registrationNumber: '2026CSE010', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_011', name: 'Aditya Kulkarni', regNo: '2026CSE011', registrationNumber: '2026CSE011', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_012', name: 'Pooja Hegde', regNo: '2026CSE012', registrationNumber: '2026CSE012', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_013', name: 'Varun Sharma', regNo: '2026CSE013', registrationNumber: '2026CSE013', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_014', name: 'Tanvi Shah', regNo: '2026CSE014', registrationNumber: '2026CSE014', department: 'CSE', year: 2, semester: 3, section: 'A' },
  { _id: 'mock_st_015', name: 'Naveen Kumar', regNo: '2026CSE015', registrationNumber: '2026CSE015', department: 'CSE', year: 2, semester: 3, section: 'A' },
];

// In-memory attendance storage for demo mode
// Map key: `${studentId}__${dateStr}__${period}` => { status, subject, subjectCode, period, date, department, year, section }
const mockAttendanceMap = new Map();

// Helper to format date string YYYY-MM-DD
function getDateKey(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  return d.toISOString().split('T')[0];
}

// Pre-seed some mock records for today
(function seedMockPeriods() {
  const today = getDateKey();
  // Pre-seed Period 1 as completed for demonstration
  MOCK_CLASS_STUDENTS.forEach((st, idx) => {
    const status = idx === 3 ? 'absent' : idx === 8 ? 'od' : 'present';
    const key = `${st._id}__${today}__1`;
    mockAttendanceMap.set(key, {
      studentId: st._id,
      date: today,
      period: 1,
      status,
      subject: 'Data Structures & Algorithms',
      subjectCode: 'CS3301',
      department: 'CSE',
      year: 2,
      semester: 3,
      section: 'A',
      markedBy: 'mock_faculty_001',
    });
  });
})();

// Student: get own overall attendance summary
router.get('/', requireRole('student'), async (req, res, next) => {
  try {
    const isMock = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      // Calculate demo stats
      const studentId = 'mock_st_001';
      const studentRecords = Array.from(mockAttendanceMap.values()).filter(r => r.studentId === studentId);
      
      const defaultSubjects = [
        { subject: 'Data Structures & Algorithms', subjectCode: 'CS3301', present: 28, absent: 2, total: 30, percentage: 93.3, belowThreshold: false, classesNeededFor80: 0 },
        { subject: 'Operating Systems', subjectCode: 'CS3302', present: 26, absent: 4, total: 30, percentage: 86.7, belowThreshold: false, classesNeededFor80: 0 },
        { subject: 'Cloud Computing', subjectCode: 'CS3303', present: 22, absent: 6, total: 28, percentage: 78.6, belowThreshold: true, classesNeededFor80: 2 },
        { subject: 'Database Management Systems', subjectCode: 'CS3305', present: 27, absent: 1, total: 28, percentage: 96.4, belowThreshold: false, classesNeededFor80: 0 },
        { subject: 'Advanced Algorithms', subjectCode: 'CS3306', present: 25, absent: 3, total: 28, percentage: 89.3, belowThreshold: false, classesNeededFor80: 0 },
        { subject: 'DS & Algo Lab', subjectCode: 'CS3311', present: 14, absent: 1, total: 15, percentage: 93.3, belowThreshold: false, classesNeededFor80: 0 },
      ];

      const totalPresent = defaultSubjects.reduce((acc, s) => acc + s.present, 0);
      const totalClasses = defaultSubjects.reduce((acc, s) => acc + s.total, 0);
      const overall = totalClasses > 0 ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(1)) : 0;

      return res.json({
        success: true,
        message: 'Attendance fetched (Demo Mode).',
        data: {
          subjects: defaultSubjects,
          overall,
          totalPresent,
          totalClasses,
        },
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const records = await Attendance.aggregate([
      { $match: { studentId: student._id } },
      { $group: {
        _id: { subject: '$subject', subjectCode: '$subjectCode' },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'od', 'leave']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
      }},
    ]);

    const subjects = records.map((r) => ({
      subject: r._id.subject,
      subjectCode: r._id.subjectCode,
      present: r.present,
      absent: r.absent,
      total: r.total,
      percentage: r.total > 0 ? parseFloat(((r.present / r.total) * 100).toFixed(1)) : 0,
      belowThreshold: r.total > 0 && (r.present / r.total) * 100 < 80,
      classesNeededFor80: Math.max(0, Math.ceil((0.8 * r.total - r.present) / 0.2)),
    }));

    const totalPresent = subjects.reduce((s, r) => s + r.present, 0);
    const totalClasses = subjects.reduce((s, r) => s + r.total, 0);
    const overallPercentage = totalClasses > 0 ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(1)) : 0;

    res.json({ success: true, message: 'Attendance fetched.', data: { subjects, overall: overallPercentage, totalPresent, totalClasses } });
  } catch (err) { next(err); }
});

// Student: get period-by-period daily log for a specific date
router.get('/daily', requireRole('student', 'faculty', 'mentor', 'admin'), async (req, res, next) => {
  try {
    const queryDateStr = getDateKey(req.query.date);
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');

    if (isMock || !isDbConnected()) {
      const studentId = req.query.studentId || 'mock_st_001';
      
      const dailyPeriods = PERIOD_SCHEDULE.map(slot => {
        const key = `${studentId}__${queryDateStr}__${slot.period}`;
        const record = mockAttendanceMap.get(key);

        return {
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: record?.subject || slot.defaultSubject,
          subjectCode: record?.subjectCode || slot.defaultCode,
          status: record ? record.status : (slot.period === 1 ? 'present' : 'not_marked'),
          isMarked: Boolean(record || slot.period === 1),
          date: queryDateStr,
        };
      });

      return res.json({
        success: true,
        message: 'Daily period attendance fetched (Demo Mode).',
        data: {
          date: queryDateStr,
          periods: dailyPeriods,
        },
      });
    }

    await connectDB();
    let studentId = req.query.studentId;
    if (!studentId && req.user.role === 'student') {
      const st = await Student.findOne({ userId: req.user.id }).lean();
      if (st) studentId = st._id;
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId could not be determined.' });
    }

    const startOfDay = new Date(queryDateStr);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const dbRecords = await Attendance.find({
      studentId,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).lean();

    const recordByPeriod = {};
    dbRecords.forEach(r => { recordByPeriod[r.period] = r; });

    const dailyPeriods = PERIOD_SCHEDULE.map(slot => {
      const record = recordByPeriod[slot.period];
      return {
        period: slot.period,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: record?.subject || slot.defaultSubject,
        subjectCode: record?.subjectCode || slot.defaultCode,
        status: record?.status || 'not_marked',
        isMarked: Boolean(record),
        date: queryDateStr,
      };
    });

    res.json({
      success: true,
      message: 'Daily period attendance fetched.',
      data: { date: queryDateStr, periods: dailyPeriods },
    });
  } catch (err) { next(err); }
});

// Faculty: get student list for a class (to mark attendance)
router.get('/class', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const { department, year, section, semester } = req.query;
    if (!department || !year || !section) {
      return res.status(400).json({ success: false, message: 'department, year, and section are required.' });
    }

    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');

    if (isMock || !isDbConnected()) {
      const filtered = MOCK_CLASS_STUDENTS.map(s => ({
        ...s,
        department: department || s.department,
        year: parseInt(year) || s.year,
        section: section || s.section,
        semester: semester ? parseInt(semester) : s.semester,
      }));
      return res.json({ success: true, message: 'Class students fetched (Demo Mode).', data: filtered });
    }

    await connectDB();
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (year) filter.year = parseInt(year);
    if (section) filter.section = section;
    if (semester) filter.semester = parseInt(semester);

    const students = await Student.find(filter)
      .select('_id name regNo registrationNumber year section department semester')
      .sort({ name: 1 }).lean();

    if (students.length === 0) {
      // Fallback to mock students if database has no records for this section yet
      return res.json({ success: true, message: 'Class students fetched (Demo Fallback).', data: MOCK_CLASS_STUDENTS });
    }

    const formatted = students.map((s) => ({
      ...s,
      regNo: s.regNo || s.registrationNumber,
      registrationNumber: s.registrationNumber || s.regNo,
    }));
    res.json({ success: true, message: 'Class students fetched.', data: formatted });
  } catch (err) {
    // If DB error occurs, gracefully fallback to mock roster
    res.json({ success: true, message: 'Class students fetched (Fallback).', data: MOCK_CLASS_STUDENTS });
  }
});

// Faculty: get existing attendance records for a specific class + date + period
router.get('/class/records', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const { subject, date, department, year, section, period } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required.' });
    }
    const queryPeriod = period ? parseInt(period) : 1;
    const dateStr = getDateKey(date);
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');

    if (isMock || !isDbConnected()) {
      const statusMap = {};
      mockAttendanceMap.forEach((rec, key) => {
        if (rec.date === dateStr && rec.period === queryPeriod) {
          if (!department || rec.department === department) {
            if (!section || rec.section === section) {
              statusMap[rec.studentId] = rec.status;
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Attendance records fetched (Demo Mode).',
        data: statusMap,
      });
    }

    await connectDB();
    const markDate = new Date(date);
    markDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(markDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const queryFilter = {
      date: { $gte: markDate, $lt: nextDay },
      period: queryPeriod,
      ...(department && { department }),
      ...(year && { year: parseInt(year) }),
      ...(section && { section }),
    };
    if (subject) queryFilter.subject = subject;

    const records = await Attendance.find(queryFilter).select('studentId status').lean();

    const statusMap = {};
    records.forEach(r => { statusMap[r.studentId.toString()] = r.status; });

    res.json({ success: true, message: 'Attendance records fetched.', data: statusMap });
  } catch (err) {
    // Return empty status map gracefully on connection failure
    res.json({ success: true, message: 'Attendance records fetched (Empty).', data: {} });
  }
});

// Faculty: get summary of all periods (1 to 8) for a class + date
router.get('/class/periods-summary', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const { date, department, year, section } = req.query;
    const dateStr = getDateKey(date);
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');

    if (isMock || !isDbConnected()) {
      const summary = PERIOD_SCHEDULE.map(slot => {
        let presentCount = 0;
        let absentCount = 0;
        let isMarked = false;
        let subjectName = slot.defaultSubject;

        mockAttendanceMap.forEach((rec) => {
          if (rec.date === dateStr && rec.period === slot.period) {
            isMarked = true;
            subjectName = rec.subject || subjectName;
            if (rec.status === 'present' || rec.status === 'od') presentCount++;
            else if (rec.status === 'absent') absentCount++;
          }
        });

        return {
          period: slot.period,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: subjectName,
          isMarked,
          presentCount,
          absentCount,
          totalCount: presentCount + absentCount,
        };
      });

      return res.json({ success: true, message: 'Periods summary fetched (Demo Mode).', data: summary });
    }

    await connectDB();
    const markDate = new Date(dateStr);
    markDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(markDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const records = await Attendance.find({
      date: { $gte: markDate, $lt: nextDay },
      ...(department && { department }),
      ...(year && { year: parseInt(year) }),
      ...(section && { section }),
    }).lean();

    const summary = PERIOD_SCHEDULE.map(slot => {
      const periodRecords = records.filter(r => r.period === slot.period);
      const isMarked = periodRecords.length > 0;
      const presentCount = periodRecords.filter(r => ['present', 'od', 'leave'].includes(r.status)).length;
      const absentCount = periodRecords.filter(r => r.status === 'absent').length;

      return {
        period: slot.period,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: periodRecords[0]?.subject || slot.defaultSubject,
        isMarked,
        presentCount,
        absentCount,
        totalCount: periodRecords.length,
      };
    });

    res.json({ success: true, message: 'Periods summary fetched.', data: summary });
  } catch (err) { next(err); }
});

// Faculty: mark attendance for a class for a specific period
router.post('/mark', requireRole('faculty', 'admin'), async (req, res, next) => {
  try {
    const { subject, subjectCode, date, records, department, year, semester, section, period } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Records array is required.' });
    }

    const assignedPeriod = period ? parseInt(period) : 1;
    const dateStr = getDateKey(date);
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');

    if (isMock || !isDbConnected()) {
      // Save directly into in-memory store
      records.forEach(({ studentId, status }) => {
        const key = `${studentId}__${dateStr}__${assignedPeriod}`;
        mockAttendanceMap.set(key, {
          studentId,
          date: dateStr,
          period: assignedPeriod,
          status,
          subject,
          subjectCode,
          department,
          year: Number(year),
          semester: Number(semester),
          section,
          markedBy: req.user?.id || 'mock_faculty_001',
          updatedAt: new Date(),
        });
      });

      return res.json({
        success: true,
        message: `Attendance marked for Period ${assignedPeriod} (${records.length} students recorded).`,
        data: {
          period: assignedPeriod,
          count: records.length,
          date: dateStr,
        },
      });
    }

    await connectDB();
    const markDate = new Date(dateStr);
    markDate.setUTCHours(0, 0, 0, 0);

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: { studentId, date: markDate, period: assignedPeriod },
        update: {
          $set: {
            status,
            markedBy: req.user.id,
            subject,
            subjectCode,
            department,
            year: Number(year),
            semester: Number(semester),
            section,
            period: assignedPeriod,
          }
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(ops);
    res.json({
      success: true,
      message: `Attendance marked for Period ${assignedPeriod} (${result.upsertedCount + result.modifiedCount} students updated).`,
      data: {
        period: assignedPeriod,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (err) { next(err); }
});

// Mentor: view attendance for assigned student
router.get('/student/:studentId', requireRole('mentor', 'admin', 'faculty'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      const studentId = req.params.studentId;
      const records = Array.from(mockAttendanceMap.values()).filter(r => r.studentId === studentId);
      return res.json({ success: true, message: 'Attendance fetched (Demo Mode).', data: records });
    }

    await connectDB();
    const records = await Attendance.find({ studentId: req.params.studentId })
      .sort({ date: -1, period: 1 }).lean();
    res.json({ success: true, message: 'Attendance fetched.', data: records });
  } catch (err) { next(err); }
});

export default router;
