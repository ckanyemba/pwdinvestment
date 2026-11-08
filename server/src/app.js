import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import publicRoutes from './routes/public.js';
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin/index.js';
import { errorHandler, notFound } from './middleware/errors.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Vercel / Render / Next.js rewrites
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.CLIENT_ORIGINS.includes(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ ok: true }));

  // Legacy WordPress images until they are migrated to Cloudinary by `npm run seed`.
  app.use('/media', express.static(path.join(here, '..', 'seed', 'media'), { maxAge: '30d', immutable: true }));

  // Ensure a DB connection for API calls (no-op once connected; needed for serverless cold starts).
  app.use('/api', (req, res, next) => connectDB().then(() => next(), next));
  app.use('/api', publicRoutes);
  app.use('/api', formRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
