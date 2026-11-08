import { revalidateTag } from 'next/cache';
import { CONTENT_TAG } from '@/lib/api';

const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');

/**
 * Purges cached public content after an admin edit. The caller must hold a valid admin session,
 * which we confirm by forwarding its cookie to the Express API.
 */
export async function POST(request: Request) {
  const me = await fetch(`${API_URL}/api/auth/me`, {
    headers: { cookie: request.headers.get('cookie') ?? '' },
    cache: 'no-store',
  });
  if (!me.ok) return Response.json({ error: 'Authentication required' }, { status: 401 });

  revalidateTag(CONTENT_TAG, 'max');
  return Response.json({ revalidated: true });
}
