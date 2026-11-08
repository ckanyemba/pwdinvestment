import crypto from 'node:crypto';
import { env } from '../config/env.js';

// AES-256-GCM field encryption for sensitive personal data (SA ID numbers, bank account numbers).
const PREFIX = 'enc:v1:';

function key() {
  const raw = env.ENCRYPTION_KEY;
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes (64 hex chars or base64)');
  return buf;
}

export function encrypt(plain) {
  if (plain == null || plain === '' || String(plain).startsWith(PREFIX)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}

export function decrypt(value) {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value;
  const buf = Buffer.from(value.slice(PREFIX.length), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

/** Deterministic keyed hash so encrypted fields can still be looked up / kept unique. */
export function blindIndex(value) {
  if (value == null || value === '') return undefined;
  return crypto.createHmac('sha256', key()).update(String(value).replace(/\s+/g, '').toLowerCase()).digest('hex');
}

export function mask(value, visible = 4) {
  if (!value) return value;
  const s = String(value);
  return s.length <= visible ? s : '•'.repeat(s.length - visible) + s.slice(-visible);
}
