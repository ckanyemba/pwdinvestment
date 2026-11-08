/**
 * Local development without installing MongoDB: starts an in-memory MongoDB, seeds it from
 * seed/content.json and runs the API. Data is lost when the process exits.
 *
 *   npm run dev:memory
 */
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mongo = await MongoMemoryServer.create();

const env = {
  ...process.env,
  MONGODB_URI: mongo.getUri('pmd'),
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
};

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${args.join(' ')} exited with ${code}`))));
  });

await run(['--env-file-if-exists=.env', 'scripts/seed.js', '--no-media']);
console.log(`In-memory MongoDB at ${env.MONGODB_URI}`);

const api = spawn(process.execPath, ['--env-file-if-exists=.env', 'src/index.js'], { cwd: root, env, stdio: 'inherit' });
const stop = async () => {
  api.kill();
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
api.on('exit', stop);
