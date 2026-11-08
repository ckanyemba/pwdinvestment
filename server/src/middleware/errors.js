import mongoose from 'mongoose';
import { ZodError } from 'zod';
import multer from 'multer';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    });
  }
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ error: `Invalid ${err.path}` });
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'A record with that value already exists', details: Object.keys(err.keyPattern || {}) });
  }
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message, details: err.details });
}
