import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt()
 * @param encryptedData - Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  const key = Buffer.from(config.encryptionKey, 'hex');
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Create a SHA-256 hash of a string
 * @param text - Text to hash
 * @returns Hex-encoded hash
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a random hex string
 * @param bytes - Number of random bytes (default 32)
 * @returns Hex-encoded random string
 */
export function generateRandomKey(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
