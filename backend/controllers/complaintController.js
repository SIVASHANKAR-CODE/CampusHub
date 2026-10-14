import { connectDB, isDbConnected } from '../config/db.js';
import Complaint from '../models/Complaint.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';
import mongoose from 'mongoose';
import { isMockUserId, publicUploadUrl } from '../utils/uploads.js';
import { addDemoComplaint, getDemoComplaints, getAllDemoComplaints, getDemoComplaintById, updateDemoComplaint, demoStudentStub, addDemoNotification } from '../services/demoStore.js';

const maintenanceCategories = ['facilities', 'infrastructure', 'maintenance', 'electrical', 'plumbing', 'hostel'];

// ─── Student: Create complaint ───────────────────────────────────
export async function createComplaint(req, res, next) {
  try {
    const { category, subCategory, title, description, priority } = req.body;
    const allowedCategories = ['academic', 'hostel', 'transport', 'facilities', 'infrastructure', 'maintenance', 'food', 'library', 'administration', 'electrical', 'plumbing', 'it', 'other'];
    const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_CATEGORY', message: 'Please select a valid complaint category.' });
    }
    if (!allowedPriorities.includes(priority || 'medium')) {
      return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_PRIORITY', message: 'Please select a valid complaint priority.' });
    }
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 160) {
      return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_TITLE', message: 'Title must be between 3 and 160 characters.' });
    }
    if (typeof description !== 'string' || description.trim().length < 3 || description.trim().length > 5000) {
      return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_DESCRIPTION', message: 'Description must be between 3 and 5,000 characters.' });
    }

    // Demo identities are intentionally database-free, so keep the demo flow usable.
    if (isMockUserId(req.user?.id)) {
      const ticketId = `CMP-${new Date().getFullYear()}-DEMO${Date.now().toString().slice(-4)}`;
      const complaint = addDemoComplaint(req.user.id, {
        _id: `demo-${Date.now()}`,
        ticketId,
        category,
        subCategory,
        title: title.trim(),
        description: description.trim(),
        priority: priority || 'medium',
        status: 'submitted',
        imageUrl: publicUploadUrl(req.file),
        studentId: demoStudentStub(req),
        createdAt: new Date(),
        updatedAt: new Date(),
        timeline: [{ status: 'submitted', note: 'Complaint submitted by student.', updatedByRole: 'student', timestamp: new Date() }],
      });

      // Notify admin & maintenance in demo mode
      addDemoNotification([
        { userId: 'mock_admin_001', targetRole: 'admin', category: 'complaint', type: priority === 'urgent' ? 'emergency' : 'info', title: `New complaint ${ticketId}`, body: `${demoStudentStub(req).name} submitted: ${title.trim()}`, link: '/admin/complaints' },
        { userId: 'mock_maint_001', targetRole: 'maintenance', category: 'complaint', type: priority === 'urgent' ? 'emergency' : 'info', title: `New ${category} complaint`, body: `New ${category} complaint requires attention.`, link: '/maintenance' },
      ]);

      return res.status(201).json({
        success: true,
        message: `Complaint submitted. Your ticket ID is ${ticketId}`,
        data: complaint,
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const complaint = await Complaint.create({
      studentId: student._id,
      category,
      subCategory,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'medium',
      imageUrl: publicUploadUrl(req.file),
      timeline: [{
        status: 'submitted',
        note: 'Complaint submitted by student.',
        updatedByName: student.name,
        updatedByRole: 'student',
      }],
    });

    const recipients = await User.find({ role: { $in: ['admin', 'maintenance'] }, isActive: true }).select('_id role').lean();
    await createNotification(recipients.map((recipient) => ({
      userId: recipient._id,
      targetRole: recipient.role,
      category: 'complaint',
      type: priority === 'urgent' ? 'emergency' : 'info',
      title: `New complaint ${complaint.ticketId}`,
      body: recipient.role === 'admin'
        ? `${student.name} submitted ${complaint.title}.`
        : `New ${complaint.category} complaint requires attention.`,
      link: recipient.role === 'admin' ? '/admin/complaints' : '/maintenance',
      relatedId: complaint._id,
      relatedModel: 'Complaint',
    })));

    await createAuditLog({
      actor: req.user.id, actorEmail: req.user.email, actorRole: req.user.role,
      action: 'CREATE_COMPLAINT', resource: 'Complaint', resourceId: complaint._id,
      description: `Submitted complaint ${complaint.ticketId}`, after: { status: complaint.status, category: complaint.category }, req,
    });


    res.status(201).json({
      success: true,
      message: `Complaint submitted. Your ticket ID is ${complaint.ticketId}`,
      data: complaint,
    });
  } catch (err) { next(err); }
}

// ─── Student: Get own complaints ────────────────────────────────
export async function getMyComplaints(req, res, next) {
  try {
    if (isMockUserId(req.user?.id)) {
      const submitted = getDemoComplaints(req.user.id);
      const data = submitted.length > 0 ? submitted : [{ _id: 'demo-complaint-001', ticketId: 'CMP-DEMO-001', title: 'Projector flickering in Seminar Hall', category: 'electrical', subCategory: 'projector', description: 'The projector intermittently loses signal during presentations.', status: 'in_progress', priority: 'medium', location: 'Main Block, Seminar Hall', createdAt: new Date(Date.now() - 2 * 86400000), timeline: [] }];
      return res.json({ success: true, message: 'Complaints fetched (Demo Mode).', data });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const complaints = await Complaint.find({ studentId: student._id })
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, message: 'Complaints fetched.', data: complaints });
  } catch (err) { next(err); }
}

export async function getComplaintById(req, res, next) {
  try {
    const id = req.params.id;

    // Demo complaint IDs (demo-*, mock_*) are not valid ObjectIds — retrieve from demoStore
    if (isMockUserId(req.user?.id) || (typeof id === 'string' && (id.startsWith('demo') || id.startsWith('mock')))) {
      const complaint = getDemoComplaintById(id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
      return res.json({ success: true, message: 'Complaint fetched (Demo Mode).', data: complaint });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    await connectDB();
    const filter = { _id: id };
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id }).select('_id').lean();
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      filter.studentId = student._id;
    } else if (req.user.role === 'maintenance') {
      filter.$or = [{ assignedTo: req.user.id }, { assignedTo: { $exists: false }, category: { $in: maintenanceCategories } }];
    }
    const complaint = await Complaint.findOne(filter)
      .populate('studentId', 'name regNo registrationNumber department year section')
      .populate('assignedTo', 'email role')
      .populate('comments.userId', 'email role')
      .lean();
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, message: 'Complaint fetched.', data: complaint });
  } catch (err) { next(err); }
}

// ─── Student: Acknowledge resolution ────────────────────────────
export async function acknowledgeComplaint(req, res, next) {
  try {
    // Demo mode
    if (isMockUserId(req.user?.id)) {
      const complaint = updateDemoComplaint(req.params.id, (item) => {
        if (item.status !== 'resolved') return {};
        return {
          studentAcknowledged: true,
          status: 'closed',
          timeline: [...(item.timeline || []), { status: 'closed', note: 'Student acknowledged the resolution.', updatedByRole: 'student', timestamp: new Date() }],
          updatedAt: new Date(),
        };
      });
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found or not yet resolved.' });
      if (complaint.status !== 'closed') return res.status(400).json({ success: false, message: 'Complaint is not yet resolved.' });
      return res.json({ success: true, message: 'Resolution acknowledged. Complaint closed.', data: complaint });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const complaint = await Complaint.findOne({ _id: req.params.id, studentId: student._id });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'resolved') return res.status(400).json({ success: false, message: 'Complaint is not yet resolved.' });

    complaint.studentAcknowledged = true;
    complaint.status = 'closed';
    complaint.timeline.push({
      status: 'closed',
      note: 'Student acknowledged the resolution.',
      updatedByName: student.name,
      updatedByRole: 'student',
    });
    await complaint.save();

    res.json({ success: true, message: 'Resolution acknowledged. Complaint closed.', data: complaint });
  } catch (err) { next(err); }
}

// ─── Admin: Get all complaints (paginated + filtered) ───────────
export async function getAllComplaints(req, res, next) {
  try {
    const isMock = isMockUserId(req.user?.id);

    // Demo mode or DB unavailable — return shared demoStore complaints
    if (isMock || !isDbConnected()) {
      const allDemo = getAllDemoComplaints();
      const { status, category, page = 1, limit = 20 } = req.query;
      let filtered = allDemo;
      if (status) filtered = filtered.filter((c) => c.status === status);
      if (category) filtered = filtered.filter((c) => c.category === category);
      const total = filtered.length;
      const p = parseInt(page);
      const l = parseInt(limit);
      const paged = filtered.slice((p - 1) * l, p * l);
      return res.json({
        success: true,
        message: 'Complaints fetched (Demo Mode).',
        data: { complaints: paged, total, page: p, pages: Math.ceil(total / l) || 1 },
      });
    }

    await connectDB();
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('studentId', 'name regNo registrationNumber department year section')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Complaint.countDocuments(filter),
    ]);

    res.json({ success: true, message: 'Complaints fetched.', data: { complaints, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
}

// ─── Admin: Update status + assign staff ────────────────────────
export async function updateComplaintStatus(req, res, next) {
  try {
    const { status, assignedTo, assignedToName, note, adminNote, resolutionNote } = req.body;
    const allowedStatuses = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_STATUS', message: 'Please select a valid complaint status.' });
    }

    const isMock = isMockUserId(req.user?.id);

    // Demo mode — update in-memory store
    if (isMock || (typeof req.params.id === 'string' && (req.params.id.startsWith('demo') || req.params.id.startsWith('mock')))) {
      const complaint = updateDemoComplaint(req.params.id, (item) => ({
        status,
        assignedTo: assignedTo || item.assignedTo,
        assignedToName: assignedToName || item.assignedToName,
        assignedAt: assignedTo ? new Date() : item.assignedAt,
        resolutionNote: resolutionNote || item.resolutionNote,
        resolvedAt: status === 'resolved' ? new Date() : item.resolvedAt,
        updatedAt: new Date(),
        timeline: [...(item.timeline || []), {
          status,
          note: note || adminNote || `Status updated to ${status}`,
          updatedByName: req.user.email || 'admin@demo.com',
          updatedByRole: req.user.role || 'admin',
          timestamp: new Date(),
        }],
      }));
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

      // Notify student
      const studentUserId = complaint.studentId?._id || complaint.studentId?.userId;
      if (studentUserId) {
        const notifMap = {
          under_review: { type: 'info', body: 'Your complaint is under review.' },
          assigned: { type: 'info', body: 'Your complaint has been assigned to our team.' },
          in_progress: { type: 'info', body: 'Work is in progress on your complaint.' },
          resolved: { type: 'success', body: `Your complaint has been resolved. ${resolutionNote || ''}` },
          rejected: { type: 'warning', body: 'Your complaint has been rejected.' },
        };
        if (notifMap[status]) {
          addDemoNotification({ userId: studentUserId, targetRole: 'student', category: 'complaint', type: notifMap[status].type, title: `Complaint #${complaint.ticketId} Update`, body: notifMap[status].body, link: '/student/complaints' });
        }
      }

      // Notify maintenance if assigned
      if (assignedTo) {
        addDemoNotification({ userId: assignedTo, targetRole: 'maintenance', category: 'complaint', type: complaint.priority === 'urgent' ? 'emergency' : 'warning', title: 'Maintenance complaint assigned', body: `${complaint.title}. Complaint #${complaint.ticketId} has been assigned to you.`, link: '/maintenance' });
      }

      return res.json({ success: true, message: `Complaint status updated to ${status}.`, data: complaint });
    }

    await connectDB();
    if (assignedTo) {
      const assignee = await User.findOne({ _id: assignedTo, role: 'maintenance', isActive: true }).select('_id email').lean();
      if (!assignee) return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_ASSIGNEE', message: 'Complaint must be assigned to an active maintenance user.' });
    }
    const complaint = await Complaint.findById(req.params.id).populate('studentId');
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const prevStatus = complaint.status;
    const previousAssignee = complaint.assignedTo ? String(complaint.assignedTo) : null;
    complaint.status = status;
    if (assignedTo) { complaint.assignedTo = assignedTo; complaint.assignedToName = assignedToName; complaint.assignedAt = new Date(); }
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === 'resolved') complaint.resolvedAt = new Date();

    complaint.timeline.push({
      status,
      note: note || adminNote || `Status updated to ${status}`,
      updatedByName: req.user.email,
      updatedByRole: req.user.role,
    });
    await complaint.save();

    // Notify student
    if (complaint.studentId) {
      const notifMap = {
        under_review: { type: 'info', body: 'Your complaint is under review.' },
        assigned: { type: 'info', body: `Your complaint has been assigned to our team.` },
        in_progress: { type: 'info', body: 'Work is in progress on your complaint.' },
        resolved: { type: 'success', body: `Your complaint has been resolved. ${resolutionNote || ''}` },
        rejected: { type: 'warning', body: 'Your complaint has been rejected.' },
      };
      if (notifMap[status]) {
        await createNotification({
          userId: complaint.studentId.userId,
          targetRole: 'student',
          category: 'complaint',
          type: notifMap[status].type,
          title: `Complaint #${complaint.ticketId} Update`,
          body: notifMap[status].body,
          link: `/student/complaints/${complaint._id}`,
        });
      }
    }

    const assignedUser = assignedTo && previousAssignee !== String(assignedTo)
      ? await User.findById(assignedTo).select('_id role').lean()
      : null;
    if (assignedUser?.role === 'maintenance') {
      await createNotification({
        userId: assignedUser._id,
        targetRole: 'maintenance',
        category: 'complaint',
        type: complaint.priority === 'urgent' ? 'emergency' : 'warning',
        title: 'New maintenance complaint assigned',
        body: `${complaint.title}. Complaint #${complaint.ticketId} has been assigned to you.`,
        link: '/maintenance',
        relatedId: complaint._id,
        relatedModel: 'Complaint',
      });
    }

    await createAuditLog({
      actor: req.user.id, actorEmail: req.user.email, actorRole: req.user.role,
      action: 'UPDATE_COMPLAINT_STATUS',
      resource: 'Complaint', resourceId: complaint._id,
      description: `Changed status from ${prevStatus} to ${status}`,
      before: { status: prevStatus }, after: { status }, req,
    });

    res.json({ success: true, message: `Complaint status updated to ${status}.`, data: complaint });
  } catch (err) { next(err); }
}

// ─── Maintenance: Get assigned complaints ───────────────────────
export async function getAssignedComplaints(req, res, next) {
  try {
    if (isMockUserId(req.user.id)) {
      const all = getAllDemoComplaints();
      // Show complaints assigned to this user, or unassigned maintenance-category complaints
      const assigned = all.filter((c) =>
        c.status !== 'closed' && c.status !== 'rejected' &&
        (c.assignedTo === req.user.id || (!c.assignedTo && maintenanceCategories.includes(c.category)))
      );
      return res.json({
        success: true,
        message: 'Assigned complaints fetched (Demo Mode).',
        data: assigned,
      });
    }

    await connectDB();
    const complaints = await Complaint.find({
      $or: [{ assignedTo: req.user.id }, { assignedTo: { $exists: false }, category: { $in: maintenanceCategories } }],
      status: { $nin: ['closed', 'rejected'] },
    })
      .populate('studentId', 'name regNo department')
      .sort({ priority: -1, createdAt: -1 }).lean();
    res.json({ success: true, message: 'Assigned complaints fetched.', data: complaints });
  } catch (err) { next(err); }
}

export async function claimComplaint(req, res, next) {
  try {
    // Demo mode
    if (isMockUserId(req.user?.id) || (typeof req.params.id === 'string' && (req.params.id.startsWith('demo') || req.params.id.startsWith('mock')))) {
      const complaint = updateDemoComplaint(req.params.id, (item) => {
        if (item.assignedTo) return {}; // Already assigned
        return {
          assignedTo: req.user.id,
          assignedToName: req.user.email || 'maintenance@demo.com',
          assignedAt: new Date(),
          status: 'assigned',
          updatedAt: new Date(),
          timeline: [...(item.timeline || []), { status: 'assigned', note: 'Complaint claimed by maintenance.', updatedByName: req.user.email, updatedByRole: 'maintenance', timestamp: new Date() }],
        };
      });
      if (!complaint) return res.status(404).json({ success: false, message: 'Complaint is unavailable or already assigned.' });
      if (complaint.assignedTo && complaint.assignedTo !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Complaint is unavailable or already assigned.' });
      }
      return res.json({ success: true, message: 'Complaint assigned to you.', data: complaint });
    }

    await connectDB();
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedTo: { $exists: false },
      category: { $in: maintenanceCategories },
    });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint is unavailable or already assigned.' });
    complaint.assignedTo = req.user.id;
    complaint.assignedToName = req.user.email;
    complaint.assignedAt = new Date();
    complaint.status = 'assigned';
    complaint.timeline.push({ status: 'assigned', note: 'Complaint claimed by maintenance.', updatedBy: req.user.id, updatedByName: req.user.email, updatedByRole: 'maintenance' });
    await complaint.save();
    res.json({ success: true, message: 'Complaint assigned to you.', data: complaint });
  } catch (err) { next(err); }
}

export async function addComplaintComment(req, res, next) {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 2000) {
      return res.status(400).json({ success: false, code: 'INVALID_COMPLAINT_COMMENT', message: 'Comment must be between 1 and 2,000 characters.' });
    }
    await connectDB();
    const filter = req.user.role === 'maintenance'
      ? { _id: req.params.id, assignedTo: req.user.id }
      : { _id: req.params.id };
    const complaint = await Complaint.findOne(filter);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    complaint.comments.push({ userId: req.user.id, role: req.user.role, message });
    await complaint.save();
    const student = await Student.findById(complaint.studentId).select('userId').lean();
    if (student) {
      await createNotification({ userId: student.userId, targetRole: 'student', category: 'complaint', type: 'info', title: `Update on complaint ${complaint.ticketId}`, body: message, link: `/student/complaints/${complaint._id}`, relatedId: complaint._id, relatedModel: 'Complaint' });
    }
    res.status(201).json({ success: true, message: 'Complaint update added.', data: complaint });
  } catch (err) { next(err); }
}

// ─── Maintenance: Update complaint progress ──────────────────────
export async function updateComplaintProgress(req, res, next) {
  try {
    const { status, note } = req.body;
    if (isMockUserId(req.user.id)) {
      if (!['in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Maintenance can only set in_progress or resolved.' });
      }
      if (status === 'resolved' && !req.file) {
        return res.status(400).json({ success: false, code: 'RESOLUTION_PHOTO_REQUIRED', message: 'Upload a resolution photo before marking the complaint as resolved.' });
      }
      const complaint = updateDemoComplaint(req.params.id, (item) => ({
        status,
        resolutionNote: status === 'resolved' ? (note || item.resolutionNote) : item.resolutionNote,
        resolutionImageUrl: status === 'resolved' ? publicUploadUrl(req.file) : item.resolutionImageUrl,
        resolvedAt: status === 'resolved' ? new Date() : item.resolvedAt,
        updatedAt: new Date(),
        timeline: [...(item.timeline || []), { status, note: note || `Status updated to ${status}`, updatedByRole: 'maintenance', timestamp: new Date() }],
      }));
      if (!complaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found or not assigned to you.' });
      }

      // Notify student
      const studentUserId = complaint.studentId?._id || complaint.studentId?.userId;
      if (studentUserId) {
        addDemoNotification({
          userId: studentUserId, targetRole: 'student', category: 'complaint',
          type: status === 'resolved' ? 'success' : 'info',
          title: `Complaint #${complaint.ticketId} — ${status === 'resolved' ? 'Resolved' : 'In Progress'}`,
          body: note || `Status updated to ${status}.`,
          link: '/student/complaints',
        });
      }

      return res.json({
        success: true,
        message: `Complaint marked as ${status} (Demo Mode).`,
        data: complaint,
      });
    }

    await connectDB();
    if (!['in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Maintenance can only set in_progress or resolved.' });
    }
    if (status === 'resolved' && !req.file) {
      return res.status(400).json({ success: false, code: 'RESOLUTION_PHOTO_REQUIRED', message: 'Upload a resolution photo before marking the complaint as resolved.' });
    }

    const complaint = await Complaint.findOne({ _id: req.params.id, assignedTo: req.user.id });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found or not assigned to you.' });

    complaint.status = status;
    if (status === 'resolved') complaint.resolvedAt = new Date();
    if (status === 'resolved' && note) complaint.resolutionNote = note;
    if (status === 'resolved' && req.file) complaint.resolutionImageUrl = publicUploadUrl(req.file);
    complaint.timeline.push({ status, note, updatedByRole: 'maintenance' });
    await complaint.save();

    // Notify student
    const student = await Student.findById(complaint.studentId).lean();
    if (student) {
      await createNotification({
        userId: student.userId,
        targetRole: 'student',
        category: 'complaint',
        type: status === 'resolved' ? 'success' : 'info',
        title: `Complaint #${complaint.ticketId} — ${status === 'resolved' ? 'Resolved' : 'In Progress'}`,
        body: note || `Status updated to ${status}.`,
        link: `/student/complaints/${complaint._id}`,
      });
    }

    res.json({ success: true, message: `Complaint marked as ${status}.`, data: complaint });
  } catch (err) { next(err); }
}
