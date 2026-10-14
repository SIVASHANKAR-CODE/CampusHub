import 'dotenv/config';
import http from 'http';
import app from '../backend/app.js';
import { connectDB } from '../backend/config/db.js';
import User from '../backend/models/User.js';
import Student from '../backend/models/Student.js';
import MediaFile from '../backend/models/MediaFile.js';
import Complaint from '../backend/models/Complaint.js';

// Minimal 1x1 transparent PNG buffer
const TEST_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function runTests() {
  console.log('======================================================');
  console.log('   CampusHub Image & Photo Persistence Test Suite');
  console.log('======================================================\n');

  await connectDB();
  console.log('✓ Connected to MongoDB Atlas successfully.\n');

  // Launch test HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  try {
    // -----------------------------------------------------------------
    // TEST 1: Student Login & Initial Profile State
    // -----------------------------------------------------------------
    console.log('[TEST 1] Logging in as student (student@demo.com)...');
    const loginRes1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@demo.com', password: 'Demo@2026' }),
    });
    const auth1 = await loginRes1.json();
    if (!auth1.success) throw new Error('Student login failed: ' + auth1.message);
    const studentToken = auth1.data.token;
    const studentId = auth1.data.user.id;
    console.log(`✓ Student authenticated. User ID: ${studentId}\n`);

    // -----------------------------------------------------------------
    // TEST 2: Upload Profile Photo via Multipart Form
    // -----------------------------------------------------------------
    console.log('[TEST 2] Uploading a profile photo buffer via POST /api/upload...');
    const formData = new FormData();
    const blob = new Blob([TEST_PNG_BUFFER], { type: 'image/png' });
    formData.append('file', blob, 'avatar-test.png');

    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error('File upload failed: ' + uploadData.message);
    const uploadedUrl = uploadData.data?.url;
    const uploadedFilename = uploadData.data?.filename;
    console.log(`✓ File uploaded successfully!`);
    console.log(`  - URL: ${uploadedUrl}`);
    console.log(`  - Filename: ${uploadedFilename}`);
    console.log(`  - Provider: ${uploadData.data?.provider}\n`);

    // -----------------------------------------------------------------
    // TEST 3: Verify Direct Image Retrieval & Caching Headers
    // -----------------------------------------------------------------
    console.log('[TEST 3] Fetching image from server via direct URL...');
    const directFetchUrl = uploadedUrl.startsWith('http') ? uploadedUrl : `${baseUrl}${uploadedUrl}`;
    const fileFetchRes = await fetch(directFetchUrl);
    if (!fileFetchRes.ok) throw new Error(`Direct image fetch returned status ${fileFetchRes.status}`);
    const fetchedContentType = fileFetchRes.headers.get('content-type');
    const fetchedCacheControl = fileFetchRes.headers.get('cache-control');
    const fetchedBuffer = Buffer.from(await fileFetchRes.arrayBuffer());
    console.log(`✓ Direct image served successfully!`);
    console.log(`  - Content-Type: ${fetchedContentType}`);
    console.log(`  - Cache-Control: ${fetchedCacheControl}`);
    console.log(`  - Bytes received: ${fetchedBuffer.length} (expected: ${TEST_PNG_BUFFER.length})\n`);

    // -----------------------------------------------------------------
    // TEST 4: Verify MongoDB MediaFile Collection Persistence
    // -----------------------------------------------------------------
    console.log('[TEST 4] Inspecting MongoDB Atlas MediaFile collection...');
    const mediaDoc = await MediaFile.findOne({ filename: uploadedFilename }).lean();
    if (!mediaDoc) throw new Error(`MediaFile document not found in MongoDB for ${uploadedFilename}`);
    console.log(`✓ MediaFile record verified in MongoDB Atlas.`);
    console.log(`  - Stored size: ${mediaDoc.size} bytes`);
    console.log(`  - Binary data buffer present: ${Boolean(mediaDoc.data)}\n`);

    // -----------------------------------------------------------------
    // TEST 5: Save Profile Photo to Student Profile
    // -----------------------------------------------------------------
    console.log('[TEST 5] Updating Student Profile with new photoUrl...');
    const profileUpdateRes = await fetch(`${baseUrl}/api/students/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ photoUrl: uploadedUrl }),
    });
    const updateData = await profileUpdateRes.json();
    if (!updateData.success) throw new Error('Student profile update failed: ' + updateData.message);
    console.log(`✓ Student profile updated in API response. photoUrl: ${updateData.data?.photoUrl}\n`);

    // Verify in MongoDB Atlas directly
    const studentDoc = await Student.findOne({ userId: studentId }).lean();
    const userDoc = await User.findById(studentId).lean();
    if (studentDoc.photoUrl !== uploadedUrl) {
      throw new Error(`Student document photoUrl mismatch: expected ${uploadedUrl}, got ${studentDoc.photoUrl}`);
    }
    if (userDoc.photoUrl !== uploadedUrl) {
      throw new Error(`User document photoUrl mismatch: expected ${uploadedUrl}, got ${userDoc.photoUrl}`);
    }
    console.log(`✓ MongoDB Atlas persistence confirmed on both Student and User documents!\n`);

    // -----------------------------------------------------------------
    // TEST 6: Simulate Client Logout and Login Again
    // -----------------------------------------------------------------
    console.log('[TEST 6] Simulating complete Logout and fresh Re-Login...');
    // 1. Logout endpoint
    await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });

    // 2. Re-login with credentials
    const reLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@demo.com', password: 'Demo@2026' }),
    });
    const reAuth = await reLoginRes.json();
    if (!reAuth.success) throw new Error('Re-login failed: ' + reAuth.message);
    const freshToken = reAuth.data.token;
    const freshUserPhoto = reAuth.data.user.photoUrl;
    const freshProfilePhoto = reAuth.data.profile.photoUrl;

    if (freshUserPhoto !== uploadedUrl) {
      throw new Error(`Photo disappeared after re-login! user.photoUrl is: ${freshUserPhoto}`);
    }
    if (freshProfilePhoto !== uploadedUrl) {
      throw new Error(`Photo disappeared after re-login! profile.photoUrl is: ${freshProfilePhoto}`);
    }
    console.log(`✓ Photo successfully retrieved after logout and login!`);
    console.log(`  - user.photoUrl: ${freshUserPhoto}`);
    console.log(`  - profile.photoUrl: ${freshProfilePhoto}\n`);

    // -----------------------------------------------------------------
    // TEST 7: Verify GET /api/auth/me Returns Persisted Photo
    // -----------------------------------------------------------------
    console.log('[TEST 7] Calling GET /api/auth/me to verify session restore...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    const meData = await meRes.json();
    if (!meData.success) throw new Error('GET /api/auth/me failed');
    if (meData.data.user.photoUrl !== uploadedUrl || meData.data.profile.photoUrl !== uploadedUrl) {
      throw new Error(`GET /api/auth/me returned mismatched photoUrl: ${meData.data.user.photoUrl}`);
    }
    console.log(`✓ GET /api/auth/me returned persisted photoUrl for both user and profile!\n`);

    // -----------------------------------------------------------------
    // TEST 8: Unrelated Profile Updates Preserve the Saved Photo
    // -----------------------------------------------------------------
    console.log('[TEST 8] Performing unrelated profile update (phone only)...');
    const phoneUpdateRes = await fetch(`${baseUrl}/api/students/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken}`,
      },
      body: JSON.stringify({ phone: '+91 99999 88888' }),
    });
    const phoneData = await phoneUpdateRes.json();
    if (!phoneData.success) throw new Error('Phone update failed');
    if (phoneData.data.photoUrl !== uploadedUrl) {
      throw new Error(`Photo URL was erased during unrelated profile update! Got: ${phoneData.data.photoUrl}`);
    }
    console.log(`✓ Unrelated update preserved photoUrl: ${phoneData.data.photoUrl}\n`);

    // -----------------------------------------------------------------
    // TEST 9: Admin Profile Photo Persistence
    // -----------------------------------------------------------------
    console.log('[TEST 9] Testing Admin profile photo persistence...');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Demo@2026' }),
    });
    const adminAuth = await adminLoginRes.json();
    const adminToken = adminAuth.data.token;

    // Upload admin photo
    const adminFormData = new FormData();
    adminFormData.append('file', new Blob([TEST_PNG_BUFFER], { type: 'image/png' }), 'admin-avatar.png');
    const adminUploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: adminFormData,
    });
    const adminUploadData = await adminUploadRes.json();
    const adminPhotoUrl = adminUploadData.data?.url;

    // Update admin profile via PATCH /api/auth/profile
    const adminUpdateRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ photoUrl: adminPhotoUrl }),
    });
    const adminUpdated = await adminUpdateRes.json();
    if (!adminUpdated.success) throw new Error('Admin profile update failed: ' + adminUpdated.message);

    // Re-login as Admin
    const adminReLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Demo@2026' }),
    });
    const adminReAuth = await adminReLogin.json();
    if (adminReAuth.data.user.photoUrl !== adminPhotoUrl || adminReAuth.data.profile.photoUrl !== adminPhotoUrl) {
      throw new Error(`Admin photo disappeared after re-login! Got: ${adminReAuth.data.user.photoUrl}`);
    }
    console.log(`✓ Admin photo persisted across re-login: ${adminReAuth.data.user.photoUrl}\n`);

    // -----------------------------------------------------------------
    // TEST 10: Maintenance Staff Profile Photo Persistence
    // -----------------------------------------------------------------
    console.log('[TEST 10] Testing Maintenance staff profile photo persistence...');
    const maintLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'maintenance@demo.com', password: 'Demo@2026' }),
    });
    const maintAuth = await maintLoginRes.json();
    const maintToken = maintAuth.data.token;

    // Upload maintenance photo
    const maintFormData = new FormData();
    maintFormData.append('file', new Blob([TEST_PNG_BUFFER], { type: 'image/png' }), 'maint-avatar.png');
    const maintUploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${maintToken}` },
      body: maintFormData,
    });
    const maintUploadData = await maintUploadRes.json();
    const maintPhotoUrl = maintUploadData.data?.url;

    // Update maintenance profile via PATCH /api/auth/profile
    const maintUpdateRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${maintToken}`,
      },
      body: JSON.stringify({ photoUrl: maintPhotoUrl }),
    });
    const maintUpdated = await maintUpdateRes.json();
    if (!maintUpdated.success) throw new Error('Maintenance profile update failed: ' + maintUpdated.message);

    // Re-login as Maintenance
    const maintReLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'maintenance@demo.com', password: 'Demo@2026' }),
    });
    const maintReAuth = await maintReLogin.json();
    if (maintReAuth.data.user.photoUrl !== maintPhotoUrl || maintReAuth.data.profile.photoUrl !== maintPhotoUrl) {
      throw new Error(`Maintenance photo disappeared after re-login! Got: ${maintReAuth.data.user.photoUrl}`);
    }
    console.log(`✓ Maintenance staff photo persisted across re-login: ${maintReAuth.data.user.photoUrl}\n`);

    // -----------------------------------------------------------------
    // TEST 11: Invalid Upload Rejection
    // -----------------------------------------------------------------
    console.log('[TEST 11] Testing invalid file upload rejection (text/html)...');
    const invalidForm = new FormData();
    invalidForm.append('file', new Blob(['<h1>malicious</h1>'], { type: 'text/html' }), 'exploit.html');
    const invalidRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` },
      body: invalidForm,
    });
    const invalidData = await invalidRes.json();
    if (invalidRes.ok || invalidData.success) {
      throw new Error('Invalid file format was unexpectedly accepted!');
    }
    console.log(`✓ Invalid upload safely rejected: ${invalidData.message}\n`);

    // -----------------------------------------------------------------
    // TEST 12: Student Complaint Creation with Proof Photo
    // -----------------------------------------------------------------
    console.log('[TEST 12] Creating a student complaint with proof photo...');
    const complaintForm = new FormData();
    complaintForm.append('title', 'Water leakage in Lab 304');
    complaintForm.append('category', 'plumbing');
    complaintForm.append('priority', 'high');
    complaintForm.append('description', 'Continuous pipe leakage near workbench 3 causing water pooling.');
    complaintForm.append('photo', new Blob([TEST_PNG_BUFFER], { type: 'image/png' }), 'water-leak.png');

    const complaintRes = await fetch(`${baseUrl}/api/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` },
      body: complaintForm,
    });
    const complaintData = await complaintRes.json();
    if (!complaintRes.ok || !complaintData.success) {
      throw new Error('Complaint creation with photo failed: ' + complaintData.message);
    }
    const createdComplaint = complaintData.data;
    if (!createdComplaint.imageUrl) {
      throw new Error('Complaint created but imageUrl is missing!');
    }
    console.log(`✓ Complaint created: ${createdComplaint.ticketId}, imageUrl: ${createdComplaint.imageUrl}`);

    // Verify imageUrl is directly servable
    const imgFetch = await fetch(`${baseUrl}${createdComplaint.imageUrl}`);
    if (imgFetch.status !== 200) {
      throw new Error(`Direct fetch of complaint imageUrl failed with status ${imgFetch.status}`);
    }
    const imgBytes = await imgFetch.arrayBuffer();
    if (imgBytes.byteLength !== TEST_PNG_BUFFER.length) {
      throw new Error(`Complaint image bytes mismatch: got ${imgBytes.byteLength}, expected ${TEST_PNG_BUFFER.length}`);
    }
    console.log(`✓ Complaint image served successfully (${imgBytes.byteLength} bytes)\n`);

    // -----------------------------------------------------------------
    // TEST 13: Maintenance Resolution Proof Upload
    // -----------------------------------------------------------------
    console.log('[TEST 13] Testing maintenance resolution proof upload...');
    const resolveForm = new FormData();
    resolveForm.append('status', 'resolved');
    resolveForm.append('note', 'Pipe fitting replaced and verified dry.');
    resolveForm.append('photo', new Blob([TEST_PNG_BUFFER], { type: 'image/png' }), 'pipe-fixed.png');

    const resolveRes = await fetch(`${baseUrl}/api/complaints/${createdComplaint._id}/progress`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${maintToken}` },
      body: resolveForm,
    });
    const resolveData = await resolveRes.json();
    if (!resolveRes.ok || !resolveData.success) {
      throw new Error('Maintenance resolution failed: ' + resolveData.message);
    }
    if (!resolveData.data.resolutionImageUrl) {
      throw new Error('Resolution succeeded but resolutionImageUrl is missing!');
    }
    console.log(`✓ Complaint marked resolved with resolutionImageUrl: ${resolveData.data.resolutionImageUrl}`);

    const resImgFetch = await fetch(`${baseUrl}${resolveData.data.resolutionImageUrl}`);
    if (resImgFetch.status !== 200) {
      throw new Error(`Direct fetch of resolutionImageUrl failed with status ${resImgFetch.status}`);
    }
    console.log(`✓ Resolution proof image served successfully (status 200)\n`);

    // -----------------------------------------------------------------
    // TEST 14: Graceful Missing Legacy File Fallback
    // -----------------------------------------------------------------
    console.log('[TEST 14] Testing graceful fallback for genuinely missing legacy files...');
    // JSON request
    const missingJsonRes = await fetch(`${baseUrl}/uploads/nonexistent-legacy-test.png`, {
      headers: { Accept: 'application/json' },
    });
    if (missingJsonRes.status !== 404) {
      throw new Error(`Missing file JSON request should return 404, got: ${missingJsonRes.status}`);
    }
    const missingJson = await missingJsonRes.json();
    if (missingJson.success !== false) {
      throw new Error('Missing file JSON response should have success: false');
    }
    console.log(`✓ Missing file JSON request safely returns 404: ${missingJson.message}`);

    // Direct browser document request (HTML)
    const missingHtmlRes = await fetch(`${baseUrl}/uploads/nonexistent-legacy-test.png`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Sec-Fetch-Dest': 'document',
      },
    });
    if (missingHtmlRes.status !== 404) {
      throw new Error(`Missing file HTML request should return 404, got: ${missingHtmlRes.status}`);
    }
    const missingHtml = await missingHtmlRes.text();
    if (!missingHtml.includes('Proof Image Unavailable') || !missingHtml.includes('Return to CampusHub')) {
      throw new Error('Missing file did not return user-friendly CampusHub fallback page');
    }
    console.log('✓ Missing file browser request safely returns styled CampusHub fallback page\n');

    // -----------------------------------------------------------------
    // TEST 15: Verifying Accessible Migrated MediaFiles
    // -----------------------------------------------------------------
    console.log('[TEST 15] Verifying migrated local files in MongoDB MediaFile...');
    const sampleMedia = await MediaFile.findOne({ filename: /^file-/ }).lean();
    if (!sampleMedia) {
      throw new Error('No MediaFile records found in database!');
    }
    const sampleFetch = await fetch(`${baseUrl}/uploads/${sampleMedia.filename}`);
    if (sampleFetch.status !== 200) {
      throw new Error(`Failed to fetch migrated media file: ${sampleMedia.filename}`);
    }
    console.log(`✓ Migrated MediaFile verified and served: ${sampleMedia.filename} (status 200)\n`);

    console.log('======================================================');
    console.log('   ALL 15 PERSISTENCE & COMPLAINT TESTS PASSED!   ');
    console.log('======================================================');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
