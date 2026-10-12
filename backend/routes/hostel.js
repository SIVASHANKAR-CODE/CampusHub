import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import Student from '../models/Student.js';
import HostelStudent from '../models/HostelStudent.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();
router.use(authenticate);

// Student: get own hostel info (403 if day scholar)
router.get('/my', requireRole('student'), async (req, res, next) => {
  try {
    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (student.hostelStatus !== 'hosteller') {
      return res.status(403).json({ success: false, message: 'Hostel services are not available for day scholars.' });
    }
    const hostel = await HostelStudent.findOne({ studentId: student._id, isActive: true }).lean();
    res.json({ success: true, message: 'Hostel info fetched.', data: hostel });
  } catch (err) { next(err); }
});

// Admin: list all hostel students
router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const students = await HostelStudent.find({ isActive: true })
      .populate('studentId', 'name regNo department year section').lean();
    res.json({ success: true, message: 'Hostel students fetched.', data: students });
  } catch (err) { next(err); }
});

// Admin: assign hostel room
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const { studentId, roomNumber, blockName, floorNumber, roomType, wardenName, wardenPhone, joinDate } = req.body;
    const hostel = await HostelStudent.findOneAndUpdate(
      { studentId },
      { roomNumber, blockName, floorNumber, roomType, wardenName, wardenPhone, joinDate: new Date(joinDate), isActive: true },
      { upsert: true, new: true }
    );
    // Update student hostelStatus
    await Student.findByIdAndUpdate(studentId, { hostelStatus: 'hosteller' });
    await createAuditLog({
      actor: req.user.id, actorEmail: req.user.email, actorRole: 'admin',
      action: 'ASSIGN_HOSTEL', resource: 'HostelStudent', resourceId: hostel._id,
      description: `Admin assigned hostel room ${roomNumber} (${blockName}) to student ${studentId}`, req,
    });
    res.json({ success: true, message: 'Hostel assigned.', data: hostel });
  } catch (err) { next(err); }
});

// Admin: remove from hostel (set day_scholar)
router.delete('/:studentId', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    await HostelStudent.findOneAndUpdate({ studentId: req.params.studentId }, { isActive: false, vacateDate: new Date() });
    await Student.findByIdAndUpdate(req.params.studentId, { hostelStatus: 'day_scholar' });
    await createAuditLog({
      actor: req.user.id, actorEmail: req.user.email, actorRole: 'admin',
      action: 'REMOVE_HOSTEL', resource: 'Student', resourceId: req.params.studentId,
      description: `Admin changed student ${req.params.studentId} to day_scholar`, req,
    });
    res.json({ success: true, message: 'Student removed from hostel. Status changed to day scholar.' });
  } catch (err) { next(err); }
});

export default router;
