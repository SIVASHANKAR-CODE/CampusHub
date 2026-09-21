/**
 * Local development server entry point.
 * NOT used in Vercel production (which uses api/index.js).
 * 
 * Run: node server.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
import { connectDB } from './config/db.js';

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 5000;

async function isCampusHubAlreadyRunning() {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/api/health?json=1`, {
      signal: AbortSignal.timeout(1000),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.success === true && body?.message === 'CampusHub API is running.';
  } catch {
    return false;
  }
}

if (await isCampusHubAlreadyRunning()) {
  console.log(`CampusHub backend is already running at http://localhost:${PORT}. Reusing the existing instance.`);
  process.exit(0);
}

connectDB()
  .then(() => {
    console.log('📦 Connected to MongoDB Atlas successfully.');
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB unavailable at startup. Continuing in demo mode with local demo accounts.');
    console.warn(`Reason: ${err.message}`);
  });

const server = app.listen(PORT, '0.0.0.0', () => {
  const frontendUrl = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || 'https://campushub.vercel.app')
    : 'http://localhost:5175';

  console.log(`\n============================================================`);
  console.log(`🚀 CampusHub backend started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🗄️ MongoDB: ${process.env.MONGODB_URI ? 'configured' : 'missing'}`);
  console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
  console.log(`🔑 Gemini API key loaded: ${Boolean(process.env.GEMINI_API_KEY)}`);
  console.log(`🧠 Gemini model: ${process.env.GEMINI_MODEL || 'gemini-3.6-flash'}`);
  console.log(`👉 Open Web Application:  ${frontendUrl}`);
  console.log(`📡 Backend REST API:     http://localhost:${PORT}`);
  console.log(`============================================================\n`);
});

// Graceful shutdown to ensure port is released promptly on restarts
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

