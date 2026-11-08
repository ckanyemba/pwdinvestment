'use client';

// Browser-side fetch helper: calls go to the same-origin /api proxy, so the admin session cookie
// set by the Express server is first-party.
export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ClientApiError(res.status, data.error || `Request failed (${res.status})`, data.details);
  return data as T;
}

/** Tell Next.js to drop cached public content after an admin edit. */
export function revalidateContent() {
  return fetch('/api/revalidate', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
}
