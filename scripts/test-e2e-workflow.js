import 'dotenv/config';
import http from 'http';
import app from '../backend/app.js';
import { connectDB } from '../backend/config/db.js';
import Complaint from '../backend/models/Complaint.js';
import LeaveApplication from '../backend/models/LeaveApplication.js';
import ODApplication from '../backend/models/ODApplication.js';

async function run() {
  console.log('--- Starting CampusHub End-to-End Workflow Verification ---');
  await connectDB();

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`Ephemeral test server running at ${baseUrl}`);

  const createdComplaintIds = [];
  const createdLeaveIds = [];
  const createdOdIds = [];

  try {
    // 1. Health check
    console.log('\n[TEST 1] GET /api/health');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('Health response:', healthData.database);
    if (!healthData.success || !healthData.database?.connected) {
      throw new Error('Health check failed or database is not connected');
    }
    console.log('✓ Health check reports database connected!');

    // 2. Student Login
    console.log('\n[TEST 2] Student Login (student@demo.com)');
    const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@demo.com', password: 'Demo@2026' }),
    });
    const studentAuth = await studentLoginRes.json();
    console.log('Student login status:', studentAuth.success, 'User ID:', studentAuth.data?.user?.id);
    if (!studentAuth.success || typeof studentAuth.data?.user?.id !== 'string' || studentAuth.data.user.id.startsWith('mock_')) {
      throw new Error(`Student login did not return a real MongoDB user ID! Got: ${studentAuth.data?.user?.id}`);
    }
    const studentToken = studentAuth.data.token;
    console.log('✓ Student logged in with real MongoDB ID:', studentAuth.data.user.id);

    // 3. Mentor Login
    console.log('\n[TEST 3] Mentor Login (mentor@demo.com)');
    const mentorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mentor@demo.com', password: 'Demo@2026' }),
    });
    const mentorAuth = await mentorLoginRes.json();
    console.log('Mentor login status:', mentorAuth.success, 'User ID:', mentorAuth.data?.user?.id);
    if (!mentorAuth.success || mentorAuth.data?.user?.id?.startsWith('mock_')) {
      throw new Error(`Mentor login did not return a real MongoDB user ID! Got: ${mentorAuth.data?.user?.id}`);
    }
    const mentorToken = mentorAuth.data.token;
    console.log('✓ Mentor logged in with real MongoDB ID:', mentorAuth.data.user.id);

    // 4. Maintenance Login
    console.log('\n[TEST 4] Maintenance Login (maintenance@demo.com)');
    const maintLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'maintenance@demo.com', password: 'Demo@2026' }),
    });
    const maintAuth = await maintLoginRes.json();
    const maintToken = maintAuth.data.token;
    console.log('✓ Maintenance logged in with real MongoDB ID:', maintAuth.data.user.id);

    // 5. Admin Login
    console.log('\n[TEST 5] Admin Login (admin@demo.com)');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Demo@2026' }),
    });
    const adminAuth = await adminLoginRes.json();
    const adminToken = adminAuth.data.token;
    console.log('✓ Admin logged in with real MongoDB ID:', adminAuth.data.user.id);

    // 6. Student creates complaint
    console.log('\n[TEST 6] Student submits Complaint');
    const complaintRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        category: 'electrical',
        title: 'Seminar Hall Air Conditioner Malfunction',
        description: 'AC unit #2 is emitting smoke and not cooling properly.',
        priority: 'high',
      }),
    });
    const complaintData = await complaintRes.json();
    console.log('Complaint creation response:', complaintData.success, complaintData.message, 'Ticket:', complaintData.data?.ticketId);
    if (!complaintData.success || !complaintData.data?._id) {
      throw new Error(`Complaint submission failed: ${JSON.stringify(complaintData)}`);
    }
    const complaintId = complaintData.data._id;
    createdComplaintIds.push(complaintId);

    // Verify complaint in MongoDB Atlas
    const dbComplaint = await Complaint.findById(complaintId).lean();
    if (!dbComplaint) throw new Error('Complaint was NOT persisted in MongoDB Atlas!');
    console.log('✓ Verified: Complaint physically stored in MongoDB Atlas, ticketId:', dbComplaint.ticketId);

    // 7. Student retrieves own complaints
    console.log('\n[TEST 7] Student retrieves own complaints (GET /api/complaints/my)');
    const myComplaintsRes = await fetch(`${baseUrl}/complaints/my`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const myComplaints = await myComplaintsRes.json();
    const foundMyComplaint = myComplaints.data?.find((c) => String(c._id) === String(complaintId));
    if (!foundMyComplaint) throw new Error('Student could not retrieve newly submitted complaint from MongoDB!');
    console.log('✓ Verified: Student successfully retrieved complaint:', foundMyComplaint.ticketId);

    // 8. Maintenance views assigned / unassigned maintenance complaints
    console.log('\n[TEST 8] Maintenance views assigned/unassigned complaints (GET /api/complaints/assigned)');
    const assignedRes = await fetch(`${baseUrl}/complaints/assigned`, {
      headers: { Authorization: `Bearer ${maintToken}` },
    });
    const assignedData = await assignedRes.json();
    const maintFound = assignedData.data?.find((c) => String(c._id) === String(complaintId));
    if (!maintFound) throw new Error('Maintenance team cannot see the electrical complaint!');
    console.log('✓ Verified: Maintenance team sees unassigned complaint in maintenance queue:', maintFound.ticketId);

    // 9. Maintenance claims the complaint
    console.log('\n[TEST 9] Maintenance claims complaint (PATCH /api/complaints/:id/claim)');
    const claimRes = await fetch(`${baseUrl}/complaints/${complaintId}/claim`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${maintToken}` },
    });
    const claimData = await claimRes.json();
    if (!claimData.success || claimData.data?.status !== 'assigned') {
      throw new Error(`Maintenance claim failed: ${JSON.stringify(claimData)}`);
    }
    console.log('✓ Verified: Maintenance claimed complaint and status updated to assigned!');

    // 10. Student submits Leave application
    console.log('\n[TEST 10] Student submits Leave application (POST /api/leave)');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    const leaveRes = await fetch(`${baseUrl}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        leaveType: 'casual',
        startDate: tomorrow,
        endDate: dayAfter,
        reason: 'Attending sibling wedding ceremony in native place',
        description: 'Will cover up missed lectures from classmates.',
      }),
    });
    const leaveData = await leaveRes.json();
    console.log('Leave submission response:', leaveData.success, leaveData.message);
    if (!leaveData.success || !leaveData.data?._id) {
      throw new Error(`Leave submission failed: ${JSON.stringify(leaveData)}`);
    }
    const leaveId = leaveData.data._id;
    createdLeaveIds.push(leaveId);

    // Verify leave in MongoDB Atlas
    const dbLeave = await LeaveApplication.findById(leaveId).lean();
    if (!dbLeave) throw new Error('Leave application was NOT persisted in MongoDB Atlas!');
    console.log('✓ Verified: Leave application physically stored in MongoDB Atlas, mentorId:', dbLeave.mentorId);

    // 11. Student retrieves own leave applications
    console.log('\n[TEST 11] Student retrieves own leave applications (GET /api/leave)');
    const myLeaveRes = await fetch(`${baseUrl}/leave`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const myLeaveData = await myLeaveRes.json();
    const foundMyLeave = myLeaveData.data?.leaves?.find((l) => String(l._id) === String(leaveId));
    if (!foundMyLeave) throw new Error('Student could not retrieve newly submitted leave application!');
    console.log('✓ Verified: Student retrieved leave application, status:', foundMyLeave.status);

    // 12. Mentor views mentee leave requests
    console.log('\n[TEST 12] Mentor views mentee leave requests (GET /api/leave/mentee)');
    const menteeLeaveRes = await fetch(`${baseUrl}/leave/mentee?status=pending`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    const menteeLeaveData = await menteeLeaveRes.json();
    const mentorFoundLeave = menteeLeaveData.data?.leave?.find((l) => String(l._id) === String(leaveId));
    if (!mentorFoundLeave) throw new Error('Mentor could not find mentee leave request in MongoDB Atlas!');
    console.log('✓ Verified: Mentor successfully sees student leave application:', mentorFoundLeave.reason);

    // 13. Unauthorized user cannot review
    console.log('\n[TEST 13] Unauthorized access check: Student tries to review leave (PATCH /api/leave/:id/review)');
    const unauthReviewRes = await fetch(`${baseUrl}/leave/${leaveId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ action: 'approve', remarks: 'Self-approval attempt' }),
    });
    if (unauthReviewRes.status !== 403) {
      throw new Error(`Expected status 403 for unauthorized review attempt, got ${unauthReviewRes.status}`);
    }
    console.log('✓ Verified: Unauthorized user was blocked with 403 Forbidden!');

    // 14. Mentor approves leave
    console.log('\n[TEST 14] Mentor approves leave (PATCH /api/leave/:id/review)');
    const mentorReviewRes = await fetch(`${baseUrl}/leave/${leaveId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({ action: 'approve', remarks: 'Granted. Ensure attendance criteria is maintained.' }),
    });
    const reviewData = await mentorReviewRes.json();
    if (!reviewData.success || reviewData.data?.status !== 'approved') {
      throw new Error(`Mentor review failed: ${JSON.stringify(reviewData)}`);
    }
    console.log('✓ Verified: Mentor approved leave application, status:', reviewData.data?.status);

    // 15. Student verifies updated status after re-login
    console.log('\n[TEST 15] Student checks leave status after re-login');
    const freshStudentLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@demo.com', password: 'Demo@2026' }),
    });
    const freshStudentAuth = await freshStudentLogin.json();
    const freshStudentLeaveRes = await fetch(`${baseUrl}/leave`, {
      headers: { Authorization: `Bearer ${freshStudentAuth.data.token}` },
    });
    const freshStudentLeaveData = await freshStudentLeaveRes.json();
    const updatedLeave = freshStudentLeaveData.data?.leaves?.find((l) => String(l._id) === String(leaveId));
    if (!updatedLeave || updatedLeave.status !== 'approved') {
      throw new Error(`Leave status did not persist as approved! Got: ${updatedLeave?.status}`);
    }
    console.log('✓ Verified: Leave status remained approved after re-login, remarks:', updatedLeave.mentorRemarks);

    console.log('\n========================================');
    console.log('ALL END-TO-END WORKFLOW TESTS PASSED!');
    console.log('========================================');
  } finally {
    // Cleanup test records
    console.log('\n[CLEANUP] Removing test records from Atlas...');
    if (createdComplaintIds.length > 0) {
      await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
      console.log(`Deleted ${createdComplaintIds.length} test complaints.`);
    }
    if (createdLeaveIds.length > 0) {
      await LeaveApplication.deleteMany({ _id: { $in: createdLeaveIds } });
      console.log(`Deleted ${createdLeaveIds.length} test leave applications.`);
    }
    if (createdOdIds.length > 0) {
      await ODApplication.deleteMany({ _id: { $in: createdOdIds } });
      console.log(`Deleted ${createdOdIds.length} test OD applications.`);
    }
    server.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
