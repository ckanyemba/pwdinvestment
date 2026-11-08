import { env } from '../config/env.js';
import { MediaAsset } from '../models/MediaAsset.js';

// Legacy content references images as {{media:2016/01/Forex.jpg}}. The seed uploads those files to
// Cloudinary and records the mapping in MediaAsset; until then they are served from /media.
const TOKEN = /\{\{media:([^}]+)\}\}/g;

let cache = null;
let cacheAt = 0;

async function mediaMap() {
  if (!cache || Date.now() - cacheAt > 60_000) {
    const assets = await MediaAsset.find({}, { legacyPath: 1, url: 1 }).lean();
    cache = new Map(assets.map((a) => [a.legacyPath, a.url]));
    cacheAt = Date.now();
  }
  return cache;
}

export function clearMediaCache() {
  cache = null;
}

const fallback = (path) => `${env.PUBLIC_API_URL}/media/${path.split('/').map(encodeURIComponent).join('/')}`;

/** Deeply replace media tokens in any JSON-able value. */
export async function resolveMedia(value) {
  const map = await mediaMap();
  const swap = (s) => s.replace(TOKEN, (_, p) => map.get(p) || fallback(p));
  const walk = (v) => {
    if (typeof v === 'string') return v.includes('{{media:') ? swap(v) : v;
    if (Array.isArray(v)) return v.map(walk);
    // Only plain objects: leave ObjectId, Date, Buffer etc. for JSON serialisation.
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, walk(val)]));
    }
    return v;
  };
  return walk(value);
}
