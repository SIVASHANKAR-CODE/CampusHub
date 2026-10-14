import { connectDB } from '../config/db.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Fee from '../models/Fee.js';
import LeaveApplication from '../models/LeaveApplication.js';
import ODApplication from '../models/ODApplication.js';
import Announcement from '../models/Announcement.js';
import CampusEvent from '../models/CampusEvent.js';
import Notification from '../models/Notification.js';
import Complaint from '../models/Complaint.js';
import Timetable from '../models/Timetable.js';

/**
 * GET /api/students/dashboard
 * Aggregates all dashboard data for the logged-in student in efficient queries
 */
export async function getStudentDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    // Guard: mock demo users (offline mode) don't have real DB ObjectIds
    const isMockUser = typeof userId === 'string' && userId.startsWith('mock_');
    if (isMockUser) {
      return res.json({
        success: true,
        message: 'Dashboard data loaded (Demo Mode — seed DB for live data).',
        data: {
          student: {
            name: 'Aarav Patel (Demo)',
            regNo: 'DEMO001',
            department: 'CSE',
            year: 2,
            semester: 3,
            section: 'A',
            hostelStatus: 'hosteller',
            transportEligible: true,
          },
          attendance: {
            subjects: [
              { subject: 'Data Structures & Algorithms', present: 38, total: 45, percentage: 84, belowThreshold: false },
              { subject: 'Operating Systems', present: 28, total: 40, percentage: 70, belowThreshold: true },
              { subject: 'Cloud Computing', present: 35, total: 38, percentage: 92, belowThreshold: false },
            ],
            overall: 82,
            totalPresent: 101,
            totalClasses: 123,
          },
          fees: { totalFee: 75000, paidAmount: 40000, dueAmount: 35000, status: 'partial', semester: 3, academicYear: '2025-2026' },
          upcomingExams: [
            { name: 'Data Structures IA-2', subjectCode: 'CS8401', date: new Date(Date.now() + 7 * 86400000), type: 'internal' },
            { name: 'OS End Semester', subjectCode: 'CS8402', date: new Date(Date.now() + 21 * 86400000), type: 'semester' },
          ],
          todayTimetable: [
            { period: 1, subject: 'Data Structures & Algorithms', facultyName: 'Dr. Rajesh Sharma', room: 'CS-204', startTime: '09:00', endTime: '10:00' },
            { period: 2, subject: 'Operating Systems', facultyName: 'Dr. Priya Raman', room: 'CS-205', startTime: '10:00', endTime: '11:00' },
          ],
          pendingApplications: { leave: 1, od: 0 },
          announcements: [
            { title: 'Semester Registration Open', category: 'academic', publishedAt: new Date(), priority: 1 },
            { title: 'Cultural Fest — GalaXY 2026', category: 'event', publishedAt: new Date(), priority: 0 },
          ],
          upcomingEvents: [],
          unreadNotifications: 2,
          recentComplaints: [],
        },
      });
    }

    await connectDB();
    // 1. Get student profile
    const student = await Student.findOne({ userId }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found. Please run npm run seed.' });
    }

    const studentId = student._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

    // Run all queries in parallel
    const [
      attendanceRecords,
      feeRecord,
      upcomingExams,
      timetable,
      pendingLeave,
      pendingOD,
      announcements,
      upcomingEvents,
      unreadNotifications,
      recentComplaints,
    ] = await Promise.all([
      // Attendance — all records for this student
      Attendance.aggregate([
        { $match: { studentId } },
        {
          $group: {
            _id: '$subject',
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $in: ['$status', ['present', 'od', 'leave']] }, 1, 0] }
            },
          },
        },
      ]),
      // Fees — current semester
      Fee.findOne({ studentId, semester: student.semester }).lean(),
      // Upcoming exams — next 14 days
      Exam.find({
        department: student.department,
        year: student.year,
        semester: student.semester,
        date: { $gte: today, $lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) },
        isPublished: true,
      }).sort({ date: 1 }).limit(5).lean(),
      // Today's timetable
      Timetable.findOne({
        department: student.department,
        year: student.year,
        semester: student.semester,
        section: student.section,
        isActive: true,
      }).lean(),
      // Pending leave count
      LeaveApplication.countDocuments({ studentId, status: 'pending' }),
      // Pending OD count
      ODApplication.countDocuments({ studentId, status: 'pending' }),
      // Latest announcements (audience-filtered)
      Announcement.find({
        isPublished: true,
        publishedAt: { $lte: new Date() },
        $or: [
          { 'audience.type': 'everyone' },
          { 'audience.type': 'department', 'audience.department': student.department },
          { 'audience.type': 'year', 'audience.year': student.year },
          { 'audience.type': 'section', 'audience.section': student.section },
          { 'audience.type': 'hostellers', ...(student.hostelStatus === 'hosteller' ? {} : { _id: null }) },
          { 'audience.type': 'day_scholars', ...(student.hostelStatus === 'day_scholar' ? {} : { _id: null }) },
        ],
      }).sort({ priority: -1, publishedAt: -1 }).limit(5).lean(),
      // Upcoming events — next 30 days
      CampusEvent.find({
        isPublished: true,
        date: { $gte: today, $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) },
      }).sort({ date: 1 }).limit(4).lean(),
      // Unread notification count
      Notification.countDocuments({ userId, read: false }),
      // Recent complaints (last 3)
      Complaint.find({ studentId }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

    // Calculate attendance summary
    let totalPresent = 0, totalClasses = 0;
    const subjects = attendanceRecords.map((s) => {
      const percentage = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
      totalPresent += s.present;
      totalClasses += s.total;
      return {
        subject: s._id,
        present: s.present,
        total: s.total,
        percentage,
        belowThreshold: percentage < 80 && s.total > 0,
      };
    });
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    // Today's slots from timetable
    const todaySlots = timetable?.slots?.filter((s) => s.day === dayName) || [];

    res.json({
      success: true,
      message: 'Dashboard data loaded successfully.',
      data: {
        student,
        attendance: { subjects, overall: overallPercentage, totalPresent, totalClasses },
        fees: feeRecord,
        upcomingExams,
        todayTimetable: todaySlots,
        pendingApplications: { leave: pendingLeave, od: pendingOD },
        announcements,
        upcomingEvents,
        unreadNotifications,
        recentComplaints,
      },
    });
  } catch (err) {
    next(err);
  }
}
