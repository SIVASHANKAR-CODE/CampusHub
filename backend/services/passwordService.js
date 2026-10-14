import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 65536,
  timeCost: parseInt(process.env.ARGON2_TIME_COST) || 3,
  parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 4,
};

/**
 * Hash a password using Argon2id.
 * Never store the plain text password.
 */
export async function hashPassword(password) {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against its Argon2id hash.
 */
export async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}
