/**
 * Imports the content migrated from the legacy WordPress site (seed/content.json) into MongoDB and,
 * when CLOUDINARY_URL is set, uploads the referenced images (seed/media) to Cloudinary.
 *
 *   npm run seed              # upsert content; keeps anything edited in the admin
 *   npm run seed -- --force   # overwrite pages/posts/events/testimonials/settings from the seed
 *   npm run seed -- --no-media
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { cloudinaryEnabled, uploadBuffer } from '../src/config/cloudinary.js';
import { Event, Page, Post, Setting, Testimonial } from '../src/models/content.js';
import { MediaAsset } from '../src/models/MediaAsset.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed');
const force = process.argv.includes('--force');
const skipMedia = process.argv.includes('--no-media');

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function migrateMedia() {
  if (skipMedia) return console.log('media: skipped (--no-media)');
  if (!cloudinaryEnabled) return console.log('media: CLOUDINARY_URL not set — images will be served from /media');
  const mediaDir = path.join(root, 'media');
  const files = await walk(mediaDir);
  let uploaded = 0;
  for (const file of files) {
    const legacyPath = path.relative(mediaDir, file).split(path.sep).join('/');
    if (!force && (await MediaAsset.exists({ legacyPath }))) continue;
    const publicId = legacyPath.replace(/\.[^.]+$/, '').replace(/[^\w/-]/g, '_');
    const result = await uploadBuffer(await fs.readFile(file), { folder: 'legacy', publicId, resourceType: 'image' });
    await MediaAsset.findOneAndUpdate(
      { legacyPath },
      {
        legacyPath,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        originalName: path.basename(file),
        uploadedBy: 'seed',
      },
      { upsert: true },
    );
    uploaded++;
    process.stdout.write(`\rmedia: uploaded ${uploaded}`);
  }
  console.log(`\nmedia: ${uploaded} uploaded, ${files.length - uploaded} already present`);
}

async function upsert(Model, docs, key) {
  let created = 0;
  let updated = 0;
  for (const doc of docs) {
    const filter = { [key]: doc[key] };
    const exists = await Model.exists(filter);
    if (exists && !force) continue;
    await Model.findOneAndUpdate(filter, doc, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
    exists ? updated++ : created++;
  }
  console.log(`${Model.modelName}: ${created} created, ${updated} updated, ${docs.length - created - updated} unchanged`);
}

async function main() {
  const content = JSON.parse(await fs.readFile(path.join(root, 'content.json'), 'utf8'));
  await connectDB();

  await migrateMedia();
  await upsert(Setting, [{ key: 'site', value: content.site }, { key: 'home', value: content.home }], 'key');
  await upsert(Page, content.pages, 'slug');
  await upsert(Post, content.posts, 'slug');
  await upsert(Event, content.events, 'slug');
  await upsert(
    Testimonial,
    content.testimonials.map((t, i) => ({ ...t, order: i })),
    'legacyId',
  );

  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
