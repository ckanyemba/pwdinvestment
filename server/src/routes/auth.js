import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { env } from '../config/env.js';
import { clearSession, issueSession, readSession } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';

const router = Router();
const google = new OAuth2Client();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });

/** Exchange a Google Identity Services ID token (credential) for an admin session cookie. */
router.post(
  '/google',
  loginLimiter,
  asyncHandler(async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, 'Google sign-in is not configured');
    const { credential } = z.object({ credential: z.string().min(10) }).parse(req.body);

    let payload;
    try {
      const ticket = await google.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new HttpError(401, 'Invalid Google credential');
    }

    const email = payload?.email?.toLowerCase();
    if (!email || !payload.email_verified) throw new HttpError(401, 'Google account email is not verified');
    if (!env.ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
      throw new HttpError(403, 'This Google account is not authorised for the admin area');
    }

    const user = { email, name: payload.name, picture: payload.picture };
    issueSession(res, user);
    res.json({ user });
  }),
);

router.get('/me', (req, res) => {
  const user = readSession(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user });
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
