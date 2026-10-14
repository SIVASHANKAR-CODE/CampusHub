import 'dotenv/config';
import { v2 as cloudinary } from '../backend/node_modules/cloudinary/cloudinary.js';
import { connectDB } from '../backend/config/db.js';
import MediaFile from '../backend/models/MediaFile.js';
import {
  extractCloudinaryAssetInfo,
  deleteStoredFile,
} from '../backend/services/storageService.js';

async function runTests() {
  console.log('======================================================');
  console.log('   Storage Service: deleteStoredFile Test Suite');
  console.log('======================================================\n');

  await connectDB();
  console.log('✓ Connected to database.\n');

  // Track all test-created document IDs for guaranteed cleanup
  const testCreatedIds = [];

  // Save original environment
  const originalEnvCloud = process.env.CLOUDINARY_CLOUD_NAME;
  const originalEnvKey = process.env.CLOUDINARY_API_KEY;
  const originalEnvSecret = process.env.CLOUDINARY_API_SECRET;
  const originalEnvUrl = process.env.CLOUDINARY_URL;
  const originalDestroy = cloudinary.uploader.destroy;

  const restoreEnv = () => {
    cloudinary.uploader.destroy = originalDestroy;
    if (originalEnvCloud !== undefined) process.env.CLOUDINARY_CLOUD_NAME = originalEnvCloud;
    else delete process.env.CLOUDINARY_CLOUD_NAME;
    if (originalEnvKey !== undefined) process.env.CLOUDINARY_API_KEY = originalEnvKey;
    else delete process.env.CLOUDINARY_API_KEY;
    if (originalEnvSecret !== undefined) process.env.CLOUDINARY_API_SECRET = originalEnvSecret;
    else delete process.env.CLOUDINARY_API_SECRET;
    if (originalEnvUrl !== undefined) process.env.CLOUDINARY_URL = originalEnvUrl;
    else delete process.env.CLOUDINARY_URL;
  };

  const setMockCredentials = () => {
    delete process.env.CLOUDINARY_URL;
    process.env.CLOUDINARY_CLOUD_NAME = 'mock_campus_cloud';
    process.env.CLOUDINARY_API_KEY = 'mock_campus_key';
    process.env.CLOUDINARY_API_SECRET = 'mock_campus_secret';
  };

  const clearCredentials = () => {
    delete process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  };

  try {
    // -----------------------------------------------------------------
    // 1. URL Parser Unit Tests (Subdomain, Traversal, Encoding, Video)
    // -----------------------------------------------------------------
    console.log('[TEST 1] Testing extractCloudinaryAssetInfo URL parsing...');

    // Nested folder with version
    const u1 = extractCloudinaryAssetInfo(
      'https://res.cloudinary.com/campushub/image/upload/v1792004323/campushub/avatars/file-12345.png'
    );
    if (u1?.publicId !== 'campushub/avatars/file-12345' || u1?.resourceType !== 'image') {
      throw new Error(`Failed nested folder parse: ${JSON.stringify(u1)}`);
    }
    console.log('✓ Nested folder with version parsed correctly:', u1.publicId);

    // Transformed URL
    const u2 = extractCloudinaryAssetInfo(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_300/v1570979139/campushub/proofs/file-999.jpg'
    );
    if (u2?.publicId !== 'campushub/proofs/file-999') {
      throw new Error(`Failed transformed URL parse: ${JSON.stringify(u2)}`);
    }
    console.log('✓ Transformed URL parsed correctly:', u2.publicId);

    // Video resource type
    const uVideo = extractCloudinaryAssetInfo(
      'https://res.cloudinary.com/demo/video/upload/v12345/campushub/videos/intro.mp4'
    );
    if (uVideo?.publicId !== 'campushub/videos/intro' || uVideo?.resourceType !== 'video') {
      throw new Error(`Failed video parse: ${JSON.stringify(uVideo)}`);
    }
    console.log('✓ Video asset parsed correctly:', uVideo.publicId, `(${uVideo.resourceType})`);

    // Raw / PDF asset
    const u4 = extractCloudinaryAssetInfo(
      'https://res.cloudinary.com/demo/raw/upload/v12345/campushub/docs/syllabus.pdf'
    );
    if (u4?.publicId !== 'campushub/docs/syllabus' || u4?.resourceType !== 'raw') {
      throw new Error(`Failed raw PDF parse: ${JSON.stringify(u4)}`);
    }
    console.log('✓ Raw PDF asset parsed correctly:', u4.publicId, `(${u4.resourceType})`);

    // Lookalike hostnames (MUST be rejected)
    if (extractCloudinaryAssetInfo('https://evilcloudinary.com/demo/image/upload/v1/pic.jpg') !== null) {
      throw new Error('Lookalike hostname evilcloudinary.com was not rejected!');
    }
    if (extractCloudinaryAssetInfo('https://fake-cloudinary.com/demo/image/upload/v1/pic.jpg') !== null) {
      throw new Error('Lookalike hostname fake-cloudinary.com was not rejected!');
    }
    console.log('✓ Lookalike domains safely rejected.');

    // Encoded traversal attempts (MUST be rejected)
    if (extractCloudinaryAssetInfo('https://res.cloudinary.com/demo/image/upload/v1/campushub/%2E%2E/secret.png') !== null) {
      throw new Error('Encoded traversal %2E%2E was not rejected!');
    }
    if (extractCloudinaryAssetInfo('https://res.cloudinary.com/demo/image/upload/v1/..%2Fsecret.png') !== null) {
      throw new Error('Traversal ..%2F was not rejected!');
    }
    console.log('✓ Path traversal attempts safely rejected.');

    // Malformed percent encoding (MUST be rejected without throwing)
    if (extractCloudinaryAssetInfo('https://res.cloudinary.com/demo/image/upload/v1/%E0%A4%A/file.png') !== null) {
      throw new Error('Invalid percent encoding was not rejected!');
    }
    if (extractCloudinaryAssetInfo('https://res.cloudinary.com/demo/image/upload/v1/%ZZ/file.png') !== null) {
      throw new Error('Malformed percent sequence %ZZ was not rejected!');
    }
    console.log('✓ Malformed percent encodings safely rejected with null.\n');

    // -----------------------------------------------------------------
    // 2. Unconfigured Cloudinary: Return false & Preserve Metadata
    // -----------------------------------------------------------------
    console.log('[TEST 2] Testing unconfigured Cloudinary behavior...');
    clearCredentials();

    const unconfUrl = 'https://res.cloudinary.com/demo/image/upload/v1234/campushub/test/unconf-file.png';
    const unconfDoc = await MediaFile.create({
      filename: `unconf-${Date.now()}.png`,
      originalname: 'unconf.png',
      mimetype: 'image/png',
      size: 120,
      data: Buffer.from('unconf test data'),
      cloudinaryUrl: unconfUrl,
      cloudinaryPublicId: 'campushub/test/unconf-file',
    });
    testCreatedIds.push(unconfDoc._id);

    const unconfResult = await deleteStoredFile(unconfUrl);
    if (unconfResult !== false) {
      throw new Error('deleteStoredFile must return false when Cloudinary is not configured');
    }

    const unconfCheck = await MediaFile.findById(unconfDoc._id);
    if (!unconfCheck) {
      throw new Error('MediaFile must NOT be deleted when Cloudinary is not configured');
    }
    console.log('✓ Unconfigured Cloudinary returned false and preserved MediaFile document.\n');

    // -----------------------------------------------------------------
    // 3. Stored cloudinaryPublicId Lookup & Deletion
    // -----------------------------------------------------------------
    console.log('[TEST 3] Testing deleteStoredFile with stored cloudinaryPublicId...');
    setMockCredentials();

    const testUrl1 = 'https://res.cloudinary.com/demo/image/upload/v1234/campushub/test/test-file-stored.png';
    const testPublicId1 = 'campushub/test/test-file-stored';

    const created1 = await MediaFile.create({
      filename: `test-stored-${Date.now()}.png`,
      originalname: 'test.png',
      mimetype: 'image/png',
      size: 100,
      data: Buffer.from('test data'),
      cloudinaryUrl: testUrl1,
      cloudinaryPublicId: testPublicId1,
    });
    testCreatedIds.push(created1._id);

    let destroyedPublicId = null;
    let destroyedOptions = null;
    cloudinary.uploader.destroy = async (pubId, opts) => {
      destroyedPublicId = pubId;
      destroyedOptions = opts;
      return { result: 'ok' };
    };

    const success1 = await deleteStoredFile(testUrl1);
    if (!success1) throw new Error('deleteStoredFile returned false for stored publicId asset');
    if (destroyedPublicId !== testPublicId1) {
      throw new Error(`Expected destroy called with "${testPublicId1}", got "${destroyedPublicId}"`);
    }
    if (destroyedOptions?.resource_type !== 'image') {
      throw new Error(`Expected resource_type: 'image', got "${destroyedOptions?.resource_type}"`);
    }

    const check1 = await MediaFile.findById(created1._id);
    if (check1) throw new Error('MediaFile record was not removed after successful deletion');
    console.log('✓ Exact stored cloudinaryPublicId used for destruction and MediaFile removed.\n');

    // -----------------------------------------------------------------
    // 4. Legacy Record Fallback & Video Resource Type
    // -----------------------------------------------------------------
    console.log('[TEST 4] Testing legacy record fallback and video resource type...');
    const testVideoUrl = 'https://res.cloudinary.com/demo/video/upload/v1792004323/campushub/legacy/lecture.mp4';
    const expectedVideoPublicId = 'campushub/legacy/lecture';

    const created2 = await MediaFile.create({
      filename: `legacy-video-${Date.now()}.mp4`,
      originalname: 'lecture.mp4',
      mimetype: 'video/mp4',
      size: 500,
      data: Buffer.from('video data'),
      cloudinaryUrl: testVideoUrl,
      cloudinaryPublicId: '', // simulated older legacy record
    });
    testCreatedIds.push(created2._id);

    let legacyDestroyedId = null;
    let legacyDestroyedOpts = null;
    cloudinary.uploader.destroy = async (pubId, opts) => {
      legacyDestroyedId = pubId;
      legacyDestroyedOpts = opts;
      return { result: 'ok' };
    };

    const success2 = await deleteStoredFile(testVideoUrl);
    if (!success2) throw new Error('deleteStoredFile returned false for legacy record');
    if (legacyDestroyedId !== expectedVideoPublicId) {
      throw new Error(`Expected destroy called with fallback "${expectedVideoPublicId}", got "${legacyDestroyedId}"`);
    }
    if (legacyDestroyedOpts?.resource_type !== 'video') {
      throw new Error(`Expected resource_type: 'video', got "${legacyDestroyedOpts?.resource_type}"`);
    }

    const check2 = await MediaFile.findById(created2._id);
    if (check2) throw new Error('Legacy MediaFile was not removed');
    console.log('✓ Legacy record safely resolved publicId and video resource_type.\n');

    // -----------------------------------------------------------------
    // 5. Cloudinary "not found" Response Handling
    // -----------------------------------------------------------------
    console.log('[TEST 5] Testing Cloudinary "not found" response handling...');
    const notFoundUrl = 'https://res.cloudinary.com/demo/image/upload/v1234/campushub/test/already-gone.png';
    const notFoundDoc = await MediaFile.create({
      filename: `notfound-${Date.now()}.png`,
      originalname: 'gone.png',
      mimetype: 'image/png',
      size: 90,
      data: Buffer.from('gone'),
      cloudinaryUrl: notFoundUrl,
      cloudinaryPublicId: 'campushub/test/already-gone',
    });
    testCreatedIds.push(notFoundDoc._id);

    cloudinary.uploader.destroy = async () => ({ result: 'not found' });

    const notFoundResult = await deleteStoredFile(notFoundUrl);
    if (!notFoundResult) {
      throw new Error('deleteStoredFile should succeed when Cloudinary reports asset already "not found"');
    }
    const notFoundCheck = await MediaFile.findById(notFoundDoc._id);
    if (notFoundCheck) {
      throw new Error('MediaFile should be cleaned up when Cloudinary confirms asset is "not found"');
    }
    console.log('✓ "not found" status explicitly handled, cleaned up metadata, and returned true.\n');

    // -----------------------------------------------------------------
    // 6. Cloudinary Deletion Failure / Non-Success Handling
    // -----------------------------------------------------------------
    console.log('[TEST 6] Testing Cloudinary deletion failure handling...');
    const failUrl = 'https://res.cloudinary.com/demo/image/upload/v1234/campushub/fail/file-fail.png';
    const failDoc = await MediaFile.create({
      filename: `fail-${Date.now()}.png`,
      originalname: 'fail.png',
      mimetype: 'image/png',
      size: 150,
      data: Buffer.from('fail test'),
      cloudinaryUrl: failUrl,
      cloudinaryPublicId: 'campushub/fail/file-fail',
    });
    testCreatedIds.push(failDoc._id);

    // Simulate Cloudinary failure
    cloudinary.uploader.destroy = async () => {
      throw new Error('Simulated Cloudinary API 500 Network Timeout');
    };

    const failResult = await deleteStoredFile(failUrl);
    if (failResult !== false) {
      throw new Error('deleteStoredFile should return false on Cloudinary deletion failure');
    }

    const failCheck = await MediaFile.findById(failDoc._id);
    if (!failCheck) {
      throw new Error('MediaFile must NOT be deleted if Cloudinary deletion failed');
    }
    console.log('✓ Cloudinary deletion failure safely preserved database record and returned false.\n');

    // -----------------------------------------------------------------
    // 7. Lookalike Hostname via deleteStoredFile
    // -----------------------------------------------------------------
    console.log('[TEST 7] Testing lookalike hostname handling in deleteStoredFile...');
    const lookalikeUrl = 'https://evilcloudinary.com/demo/image/upload/v1234/campushub/fake.png';
    const lookalikeDoc = await MediaFile.create({
      filename: `lookalike-${Date.now()}.png`,
      originalname: 'fake.png',
      mimetype: 'image/png',
      size: 80,
      data: Buffer.from('fake'),
      cloudinaryUrl: lookalikeUrl,
      cloudinaryPublicId: 'campushub/fake',
    });
    testCreatedIds.push(lookalikeDoc._id);

    let lookalikeDestroyCalled = false;
    cloudinary.uploader.destroy = async () => {
      lookalikeDestroyCalled = true;
      return { result: 'ok' };
    };

    const lookalikeResult = await deleteStoredFile(lookalikeUrl);
    if (lookalikeResult !== false) {
      throw new Error('deleteStoredFile must return false for lookalike hostnames');
    }
    if (lookalikeDestroyCalled) {
      throw new Error('Cloudinary destroy was erroneously called for an unmanaged lookalike domain!');
    }
    const lookalikeCheck = await MediaFile.findById(lookalikeDoc._id);
    if (!lookalikeCheck) {
      throw new Error('Lookalike MediaFile must not be deleted by storageService');
    }
    console.log('✓ Lookalike domain safely ignored without remote call or DB deletion.\n');

    // -----------------------------------------------------------------
    // 8. Local / MongoDB Upload & Protected Seed File Behavior
    // -----------------------------------------------------------------
    console.log('[TEST 8] Testing local / MongoDB upload cleanup and protected files...');

    const demoResult = await deleteStoredFile('/uploads/demo-avatar.png');
    const sampleResult = await deleteStoredFile('/uploads/sample-proof.jpg');
    if (demoResult !== false || sampleResult !== false) {
      throw new Error('Protected demo / sample file was not protected');
    }
    console.log('✓ Demo and sample files safely protected from deletion.');

    const extResult = await deleteStoredFile('https://images.unsplash.com/photo-1534528741775-53994a69daeb');
    if (extResult !== false) {
      throw new Error('External unmanaged URL should return false');
    }
    console.log('✓ External Unsplash URL safely ignored.');

    // MongoDB Binary Upload
    const localTestFilename = `file-test-binary-${Date.now()}.png`;
    const localTestUrl = `/uploads/${localTestFilename}`;
    const localDoc = await MediaFile.create({
      filename: localTestFilename,
      originalname: 'local-test.png',
      mimetype: 'image/png',
      size: 80,
      data: Buffer.from('local binary data'),
    });
    testCreatedIds.push(localDoc._id);

    const localSuccess = await deleteStoredFile(localTestUrl);
    if (!localSuccess) throw new Error('Failed to delete MongoDB local upload');
    const localCheck = await MediaFile.findById(localDoc._id);
    if (localCheck) throw new Error('MongoDB binary MediaFile was not removed');
    console.log('✓ MongoDB binary upload successfully cleaned up.\n');

    console.log('======================================================');
    console.log('   ALL 8 STORAGE DELETION TESTS PASSED SUCCESSFULLY!  ');
    console.log('======================================================');
  } finally {
    // Guaranteed cleanup of only the records created by this test run
    restoreEnv();
    if (testCreatedIds.length > 0) {
      await MediaFile.deleteMany({ _id: { $in: testCreatedIds } }).catch(() => {});
    }
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
