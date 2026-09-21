import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import Club from '../models/Club.js';
import ClubRequest from '../models/ClubRequest.js';
import ClubMembership from '../models/ClubMembership.js';
import Student from '../models/Student.js';
import { createNotification } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';
import {
  getDemoClubs, addDemoClub, deleteDemoClub,
  getDemoMemberships, addDemoMembership, getAllDemoMemberships, updateDemoMembership,
  getDemoClubRequests, addDemoClubRequest, updateDemoClubRequest,
} from '../services/demoStore.js';

const router = Router();
router.use(authenticate);

// ─── All users: list active clubs ────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      return res.json({ success: true, message: 'Clubs fetched (Demo Mode).', data: getDemoClubs() });
    }

    await connectDB();
    const clubs = await Club.find({ isActive: true })
      .populate('presidentId', 'name regNo')
      .populate('faculty_advisorId', 'name department')
      .lean();
    res.json({ success: true, message: 'Clubs fetched.', data: clubs });
  } catch (err) { next(err); }
});

// ─── Student: get own club memberships / join request statuses ────────────────
router.get('/my-memberships', requireRole('student'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      const memberships = getDemoMemberships(req.user.id);
      return res.json({ success: true, message: 'Memberships fetched (Demo Mode).', data: memberships });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    const memberships = await ClubMembership.find({ studentId: student._id })
      .populate('clubId', 'name description category logoUrl')
      .lean();
    res.json({ success: true, message: 'Memberships fetched.', data: memberships });
  } catch (err) { next(err); }
});

// ─── Student: join request for an existing club ──────────────────────────────
router.post('/:id/join', requireRole('student'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    const message = req.body.reason || req.body.message || 'Interested in actively participating in club initiatives.';

    if (isMock || !isDbConnected()) {
      const demoClubs = getDemoClubs();
      const club = demoClubs.find((c) => c._id === req.params.id);
      if (!club) return res.status(404).json({ success: false, message: 'Club not found.' });

      const existing = getDemoMemberships(req.user.id).find((m) => (m.clubId?._id || m.clubId) === club._id);
      if (existing?.status === 'approved') {
        return res.status(400).json({ success: false, message: 'You are already an approved member of this club.' });
      }
      if (existing?.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Your join request is already pending review.' });
      }

      const membership = addDemoMembership({
        _id: `demo-mem-${Date.now()}`,
        studentId: {
          _id: req.user.id,
          userId: req.user.id,
          name: req.user.name || 'Aarav Patel',
          regNo: '21CS001',
          registrationNumber: '21CS001',
          department: 'CSE',
          year: 2,
          section: 'A',
        },
        clubId: {
          _id: club._id,
          name: club.name,
          category: club.category,
          description: club.description,
        },
        status: 'pending',
        message,
        appliedAt: new Date(),
      });

      // Notify admin
      await createNotification({
        userId: 'mock_admin_001',
        targetRole: 'admin',
        category: 'general',
        type: 'info',
        title: 'New Student Club Join Request',
        body: `Aarav Patel requested to join ${club.name}.`,
        link: '/admin/clubs',
      });

      return res.status(201).json({
        success: true,
        message: 'Join request submitted. Awaiting coordinator review.',
        data: membership,
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found.' });

    let membership = await ClubMembership.findOne({ studentId: student._id, clubId: club._id });
    if (membership && membership.status === 'approved') {
      return res.status(400).json({ success: false, message: 'You are already an approved member of this club.' });
    }
    if (membership && membership.status === 'pending') {
      return res.status(400).json({ success: false, message: 'Your join request is already pending review.' });
    }

    membership = await ClubMembership.findOneAndUpdate(
      { studentId: student._id, clubId: club._id },
      { status: 'pending', message, appliedAt: new Date() },
      { upsert: true, new: true }
    );

    // Notify admin
    await createNotification({
      userId: club.createdBy || req.user.id,
      targetRole: 'admin',
      category: 'general',
      type: 'info',
      title: 'New Student Club Join Request',
      body: `${student.name} requested to join ${club.name}.`,
      link: '/admin/clubs',
    });

    res.status(201).json({ success: true, message: 'Join request submitted. Awaiting coordinator review.', data: membership });
  } catch (err) { next(err); }
});

// ─── Admin/Faculty: list membership join requests ────────────────────────────
router.get('/requests/membership', requireRole('admin', 'faculty', 'club_president'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      const requests = getAllDemoMemberships().filter((m) => m.status === 'pending');
      return res.json({ success: true, message: 'Join requests fetched (Demo Mode).', data: requests });
    }

    await connectDB();
    const requests = await ClubMembership.find({ status: 'pending' })
      .populate('studentId', 'name regNo registrationNumber department year section')
      .populate('clubId', 'name category')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, message: 'Join requests fetched.', data: requests });
  } catch (err) { next(err); }
});

// ─── Admin/Faculty: approve or reject club membership request ────────────────
router.patch('/requests/membership/:id', requireRole('admin', 'faculty', 'club_president'), async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || String(req.params.id).startsWith('demo-mem-') || !isDbConnected()) {
      const membership = updateDemoMembership(req.params.id, {
        status,
        remarks: remarks || '',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      });

      if (!membership) return res.status(404).json({ success: false, message: 'Request not found.' });

      // Notify student
      await createNotification({
        userId: membership.studentId?.userId || membership.studentId?._id || 'mock_student_001',
        targetRole: 'student',
        type: status === 'approved' ? 'success' : 'warning',
        title: `Club Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
        body: `Your request to join ${membership.clubId?.name || 'the club'} was ${status}.`,
        link: '/student/clubs',
      });

      return res.json({ success: true, message: `Membership request ${status} (Demo Mode).`, data: membership });
    }

    await connectDB();
    const membership = await ClubMembership.findById(req.params.id);
    if (!membership) return res.status(404).json({ success: false, message: 'Request not found.' });

    membership.status = status;
    membership.reviewedAt = new Date();
    membership.reviewedBy = req.user.id;
    membership.remarks = remarks || '';
    await membership.save();

    if (status === 'approved') {
      await Club.findByIdAndUpdate(membership.clubId, {
        $addToSet: { memberIds: membership.studentId },
      });
    }

    // Send notification to student
    const student = await Student.findById(membership.studentId);
    const club = await Club.findById(membership.clubId);
    if (student && club) {
      await createNotification({
        userId: student.userId,
        targetRole: 'student',
        type: status === 'approved' ? 'success' : 'warning',
        title: `Club Request ${status === 'approved' ? 'Approved' : 'Declined'}`,
        body: `Your request to join ${club.name} was ${status}.`,
        link: '/student/clubs',
        relatedId: club._id,
        relatedModel: 'Club',
      });
    }

    res.json({ success: true, message: `Membership request ${status}.`, data: membership });
  } catch (err) { next(err); }
});

// ─── Student: submit proposal to CREATE a new club ───────────────────────────
router.post('/request', requireRole('student'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    const { clubName, category, purpose, description, expectedMembers } = req.body;
    const normCategory = String(category || 'technical').toLowerCase();

    if (isMock || !isDbConnected()) {
      const created = addDemoClubRequest({
        clubName,
        category: normCategory,
        purpose,
        description,
        expectedMembers: Number(expectedMembers) || 20,
        requestedBy: {
          _id: req.user.id,
          name: req.user.name || 'Aarav Patel',
          regNo: '21CS001',
        },
      });
      return res.status(201).json({ success: true, message: 'Club proposal submitted for admin review (Demo Mode).', data: created });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const request = await ClubRequest.create({
      requestedBy: student._id,
      clubName,
      category: normCategory,
      purpose,
      description,
      expectedMembers: Number(expectedMembers) || 20,
    });

    res.status(201).json({ success: true, message: 'Club proposal submitted for admin review.', data: request });
  } catch (err) { next(err); }
});

// ─── Admin: list club creation proposals ─────────────────────────────────────
router.get('/requests', requireRole('admin'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || !isDbConnected()) {
      return res.json({ success: true, message: 'Club proposals fetched (Demo Mode).', data: getDemoClubRequests() });
    }

    await connectDB();
    const requests = await ClubRequest.find()
      .populate('requestedBy', 'name regNo department')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, message: 'Club proposals fetched.', data: requests });
  } catch (err) { next(err); }
});

// ─── Admin: approve/reject club proposal ─────────────────────────────────────
router.patch('/requests/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { status, action, adminRemarks } = req.body;
    const finalStatus = status || (action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending');

    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || String(req.params.id).startsWith('demo-cr-') || !isDbConnected()) {
      const updated = updateDemoClubRequest(req.params.id, {
        status: finalStatus,
        adminRemarks: adminRemarks || '',
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      });
      if (!updated) return res.status(404).json({ success: false, message: 'Proposal not found.' });
      return res.json({ success: true, message: `Club proposal ${finalStatus} (Demo Mode).`, data: updated });
    }

    await connectDB();
    const request = await ClubRequest.findByIdAndUpdate(
      req.params.id,
      { status: finalStatus, adminRemarks, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Proposal not found.' });
    res.json({ success: true, message: `Club proposal ${finalStatus}.`, data: request });
  } catch (err) { next(err); }
});

// ─── Admin: create club directly ─────────────────────────────────────────────
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    const { name, description, category, presidentId, faculty_advisorId } = req.body;
    // Normalize category to lowercase enum
    const normCategory = String(category || 'other').toLowerCase();

    if (isMock || !isDbConnected()) {
      const newClub = addDemoClub({
        name,
        description,
        category: normCategory,
        presidentId: presidentId || null,
        faculty_advisorId: faculty_advisorId || null,
        createdBy: req.user.id,
      });
      return res.status(201).json({ success: true, message: 'Club created successfully (Demo Mode).', data: newClub });
    }

    await connectDB();
    const club = await Club.create({
      name,
      description,
      category: normCategory,
      presidentId,
      faculty_advisorId,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, message: 'Club created successfully.', data: club });
  } catch (err) { next(err); }
});

// ─── Admin: delete club ──────────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const isMock = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMock || String(req.params.id).startsWith('demo-club-') || !isDbConnected()) {
      deleteDemoClub(req.params.id);
      return res.json({ success: true, message: 'Club deleted successfully (Demo Mode).' });
    }

    await connectDB();
    await Club.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Club deleted successfully.' });
  } catch (err) { next(err); }
});

export default router;
