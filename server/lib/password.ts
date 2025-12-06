/**
 * Password Utilities
 * 
 * Argon2 password hashing for user authentication.
 * Using argon2id variant (recommended for password hashing).
 */

import argon2 from 'argon2';
import { logger } from './logger';

const log = logger.child({ module: 'password' });

// Argon2 configuration (OWASP recommendations)
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,  // Hybrid of argon2i and argon2d
  memoryCost: 65536,       // 64 MB
  timeCost: 3,             // 3 iterations
  parallelism: 4,          // 4 parallel threads
};

/**
 * Hash a plain text password using Argon2id
 * 
 * @param plainPassword - The plain text password to hash
 * @returns The hashed password string
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    const hash = await argon2.hash(plainPassword, ARGON2_OPTIONS);
    return hash;
  } catch (error) {
    log.error({ error }, 'Failed to hash password');
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify a plain text password against a hash
 * 
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The stored hash to verify against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isValid = await argon2.verify(hashedPassword, plainPassword);
    return isValid;
  } catch (error) {
    log.error({ error }, 'Failed to verify password');
    return false;
  }
}

/**
 * Check if a hash needs to be rehashed (if options changed)
 * 
 * @param hashedPassword - The stored hash to check
 * @returns True if rehashing is needed
 */
export async function needsRehash(hashedPassword: string): Promise<boolean> {
  try {
    return argon2.needsRehash(hashedPassword, ARGON2_OPTIONS);
  } catch (error) {
    return false;
  }
}
