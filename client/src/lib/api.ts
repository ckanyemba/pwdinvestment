import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { EventItem, Page, Post, SiteResponse, Testimonial } from './types';
import { FALLBACK_SITE } from './fallback';

// Server-side data access with Cache Components. Results are cached ('use cache') and tagged so
// the admin can purge them via /api/revalidate. The browser instead goes through the /api rewrite.
const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
export const CONTENT_TAG = 'content';
/** Param returned by generateStaticParams when the API has no rows; the page renders notFound(). */
export const PLACEHOLDER_SLUG = '__placeholder__';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`);
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

// Errors must not escape a 'use cache' scope: Next.js fails the prerender even if a caller catches
// them. So failures come back as values and are rethrown outside the cache. (A shorter cacheLife for
// failures would make the entry dynamic and block prerendering, so they expire on the same schedule.)
async function fetchCached<T>(path: string): Promise<Result<T>> {
  'use cache';
  cacheTag(CONTENT_TAG);
  cacheLife('minutes');
  try {
    return { ok: true, data: await request<T>(path) };
  } catch (err) {
    return { ok: false, status: err instanceof ApiError ? err.status : 0, message: (err as Error).message };
  }
}

async function cached<T>(path: string, { nullOn404 = false } = {}): Promise<T | null> {
  const result = await fetchCached<T>(path);
  if (result.ok) return result.data;
  if (nullOn404 && result.status === 404) return null;
  throw new ApiError(result.status, result.message);
}

const one = <T>(path: string) => cached<T>(path, { nullOn404: true });
const many = async <T>(path: string) => (await cached<T>(path)) as T;

/** For build-time helpers (layout chrome, sitemap, static params) that must survive an offline API. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[api]', (err as Error).message);
    return fallback;
  }
}

/** Current year, cached so it can be used in the prerendered footer. */
export async function getYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

export const getSite = () => safe(() => many<SiteResponse>('/site'), FALLBACK_SITE);
export const getPages = () => many<Pick<Page, 'slug' | 'title' | 'excerpt' | 'heroImage' | 'updatedAt'>[]>('/pages');
export const getPage = (slug: string) => one<Page>(`/pages/${encodeURIComponent(slug)}`);
export const getPosts = () => many<Post[]>('/posts');
export const getPost = (slug: string) => one<Post>(`/posts/${encodeURIComponent(slug)}`);
export const getEvents = (when?: 'upcoming' | 'past') => many<EventItem[]>(`/events${when ? `?when=${when}` : ''}`);
export const getTestimonials = () => many<Testimonial[]>('/testimonials');
