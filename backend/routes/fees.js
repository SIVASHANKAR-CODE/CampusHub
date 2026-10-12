import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { createAuditLog } from '../services/auditService.js';

const router = Router();
router.use(authenticate);

// In-memory store for mock/demo fee state (persists across requests during server session)
const mockFeeStore = new Map();

function getOrCreateMockFee() {
  if (!mockFeeStore.has('mock_fee_001')) {
    mockFeeStore.set('mock_fee_001', {
      _id: 'mock_fee_001',
      semester: 3,
      academicYear: '2025-2026',
      totalFee: 75000,
      paidAmount: 40000,
      dueAmount: 35000,
      status: 'partial',
      dueDate: new Date(Date.now() + 15 * 86400000),
      tuitionFee: 50000,
      hostelFee: 15000,
      transportFee: 0,
      labFee: 5000,
      examFee: 5000,
      payments: [
        { amount: 40000, paymentDate: new Date(), paymentMethod: 'UPI', transactionId: 'TXN1029384756', description: 'Advance installment' }
      ],
      transactionHistory: [
        { amount: 40000, date: new Date(), referenceNo: 'TXN1029384756', method: 'UPI', description: 'Advance installment' }
      ],
    });
  }
  return mockFeeStore.get('mock_fee_001');
}

// Student: get own fees
router.get('/', requireRole('student'), async (req, res, next) => {
  try {
    if (typeof req.user?.id === 'string' && req.user.id.startsWith('mock_')) {
      const mockFee = getOrCreateMockFee();
      return res.json({
        success: true,
        message: 'Fees fetched (Demo Mode).',
        data: [mockFee],
      });
    }

    await connectDB();
    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { semester } = req.query;
    const filter = { studentId: student._id };
    if (semester) filter.semester = parseInt(semester);

    const fees = await Fee.find(filter).sort({ semester: -1 }).lean();
    res.json({ success: true, message: 'Fees fetched.', data: fees });
  } catch (err) { next(err); }
});

// Admin: get fees for any student
router.get('/student/:studentId', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const fees = await Fee.find({ studentId: req.params.studentId }).sort({ semester: -1 }).lean();
    res.json({ success: true, message: 'Fees fetched.', data: fees });
  } catch (err) { next(err); }
});

// Admin: create/update fee record
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    let { studentId, registrationNumber, regNo, semester, academicYear, tuitionFee, hostelFee, transportFee, labFee, examFee, otherFee, dueDate, remarks } = req.body;

    let student = null;
    if (studentId) {
      student = await Student.findById(studentId);
    }
    if (!student && (registrationNumber || regNo)) {
      const reg = (registrationNumber || regNo).trim();
      student = await Student.findOne({ $or: [{ regNo: reg }, { registrationNumber: reg }] });
      if (student) studentId = student._id;
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const tFee = Number(tuitionFee) || 0;
    const hFee = Number(hostelFee) || 0;
    const trFee = Number(transportFee) || 0;
    const lFee = Number(labFee) || 0;
    const eFee = Number(examFee) || 0;
    const oFee = Number(otherFee) || 0;
    const total = tFee + hFee + trFee + lFee + eFee + oFee;

    // Check if record already exists to preserve paid amount
    const existing = await Fee.findOne({ studentId, semester: parseInt(semester), academicYear });
    const paid = existing?.paidAmount || 0;
    const due = Math.max(0, total - paid);
    const status = due === 0 && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

    const fee = await Fee.findOneAndUpdate(
      { studentId, semester: parseInt(semester), academicYear },
      {
        regNo: student.regNo,
        registrationNumber: student.registrationNumber || student.regNo,
        tuitionFee: tFee,
        hostelFee: hFee,
        transportFee: trFee,
        labFee: lFee,
        examFee: eFee,
        otherFee: oFee,
        totalFee: total,
        paidAmount: paid,
        dueAmount: due,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        remarks: remarks || existing?.remarks || '',
        lastUpdatedBy: req.user.id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    await createAuditLog({
      actor: req.user.id, actorEmail: req.user.email, actorRole: 'admin',
      action: 'UPDATE_FEE', resource: 'Fee', resourceId: fee._id,
      description: `Admin set fee for student ${student.regNo}, semester ${semester}`, req,
    });

    res.json({ success: true, message: 'Fee record saved successfully.', data: fee });
  } catch (err) { next(err); }
});

// Record payment (Admin or Student for own fee)
router.post('/:id/payment', requireRole('admin', 'student'), async (req, res, next) => {
  try {
    const { amount, referenceNo, method, date, description } = req.body;

    // Handle mock/demo users — they receive mock fee IDs like 'mock_fee_001'
    // which are not valid MongoDB ObjectIds and would cause a CastError.
    if (typeof req.user?.id === 'string' && req.user.id.startsWith('mock_')) {
      const payAmount = Number(amount);
      if (!payAmount || payAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
      }

      // Update the shared in-memory mock fee state
      const mockFee = getOrCreateMockFee();
      mockFee.paidAmount = (mockFee.paidAmount || 0) + payAmount;
      mockFee.dueAmount = Math.max(0, mockFee.totalFee - mockFee.paidAmount);
      mockFee.status = mockFee.dueAmount === 0 ? 'paid' : mockFee.paidAmount > 0 ? 'partial' : 'pending';
      mockFee.transactionHistory.push({
        amount: payAmount,
        date: date ? new Date(date) : new Date(),
        referenceNo: referenceNo || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        method: method || 'UPI / NetBanking',
        description: description || 'Student Online Settlement (Demo Mode)',
      });
      mockFee.payments.push({
        amount: payAmount,
        paymentDate: new Date(),
        paymentMethod: method || 'UPI',
        transactionId: referenceNo || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: description || 'Student Online Settlement (Demo Mode)',
      });

      return res.json({ success: true, message: 'Payment recorded successfully (Demo Mode).', data: mockFee });
    }

    await connectDB();
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id }).lean();
      if (!student || fee.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only settle your own fees.' });
      }
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    fee.paidAmount = (fee.paidAmount || 0) + payAmount;
    fee.dueAmount = Math.max(0, (fee.totalFee || 0) - fee.paidAmount);
    fee.status = fee.dueAmount === 0 ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'pending';
    fee.transactionHistory.push({
      amount: payAmount,
      date: date ? new Date(date) : new Date(),
      referenceNo: referenceNo || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      method: method || (req.user.role === 'student' ? 'UPI / NetBanking' : 'Cash / Admin'),
      description: description || (req.user.role === 'student' ? 'Student Online Settlement' : 'Admin Recorded Payment'),
    });
    fee.lastUpdatedBy = req.user.id;
    await fee.save();

    await createAuditLog({
      actor: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'RECORD_FEE_PAYMENT',
      resource: 'Fee',
      resourceId: fee._id,
      description: `Payment of ₹${payAmount} recorded for fee ${fee._id} by ${req.user.email}`,
      req,
    });

    res.json({ success: true, message: 'Payment recorded successfully.', data: fee });
  } catch (err) { next(err); }
});

export default router;
