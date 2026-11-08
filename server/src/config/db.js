import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

// Cached across invocations so serverless runtimes reuse one connection.
let pending = null;

export function connectDB(uri = env.MONGODB_URI) {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!pending) {
    pending = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000 })
      .then((m) => m.connection)
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

export function disconnectDB() {
  pending = null;
  return mongoose.disconnect();
}
