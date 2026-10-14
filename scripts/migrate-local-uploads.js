import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDB } from '../backend/config/db.js';
import MediaFile from '../backend/models/MediaFile.js';
import { isCloudinaryConfigured } from '../backend/services/storageService.js';
import { v2 as cloudinary } from 'cloudinary';

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

async function migrate() {
  console.log('--- Migrating Accessible Local Files to Persistent Storage ---');
  await connectDB();
  console.log('✓ Connected to MongoDB Atlas');

  const uploadDir = path.resolve(__dirname, '../backend/uploads');
  if (!fs.existsSync(uploadDir)) {
    console.log('No backend/uploads directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(uploadDir).filter(f => f.startsWith('file-'));
  console.log(`Found ${files.length} local files in backend/uploads.`);

  const cldConfigured = isCloudinaryConfigured();
  console.log(`Cloudinary configured: ${cldConfigured}`);

  let migratedCount = 0;
  let alreadyExistCount = 0;

  for (const filename of files) {
    const filePath = path.join(uploadDir, filename);
    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimetype = MIME_MAP[ext] || 'application/octet-stream';

    // Check if already in MediaFile
    const existing = await MediaFile.findOne({ filename });
    if (existing && existing.data && existing.data.length > 0) {
      alreadyExistCount++;
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    let cloudinaryUrl = null;
    let cloudinaryPublicId = null;

    if (cldConfigured) {
      try {
        const uploadRes = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'campushub/migrated',
              resource_type: ext === '.pdf' ? 'raw' : 'image',
              public_id: filename.replace(/\.[^/.]+$/, ''),
            },
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
          stream.end(buffer);
        });
        cloudinaryUrl = uploadRes.secure_url;
        cloudinaryPublicId = uploadRes.public_id;
        console.log(`  ✓ Cloudinary uploaded: ${filename} -> ${cloudinaryUrl}`);
      } catch (cldErr) {
        console.warn(`  ! Cloudinary upload failed for ${filename}, falling back to MongoDB binary:`, cldErr.message);
      }
    }

    await MediaFile.findOneAndUpdate(
      { filename },
      {
        filename,
        originalname: filename,
        mimetype,
        size: stat.size,
        data: buffer,
        cloudinaryUrl,
        cloudinaryPublicId,
      },
      { upsert: true, new: true }
    );

    migratedCount++;
    console.log(`  ✓ Persisted to MongoDB Atlas MediaFile: ${filename} (${stat.size} bytes)`);
  }

  console.log(`\nMigration completed: ${migratedCount} newly persisted, ${alreadyExistCount} already existed.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
