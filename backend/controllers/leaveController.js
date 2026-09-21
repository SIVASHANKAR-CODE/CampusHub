import { connectDB } from '../config/db.js';
import LeaveApplication from '../models/LeaveApplication.js';
import ODApplication from '../models/ODApplication.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import { createNotification } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';
import { isMockUserId, publicUploadUrl, sanitizeStoredFileUrl } from '../utils/uploads.js';
import {
  addDemoLeave, getDemoLeaves, updateDemoLeave,
  addDemoOd, getDemoOds, updateDemoOd, demoStudentStub,
} from '../services/demoStore.js';

const LEAVE_TYPES = ['casual', 'medical', 'personal', 'emergency', 'family', 'other'];

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDaysInclusive(start, end) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;
}

function normalizeReviewStatus(body) {
  const raw = body?.status || body?.action;
  if (raw === 'approve' || raw === 'approved') return 'approved';
  if (raw === 'reject' || raw === 'rejected') return 'rejected';
  return null;
}

function storedDocumentUrl(req) {
  return publicUploadUrl(req.file) || sanitizeStoredFileUrl(req.body?.documentUrl);
}

// ─── Student: Submit Leave ───────────────────────────────────────
export async function applyLeave(req, res, next) {
  try {
    const { leaveType, startDate, endDate, reason, description } = req.body;
    if (!LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json({ success: false, message: 'Please select a valid leave type.' });
    }
    if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Reason must be between 3 and 500 characters.' });
    }
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }
    if (end < start) return res.status(400).json({ success: false, message: 'End date must be on or after start date.' });
    const totalDays = calendarDaysInclusive(start, end);
    const documentUrl = storedDocumentUrl(req);

    if (isMockUserId(req.user.id)) {
      const student = demoStudentStub(req);
      const leave = addDemoLeave({
        _id: `demo-leave-${Date.now()}`,
        studentKey: req.user.id,
        studentId: student,
        student,
        mentorId: 'mock_mentor',
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason: reason.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        documentUrl,
        status: 'pending',
        createdAt: new Date(),
        appliedAt: new Date(),
      });
      return res.status(201).json({ success: true, message: 'Leave application submitted successfully.', data: leave });
    }

    await connectDB();
    const userId = req.user.id;
    const student = await Student.findOne({ userId }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    if (!student.mentorId) return res.status(400).json({ success: false, message: 'No mentor assigned. Contact admin.' });

    const overlapping = await LeaveApplication.findOne({
      studentId: student._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    }).lean();
    if (overlapping) {
      return res.status(409).json({ success: false, message: 'You already have a pending or approved leave that overlaps these dates.' });
    }

    const leave = await LeaveApplication.create({
      studentId: student._id,
      mentorId: student.mentorId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: reason.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      documentUrl,
    });

    // Notify mentor
    const mentor = await Mentor.findById(student.mentorId).lean();
    if (mentor) {
      await createNotification({
        userId: mentor.userId,
        type: 'info',
        title: 'New Leave Application',
        body: `${student.name} has applied for ${totalDays} day(s) of leave.`,
        link: `/mentor/leave/${leave._id}`,
        relatedId: leave._id,
        relatedModel: 'LeaveApplication',
      });
    }

    res.status(201).json({ success: true, message: 'Leave application submitted successfully.', data: leave });
  } catch (err) { next(err); }
}

// ─── Student: Get own leave applications ─────────────────────────
export async function getMyLeave(req, res, next) {
  try {
    if (isMockUserId(req.user?.id)) {
      const leaves = getDemoLeaves({ studentKey: req.user.id });
      return res.json({ success: true, message: 'Leave applications fetched (Demo Mode).', data: { leaves, total: leaves.length, page: 1, pages: 1 } });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [leaves, total] = await Promise.all([
      LeaveApplication.find({ studentId: student._id })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LeaveApplication.countDocuments({ studentId: student._id }),
    ]);

    res.json({ success: true, message: 'Leave applications fetched.', data: { leaves, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

// ─── Student: Cancel pending leave ──────────────────────────────
export async function cancelLeave(req, res, next) {
  try {
    if (isMockUserId(req.user.id)) {
      const leave = updateDemoLeave(req.params.id, (item) => {
        if (item.studentKey !== req.user.id) return item;
        if (item.status !== 'pending') return item;
        return { ...item, status: 'cancelled' };
      });
      if (!leave || leave.studentKey !== req.user.id) return res.status(404).json({ success: false, message: 'Leave application not found.' });
      if (leave.status !== 'cancelled') return res.status(400).json({ success: false, message: 'Only pending applications can be cancelled.' });
      return res.json({ success: true, message: 'Leave application cancelled.', data: leave });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const leave = await LeaveApplication.findOne({ _id: req.params.id, studentId: student._id });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave application not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending applications can be cancelled.' });

    leave.status = 'cancelled';
    await leave.save();
    res.json({ success: true, message: 'Leave application cancelled.', data: leave });
  } catch (err) { next(err); }
}

// ─── Mentor: Get assigned students' leave requests ───────────────
export async function getMenteeLeave(req, res, next) {
  try {
    if (isMockUserId(req.user.id)) {
      const status = req.query.status || 'pending';
      if (getDemoLeaves({ mentorList: true }).length === 0) {
        addDemoLeave({
          _id: 'mock_leave_001',
          studentId: { name: 'Aarav Patel', regNo: 'DEMO001', department: 'CSE', year: 2, section: 'A' },
          student: { name: 'Aarav Patel', regNo: 'DEMO001', department: 'CSE' },
          leaveType: 'medical',
          startDate: new Date(),
          endDate: new Date(Date.now() + 2 * 86400000),
          reason: 'Viral fever — doctor recommended rest',
          status: 'pending',
          createdAt: new Date(),
        });
      }
      const leave = getDemoLeaves({ mentorList: true, status });
      return res.json({
        success: true,
        message: 'Leave requests fetched (Demo Mode).',
        data: { leave },
      });
    }

    await connectDB();
    const mentor = await Mentor.findOne({ userId: req.user.id }).lean();
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    const status = req.query.status || 'pending';
    const leaves = await LeaveApplication.find({ mentorId: mentor._id, status })
      .populate('studentId', 'name regNo registrationNumber department year section')
      .sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      message: 'Leave requests fetched.',
      data: { leave: leaves },
    });
  } catch (err) { next(err); }
}

// ─── Mentor: Review (approve/reject) leave ──────────────────────
export async function reviewLeave(req, res, next) {
  try {
    const status = normalizeReviewStatus(req.body);
    const remarks = req.body.remarks;
    if (isMockUserId(req.user.id)) {
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
      }
      const leave = updateDemoLeave(req.params.id, () => ({ status, mentorRemarks: remarks, reviewedAt: new Date() }));
      if (!leave) {
        return res.status(404).json({ success: false, message: 'Leave application not found.' });
      }
      return res.json({ success: true, message: `Leave application ${status} (Demo Mode).`, data: leave });
    }

    await connectDB();
    const mentor = await Mentor.findOne({ userId: req.user.id }).lean();
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const leave = await LeaveApplication.findOne({ _id: req.params.id, mentorId: mentor._id });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave application not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Application already reviewed.' });

    leave.status = status;
    leave.mentorRemarks = remarks;
    leave.reviewedAt = new Date();
    leave.reviewedBy = req.user.id;
    await leave.save();

    // Get student for notification
    const student = await Student.findById(leave.studentId).lean();
    if (student) {
      const isApproved = status === 'approved';
      await createNotification({
        userId: student.userId,
        type: isApproved ? 'success' : 'warning',
        title: `Leave Application ${isApproved ? 'Approved' : 'Rejected'}`,
        body: `Your leave application has been ${status}${remarks ? `: "${remarks}"` : '.'}`,
        link: `/student/leave`,
        relatedId: leave._id,
        relatedModel: 'LeaveApplication',
      });
    }

    await createAuditLog({
      actor: req.user.id, actorEmail: req.user.email, actorRole: req.user.role,
      action: `LEAVE_${status.toUpperCase()}`,
      resource: 'LeaveApplication', resourceId: leave._id,
      description: `Mentor ${status} leave for student ${leave.studentId}`,
      req,
    });

    res.json({ success: true, message: `Leave application ${status}.`, data: leave });
  } catch (err) { next(err); }
}

// ─── Student: Apply OD ───────────────────────────────────────────
export async function applyOD(req, res, next) {
  try {
    const { eventName, organization, eventDate, returnDate, venue, reason, description } = req.body;
    if (typeof eventName !== 'string' || eventName.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Event name is required.' });
    }
    if (typeof organization !== 'string' || organization.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Organizing body is required.' });
    }
    if (typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Reason for OD is required.' });
    }
    const start = parseDateOnly(eventDate);
    const end = parseDateOnly(returnDate);
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'Event date and return date are required.' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'Return date must be on or after the event date.' });
    }
    const documentUrl = storedDocumentUrl(req);

    if (isMockUserId(req.user.id)) {
      const student = demoStudentStub(req);
      const od = addDemoOd({
        _id: `demo-od-${Date.now()}`,
        studentKey: req.user.id,
        studentId: student,
        student,
        mentorId: 'mock_mentor',
        eventName: eventName.trim(),
        organization: organization.trim(),
        venue: typeof venue === 'string' ? venue.trim() : '',
        reason: reason.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        eventDate: start,
        returnDate: end,
        documentUrl,
        status: 'pending',
        createdAt: new Date(),
        appliedAt: new Date(),
      });
      return res.status(201).json({ success: true, message: 'OD application submitted.', data: od });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    if (!student.mentorId) return res.status(400).json({ success: false, message: 'No mentor assigned.' });

    const overlapping = await ODApplication.findOne({
      studentId: student._id,
      status: { $in: ['pending', 'approved'] },
      eventDate: { $lte: end },
      returnDate: { $gte: start },
    }).lean();
    if (overlapping) {
      return res.status(409).json({ success: false, message: 'You already have a pending or approved OD that overlaps these dates.' });
    }

    const od = await ODApplication.create({
      studentId: student._id,
      mentorId: student.mentorId,
      eventName: eventName.trim(),
      organization: organization.trim(),
      venue: typeof venue === 'string' ? venue.trim() : '',
      reason: reason.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      eventDate: start,
      returnDate: end,
      documentUrl,
    });

    const mentor = await Mentor.findById(student.mentorId).lean();
    if (mentor) {
      await createNotification({
        userId: mentor.userId,
        type: 'info',
        title: 'New OD Application',
        body: `${student.name} has applied for OD for "${eventName}".`,
        link: `/mentor/od/${od._id}`,
        relatedId: od._id,
        relatedModel: 'ODApplication',
      });
    }

    res.status(201).json({ success: true, message: 'OD application submitted.', data: od });
  } catch (err) { next(err); }
}

// ─── Student: Get own OD applications ───────────────────────────
export async function getMyOD(req, res, next) {
  try {
    if (isMockUserId(req.user?.id)) {
      const ods = getDemoOds({ studentKey: req.user.id });
      return res.json({ success: true, message: 'OD applications fetched (Demo Mode).', data: ods });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const ods = await ODApplication.find({ studentId: student._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, message: 'OD applications fetched.', data: ods });
  } catch (err) { next(err); }
}

// ─── Mentor: Get mentee OD requests ─────────────────────────────
export async function getMenteeOD(req, res, next) {
  try {
    if (isMockUserId(req.user.id)) {
      const status = req.query.status || 'pending';
      if (getDemoOds({ mentorList: true }).length === 0) {
        addDemoOd({
          _id: 'mock_od_001',
          studentId: { name: 'Kiran Rao', regNo: 'DEMO003', department: 'CSE', year: 3, section: 'B' },
          student: { name: 'Kiran Rao', regNo: 'DEMO003', department: 'CSE' },
          event: 'Smart India Hackathon 2026',
          eventName: 'Smart India Hackathon 2026',
          organization: 'AICTE',
          eventDate: new Date(Date.now() + 5 * 86400000),
          returnDate: new Date(Date.now() + 6 * 86400000),
          date: new Date(Date.now() + 5 * 86400000),
          status: 'pending',
          createdAt: new Date(),
        });
      }
      const od = getDemoOds({ mentorList: true, status });
      return res.json({
        success: true,
        message: 'OD requests fetched (Demo Mode).',
        data: { od },
      });
    }

    await connectDB();
    const mentor = await Mentor.findOne({ userId: req.user.id }).lean();
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });
    const status = req.query.status || 'pending';
    const ods = await ODApplication.find({ mentorId: mentor._id, status })
      .populate('studentId', 'name regNo registrationNumber department year section')
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, message: 'OD requests fetched.', data: { od: ods } });
  } catch (err) { next(err); }
}

// ─── Mentor: Review OD ──────────────────────────────────────────
export async function reviewOD(req, res, next) {
  try {
    const status = normalizeReviewStatus(req.body);
    const remarks = req.body.remarks;
    if (isMockUserId(req.user.id)) {
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
      }
      const od = updateDemoOd(req.params.id, () => ({ status, mentorRemarks: remarks, reviewedAt: new Date() }));
      if (!od) {
        return res.status(404).json({ success: false, message: 'OD application not found.' });
      }
      return res.json({ success: true, message: `OD application ${status} (Demo Mode).`, data: od });
    }

    await connectDB();
    const mentor = await Mentor.findOne({ userId: req.user.id }).lean();
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found.' });

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const od = await ODApplication.findOne({ _id: req.params.id, mentorId: mentor._id });
    if (!od) return res.status(404).json({ success: false, message: 'OD application not found.' });
    if (od.status !== 'pending') return res.status(400).json({ success: false, message: 'Application already reviewed.' });

    od.status = status;
    od.mentorRemarks = remarks;
    od.reviewedAt = new Date();
    od.reviewedBy = req.user.id;
    await od.save();

    const student = await Student.findById(od.studentId).lean();
    if (student) {
      await createNotification({
        userId: student.userId,
        type: status === 'approved' ? 'success' : 'warning',
        title: `OD Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        body: `Your OD application for "${od.eventName}" has been ${status}.`,
        link: `/student/leave`,
      });
    }

    res.json({ success: true, message: `OD application ${status}.`, data: od });
  } catch (err) { next(err); }
}
