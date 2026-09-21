import mongoose from 'mongoose';

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null, lastFailureTime: 0 };
}

const FAILURE_COOLDOWN_MS = 15000; // Do not freeze incoming requests for 15s after a connection failure

/**
 * Serverless-safe MongoDB connection.
 * Reuses the connection across warm Lambda invocations with circuit-breaker fail-fast.
 */
export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  // Circuit breaker: fail immediately if recent connection attempt failed
  const now = Date.now();
  if (cached.lastFailureTime && now - cached.lastFailureTime < FAILURE_COOLDOWN_MS) {
    throw new Error('Database is temporarily unavailable (circuit breaker active).');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured in your .env file.');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 15,
      serverSelectionTimeoutMS: 2000, // Fast failover (2s max)
      socketTimeoutMS: 20000,
    };
    cached.promise = mongoose.connect(uri, opts)
      .then((m) => {
        cached.lastFailureTime = 0;
        return m;
      })
      .catch((err) => {
        cached.lastFailureTime = Date.now();
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  return cached.conn;
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
