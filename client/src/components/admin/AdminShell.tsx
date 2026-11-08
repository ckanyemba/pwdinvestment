'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, ClientApiError } from '@/lib/client-api';
import { cx } from '@/lib/format';
import type { AdminUser } from '@/lib/types';
import { RESOURCES } from './resources';

const AdminContext = createContext<{ user: AdminUser; signOut: () => void } | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

function SignIn({ googleClientId, onSignedIn }: { googleClientId: string; onSignedIn: (u: AdminUser) => void }) {
  const [error, setError] = useState<string>();
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist p-4">
      <div className="card w-full max-w-sm text-center">
        <Image src="/logo.png" alt="PMD Investment Academy" width={220} height={78} className="mx-auto h-14 w-auto" />
        <h1 className="mt-6 text-xl font-bold">Staff sign in</h1>
        <p className="mt-2 text-sm text-grey">Use your authorised PMD Google account.</p>
        <div className="mt-6 flex justify-center">
          {googleClientId ? (
            <GoogleLogin
              onSuccess={async ({ credential }) => {
                setError(undefined);
                try {
                  const { user } = await apiFetch<{ user: AdminUser }>('/auth/google', { method: 'POST', json: { credential } });
                  onSignedIn(user);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
              onError={() => setError('Google sign-in failed. Please try again.')}
            />
          ) : (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">GOOGLE_CLIENT_ID is not configured.</p>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

const GROUPS = ['CRM', 'Submissions', 'Content'] as const;

function Sidebar({ user, signOut }: { user: AdminUser; signOut: () => void }) {
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={cx('block rounded px-3 py-2 text-sm', pathname === href || (href !== '/admin' && pathname.startsWith(href)) ? 'bg-green text-white' : 'text-white/80 hover:bg-white/10')}
    >
      {label}
    </Link>
  );
  return (
    <aside className="flex w-full shrink-0 flex-col bg-navy p-4 text-white md:min-h-screen md:w-60">
      <Link href="/admin" className="font-heading text-lg font-bold">
        PMD Admin
      </Link>
      <nav className="mt-6 flex-1 space-y-6" aria-label="Admin">
        <div>{link('/admin', 'Dashboard')}</div>
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/50">{g}</p>
            <div className="mt-2 space-y-1">
              {RESOURCES.filter((r) => r.group === g).map((r) => link(`/admin/${r.key}`, r.label))}
              {g === 'Content' && link('/admin/settings', 'Site settings')}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-6 border-t border-white/10 pt-4 text-sm">
        <p className="truncate font-semibold">{user.name || user.email}</p>
        <p className="truncate text-xs text-white/60">{user.email}</p>
        <div className="mt-3 flex gap-3 text-xs">
          <Link href="/" className="text-white/70 hover:text-white">View site</Link>
          <button type="button" onClick={signOut} className="text-white/70 hover:text-white">Sign out</button>
        </div>
      </div>
    </aside>
  );
}

export function AdminShell({ googleClientId, children }: { googleClientId: string; children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiFetch<{ user: AdminUser }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch((err) => {
        if (!(err instanceof ClientApiError && err.status === 401)) console.error(err);
      })
      .finally(() => setChecking(false));
  }, []);

  const signOut = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  if (checking) return <div className="flex min-h-screen items-center justify-center text-grey">Loading…</div>;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {user ? (
        <AdminContext.Provider value={{ user, signOut }}>
          <div className="flex min-h-screen flex-col bg-mist md:flex-row">
            <Sidebar user={user} signOut={signOut} />
            <div className="min-w-0 flex-1 p-4 md:p-8">{children}</div>
          </div>
        </AdminContext.Provider>
      ) : (
        <SignIn googleClientId={googleClientId} onSignedIn={setUser} />
      )}
    </GoogleOAuthProvider>
  );
}
