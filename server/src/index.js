import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

const app = createApp();

connectDB()
  .then(() => {
    app.listen(env.PORT, () => console.log(`PMD API listening on http://localhost:${env.PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
