import { env } from '../config/env.js';

/**
 * Verify a reCAPTCHA v3 token. When RECAPTCHA_SECRET is unset (local dev) verification is skipped.
 * Throws a 400 error when the token is missing, invalid or scores too low.
 */
export async function verifyRecaptcha(token, expectedAction, remoteIp) {
  if (!env.RECAPTCHA_SECRET) return { skipped: true };
  if (!token) throw Object.assign(new Error('reCAPTCHA token missing'), { status: 400 });

  const body = new URLSearchParams({ secret: env.RECAPTCHA_SECRET, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body });
  const data = await res.json();

  const actionOk = !expectedAction || !data.action || data.action === expectedAction;
  const scoreOk = data.score === undefined || data.score >= env.RECAPTCHA_MIN_SCORE;
  if (!data.success || !actionOk || !scoreOk) {
    throw Object.assign(new Error('reCAPTCHA verification failed'), { status: 400 });
  }
  return data;
}
