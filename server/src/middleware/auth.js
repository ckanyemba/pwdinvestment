import jwt from 'jsonwebtoken';
import { env, isProd } from '../config/env.js';

export const SESSION_COOKIE = 'pmd_session';
const MAX_AGE_S = 8 * 60 * 60;

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.email, name: user.name, picture: user.picture, role: 'admin' }, env.JWT_SECRET, {
    expiresIn: MAX_AGE_S,
  });
  // The Next.js client proxies /api/* to this server, so the cookie is first-party on the site's domain.
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: MAX_AGE_S * 1000, path: '/' });
  return token;
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' });
}

export function readSession(req) {
  const header = req.get('authorization');
  const token = req.cookies?.[SESSION_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    // Re-check the allow-list so removing an email revokes access immediately.
    if (!env.ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(String(payload.sub).toLowerCase())) return null;
    return { email: payload.sub, name: payload.name, picture: payload.picture, role: payload.role };
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const user = readSession(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.user = user;
  next();
}
